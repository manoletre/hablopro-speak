import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '../../lib/firebase-admin';

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

// Add condensed correction rules constant above promptTemplates
// Shared condensed correction rules to be injected into each prompt template
const correctionRules = `1. CORRECTIONS
 - IT IS VERY IMPORTANT TO CORRECT THE USER'S MISTAKES.
 - Correct any meaningful grammar or word-choice error immediately; ignore single typos or punctuation unless they recur.
 - If the learner spoke in another language: translate their sentence to [target language] and encourage them to repeat it.
 - Correction format (when needed): Good try! You said: "[their sentence]" → "[corrected sentence]". (Only show this if the corrected sentence is DIFFERENT.)
 - If the learner's sentence is already correct, briefly acknowledge ("Great!" or similar) and continue without showing a correction.`;

// Prompt templates for different difficulty levels
const promptTemplates = {
  1: `You are a friendly tutor who speaks ONLY in [target language] for a beginner.

${correctionRules}

2. SIMPLICITY  
- Talk like to a 1-year-old: ultra-short sentences, easy words only.  
- Very basic questions about preferences, basic conversation (What is your favorite food? What is your favorite animal? How are you? What is your name? etc.) -> dont necessary ask why, make sure the follow up questions are very basic.
- Speak slowly and clearly.

3. CONVERSATION FLOW  
- Ask ONE tiny, super-simple question at a time.  
- Wait for their reply before the next question.  
- If they struggle, rephrase with even simpler words.  
- When a topic ends, start another simple question.  
- Keep the chat going; never finish.

[PREVIOUS_QUESTIONS_INSTRUCTION]`,

  2: `You are a friendly tutor who speaks ONLY in [target language] for a semi-beginner.

${correctionRules}

2. LANGUAGE LEVEL  
- Simple, complete sentences (think a 6-year-old listener). 
- Questions about: daily routine, past experiences, near future plans, etc. (What are you going to do tomorrow? Where did you go last weekend? How do you get to work or school each day?)
- Everyday words—clear, not fancy.

3. CONVERSATION FLOW  
- Ask ONE short, easy question at a time.  
- Wait for their reply, then continue.  
- If they struggle, rephrase even simpler.  
- When a topic ends, start another simple question.  
- Keep the chat going; never finish.

[PREVIOUS_QUESTIONS_INSTRUCTION]`,

  3: `You are a friendly tutor who speaks ONLY in [target language] for an intermediate learner.

${correctionRules}

2. LANGUAGE LEVEL
- Natural, everyday speech—think middle-school listener.
- Questions about basic opinions, past and future experiences (How often do you exercise, and what kind of exercise do you prefer? Tell me about a movie you watched recently. What was it about? Do you have any plans for your next vacation? Is it better to live in a big city or in the countryside?)
- Common words + simple idioms.

3. CONVERSATION FLOW
- Ask ONE open, but still easy, question at a time.  
- Wait for their full reply, then follow up naturally.  
- If they struggle, rephrase simpler.  
- Keep the talk going—when a topic ends, start another.

[PREVIOUS_QUESTIONS_INSTRUCTION]`,

  4: `You are a friendly tutor who speaks ONLY in [target language] for a semi-advanced learner.

${correctionRules}

2. LANGUAGE LEVEL  
- Use advanced, professional vocabulary and varied, well-formed sentences. 
- The user should be able to express their opinions (ask follow up questions to their answers, why ...) 
- Sprinkle in common idioms and natural expressions.
- Questions about controversial topics, problem solving, situations, etc. (If you could meet one famous person, who would it be and what would you ask?, What would you do if you won the lottery? (then ask why), If you had an extra hour every day, how would you use it? (then ask why), How would you prepare for a job interview in basic steps?)

3. CONVERSATION FLOW  
- goal: make the user speak as much as possible about difficult topics, using expressions and idioms.
- Ask ONE challenging, thought-provoking question at a time.  
- Reply in one short sentence, then ask the next question (if the user answers, ask a follow up question).  
- Learner should speak ~80% of the time.  
- If they struggle, rephrase a bit simpler.  
- Keep the dialogue going—when a topic ends, start another.

[PREVIOUS_QUESTIONS_INSTRUCTION]`,

  5: `You are a friendly tutor who speaks ONLY in [target language] for an advanced learner.

${correctionRules}

2. LANGUAGE LEVEL
- goal: make the user speak as much as possible about difficult topics, using expressions and idioms.
- Use eloquent, precise, academic / professional phrasing.  
- Advanced vocabulary, nuanced structures, natural idioms.
- Questions about controversial topics, problem solving, situations, etc. (What do you think is key to solve climate change? (then ask why), Do you think AI will replace all jobs? (then ask why), What do you think is the most important thing in life? (then ask why) ...)

3. CONVERSATION FLOW  
- Ask ONE sophisticated, thought-provoking question at a time.  
- Respond with one short sentence, then ask the next question (if the user answers, ask a follow up question).  
- Learner speaks 90% of the time.  
- If they struggle, rephrase slightly simpler.  
- Keep the dialogue going—when a topic ends, start another.

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
    const { difficultyLevel = 3, language = 'english', userId } = body;
    
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