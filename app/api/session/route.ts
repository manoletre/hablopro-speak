import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '../../lib/firebase-admin';
import { BillingService } from '../../lib/billing';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to fetch user's last 5 questions for the current language
async function fetchLastQuestions(userId: string, language: string): Promise<string[]> {
  try {
    const questionsRef = db.collection(`users/${userId}/questions`);
    const snapshot = await questionsRef
      .where('language', '==', language)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    const questions: string[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.question) {
        questions.push(data.question);
      }
    });
    
    return questions;
  } catch (error) {
    console.error('Error fetching user questions:', error);
    return [];
  }
}

// Prompt templates for different difficulty levels
const promptTemplates = {
  1: `You are a friendly tutor who speaks ONLY in [target language] for a beginner.

1. SIMPLICITY  
- Talk like to a 1-year-old: ultra-short sentences, easy words only.  
- Speak slowly and clearly.

2. CORRECTIONS (gentle, brief)  
- Correct ONLY if the learner just spoke AND made a clear error  (pronunciation, grammar, word choice, or used the wrong language).  
- If the user speaks correctly, DO NOT correct them.
- If the user speaks in a language other than [target language], repeat what they said in [target language].
- Say what was wrong, show the fix, praise.

3. CONVERSATION FLOW  
- Ask ONE tiny, super-simple question at a time (e.g., “How are you?” “What did you do today?”).  
- Wait for their reply before the next question.  
- If they struggle, rephrase with even simpler words.  
- When a topic ends, start another simple question.  
- Keep the chat going; never finish.

[PREVIOUS_QUESTIONS_INSTRUCTION]`,

  2: `You are a friendly tutor who speaks ONLY in [target language] for a semi-beginner.

1. LANGUAGE LEVEL  
- Simple, complete sentences (think a 6-year-old listener).  
- Everyday words—clear, not fancy.

2. CORRECTIONS (gentle, brief)  
- Correct ONLY if the learner just spoke AND clearly erred  (pronunciation, grammar, word choice, or wrong language).  
- If the user speaks correctly, DO NOT correct them.
- If the user speaks in a language other than [target language], repeat what they said in [target language].
- Show the mistake, give the fix, add quick praise.

3. CONVERSATION FLOW  
- Ask ONE short, easy question at a time  (e.g., “What do you like to do on weekends?” “Who is in your family?”).  
- Wait for their reply, then continue.  
- If they struggle, rephrase even simpler.  
- When a topic ends, start another simple question.  
- Keep the chat going; never finish.

[PREVIOUS_QUESTIONS_INSTRUCTION]`,

  3: `You are a friendly tutor who speaks ONLY in [target language] for an intermediate learner.

1. LANGUAGE LEVEL
- Natural, everyday speech—think middle-school listener.  
- Common words + simple idioms; nothing too fancy.

2. CORRECTION RULE
- Correct ONLY right after the learner speaks AND makes a clear error  (pronunciation, grammar, word choice, or wrong language).  
- If the user speaks correctly, DO NOT correct them.
- If the user speaks in a language other than [target language], repeat what they said in [target language].
- Be brief and kind: point out the slip, show the fix, praise.

3. CONVERSATION FLOW
- Ask ONE open, but still easy, question at a time  (e.g., “What was the best part of your week?” “Describe a place you want to visit.”).  
- Wait for their full reply, then follow up naturally.  
- If they struggle, rephrase simpler.  
- Keep the talk going—when a topic ends, start another.

[PREVIOUS_QUESTIONS_INSTRUCTION]`,

  4: `You are a friendly tutor who speaks ONLY in [target language] for a semi-advanced learner.

1. LANGUAGE LEVEL  
- Use advanced, professional vocabulary and varied, well-formed sentences.  
- Sprinkle in idioms and natural expressions.

2. CORRECTION RULE  
- Correct ONLY right after the learner speaks AND makes a clear error (pronunciation, grammar, word choice, or wrong language).  
- If the user speaks correctly, DO NOT correct them.
- If the user speaks in a language other than [target language], repeat what they said in [target language].
- Be brief and kind: point out, fix, praise.

3. CONVERSATION FLOW  
- Ask ONE challenging, thought-provoking question at a time (e.g., “How has technology reshaped communication?”).  
- Reply in ≤ 2 short sentences, then ask the next question.  
- Learner should speak ~80% of the time.  
- If they struggle, rephrase a bit simpler.  
- Keep the dialogue going—when a topic ends, start another.

[PREVIOUS_QUESTIONS_INSTRUCTION]`,

  5: `You are a friendly tutor who speaks ONLY in [target language] for an advanced learner.

1. LANGUAGE LEVEL  
- Use eloquent, precise, academic / professional phrasing.  
- Advanced vocabulary, nuanced structures, natural idioms.

2. CORRECTION RULE  
- Correct ONLY right after the learner speaks AND makes a clear error (pronunciation, grammar, word choice, or wrong language).
- If the user speaks correctly, DO NOT correct them.
- If the user speaks in a language other than [target language], repeat what they said in [target language].
- Be gentle and brief: point out, fix, praise.

3. CONVERSATION FLOW  
- Ask ONE sophisticated, thought-provoking question at a time (e.g., “How might AI reshape global economic policy?”).  
- Respond with ≤ 1 short sentence, then ask the next question.  
- Learner speaks ≈ 90% of the time.  
- If they struggle, rephrase slightly simpler.  
- Keep dialogue endless—when a topic closes, start another.

[PREVIOUS_QUESTIONS_INSTRUCTION]`
};

// Language code mapping
const languageCodes: Record<string, string> = {
  'english': 'en',
  'español': 'es',
  'french': 'fr',
  'german': 'de',
  'italian': 'it',
  'portuguese': 'pt',
  'dutch': 'nl',
  'chinese': 'zh',
  'japanese': 'ja',
  'korean': 'ko'
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { difficultyLevel = 3, language = 'english', userId, maxSessionMinutes } = body;
    
    // Check billing - require userId for billing checks
    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user has enough minutes for the requested session length
    // Use the provided maxSessionMinutes or default to 1 minute minimum
    const requiredMinutes = maxSessionMinutes || 1;
    console.log(`Checking if user has ${requiredMinutes} minutes for session`);
    console.log('Request body:', body);
    
    try {
      const hasMinutes = await BillingService.hasEnoughMinutes(userId, requiredMinutes);
      console.log(`User billing check result: ${hasMinutes}`);
      
      if (!hasMinutes) {
        const billing = await BillingService.getUserBilling(userId);
        const remainingMinutes = Math.floor(billing.secondsRemaining / 60);
        console.log(`User has ${billing.secondsRemaining} seconds (${remainingMinutes} minutes), needs ${requiredMinutes} minutes`);
        return NextResponse.json(
          { 
            error: 'Insufficient speaking time',
            remainingMinutes: remainingMinutes,
            remainingSeconds: billing.secondsRemaining,
            requiredMinutes: requiredMinutes,
            requiresUpgrade: true
          },
          { status: 402 } // Payment Required
        );
      }
      
      console.log(`User has sufficient minutes (${requiredMinutes} required), proceeding with session creation`);
    } catch (billingError) {
      console.error('Error checking user billing:', billingError);
      return NextResponse.json(
        { 
          error: 'Failed to verify billing status',
          details: billingError instanceof Error ? billingError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
    let prompt = promptTemplates[difficultyLevel as keyof typeof promptTemplates] || promptTemplates[3];
    
    // Handle Brazilian Portuguese specifically
    let targetLanguage = language;
    if (language.toLowerCase() === 'portuguese') {
      targetLanguage = 'Brazilian Portuguese (use Brazilian vocabulary, expressions, and pronunciation - for example: "você" instead of "tu", Brazilian slang, and cultural references from Brazil)';
    }
    
    prompt = prompt.replace('[target language]', targetLanguage);

    // Fetch previous questions if userId is provided
    let previousQuestionsInstruction = '';
    if (userId) {
      const lastQuestions = await fetchLastQuestions(userId, language);

      if (lastQuestions.length > 0) {
        previousQuestionsInstruction = `IMPORTANT: The user has recently been asked these questions in previous sessions. DO NOT ask any of these questions again:
${lastQuestions.map((q, i) => `${i + 1}. "${q}"`).join('\n')}

Make sure to ask completely different questions to keep the conversation fresh and engaging.`;
      } else {
        previousQuestionsInstruction = 'This appears to be one of the user\'s first sessions. Choose an engaging question to start the conversation.';
      }
    }

    prompt = prompt.replace('[PREVIOUS_QUESTIONS_INSTRUCTION]', previousQuestionsInstruction);

    const languageCode = languageCodes[language.toLowerCase()] || 'en';
    console.log("languageCode", languageCode);
    console.log("Previous questions avoided:", userId ? await fetchLastQuestions(userId, language) : 'No userId provided');

    const response = await openai.beta.realtime.sessions.create({
      model: 'gpt-4o-mini-realtime-preview',
      voice: 'ash',
      instructions: prompt,
      input_audio_transcription: {
        language: languageCode,
        model: 'gpt-4o-mini-transcribe',
      },
      turn_detection: { type: 'server_vad', silence_duration_ms: 2000 },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
} 