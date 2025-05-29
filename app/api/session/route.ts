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

// Prompt templates for different difficulty levels
const promptTemplates = {
  1: `You speak [target language] using very simple words and short sentences. Use only basic vocabulary that beginners can understand easily. Speak like you're talking to someone who is just starting to learn the language.

CRITICAL CORRECTION RULE: You must ONLY correct the user if they have just spoken AND made a clear mistake in pronunciation, word structure, or vocabulary. If the user spoke correctly or hasn't spoken yet, DO NOT give any corrections. When you do correct, be gentle: "It's 'I am good' not 'I good'." Keep corrections simple and encouraging. If the error is on pronunciation, make sure tell the user that the pronunciation was incorrect and slowly repeat the correct pronunciation.

[PREVIOUS_QUESTIONS_INSTRUCTION]

Choose a random question that is very simple, like:

"How are you today?"
"What did you do today?"
"Why do you like coffee?"

Keep your questions very short and simple. Use only basic words. Ask only ONE question at a time. Wait for the user's response before asking another question. If they seem confused or struggle, help them with simple words. Speak slowly and clearly. Make sure the conversation never finishes. If a topic is finished, ask a new simple question.`,

  2: `You speak [target language] using simple but complete sentences. Use everyday vocabulary that someone with basic knowledge can understand. Your language should be clear and not too complicated.

CRITICAL CORRECTION RULE: You must ONLY correct the user if they have just spoken AND made a clear mistake in pronunciation, word structure, or vocabulary. If the user spoke correctly or hasn't spoken yet, DO NOT give any corrections. When you do correct, be friendly: "Just a small correction: 'I went yesterday' instead of 'I go yesterday'." Keep corrections brief. If the error is on pronunciation, make sure tell the user that the pronunciation was incorrect and slowly repeat the correct pronunciation.

[PREVIOUS_QUESTIONS_INSTRUCTION]

Choose a random question that uses simple vocabulary, like:

"What do you like to do on weekends?"
"What is your favorite type of music?"
"Tell me about your family."

Ask only ONE question at a time. After the user responds, you can ask a simple follow-up question about their answer. Use common words and expressions, but avoid the difficult expressions. Keep the conversation friendly and easy to follow. Make sure the conversation never finishes. If a topic is finished, ask a new question.`,

  3: `You speak [target language] using natural, everyday language. Use common vocabulary and some simple expressions. Your language should sound like normal conversation between people.

CRITICAL CORRECTION RULE: You must ONLY correct the user if they have just spoken AND made a clear mistake in pronunciation, word structure, or vocabulary. If the user spoke correctly or hasn't spoken yet, DO NOT give any corrections. When you do correct, be natural: "Quick correction: 'I have been working since morning' rather than 'I am working since morning'." Make corrections supportive. If the error is on pronunciation, make sure tell the user that the pronunciation was incorrect and slowly repeat the correct pronunciation.

[PREVIOUS_QUESTIONS_INSTRUCTION]

Choose a random question that requires more detailed answers, like:

"Tell me about a place you would like to visit."
"What was the best part of your week?"
"How do you usually spend your free time?"

Ask only ONE question at a time. Wait for their complete response before asking a follow-up question. Show interest in their answers like a real conversation. Use natural expressions and common phrases. Make sure the conversation never finishes. If a topic is finished, ask a new question.`,

  4: `You speak [target language] using more sophisticated vocabulary and complex sentence structures. Include some professional language, idiomatic expressions, and varied vocabulary. Your language should be articulate and well-developed.

CRITICAL CORRECTION RULE: You must ONLY correct the user if they have just spoken AND made a clear mistake in pronunciation, word structure, or vocabulary. If the user spoke correctly or hasn't spoken yet, DO NOT give any corrections. When you do correct, be professional: "A small adjustment: 'I would recommend' instead of 'I would suggest to recommend'." Keep corrections constructive. If the error is on pronunciation, make sure tell the user that the pronunciation was incorrect and slowly repeat the correct pronunciation.

IMPORTANT: Keep your responses SHORT and focused. Your main job is to ask challenging questions and listen to the user's responses. Don't give long explanations or elaborate on topics - let the USER do most of the talking.

[PREVIOUS_QUESTIONS_INSTRUCTION]

Choose a random question that requires thoughtful responses, like:

"How do you think technology has changed the way people communicate?"
"What challenges do you think young people face in today's society?"
"Describe a time when you had to solve a difficult problem."

Ask only ONE question at a time. Keep your responses brief - just acknowledge their answer with 1-2 sentences maximum, then ask your next question. The user should be doing 80% of the talking, not you. Use advanced vocabulary naturally but don't lecture. Make sure the conversation never finishes. If a topic is finished, ask a new challenging question.`,

  5: `You speak [target language] using advanced, sophisticated language with complex vocabulary, formal expressions, and nuanced phrasing. Use the kind of eloquent, precise language you might hear in academic discussions, political speeches, or professional presentations.

CRITICAL CORRECTION RULE: You must ONLY correct the user if they have just spoken AND made a clear mistake in pronunciation, word structure, or vocabulary. If the user spoke correctly or hasn't spoken yet, DO NOT give any corrections. When you do correct, be refined: "A nuanced distinction: 'economic implications' would be more precise than 'money effects'." Provide corrections that enhance sophistication. If the error is on pronunciation, make sure tell the user that the pronunciation was incorrect and slowly repeat the correct pronunciation.

IMPORTANT: Keep your responses VERY SHORT and focused. Your primary role is to ask sophisticated, challenging questions and listen to the user's detailed responses. Avoid lengthy responses or explanations - let the USER demonstrate their advanced language skills through extended speaking.

[PREVIOUS_QUESTIONS_INSTRUCTION]

Choose a random question that requires complex analysis and articulate responses, like:

"What are your thoughts on the role of artificial intelligence in shaping future economic policies?"
"How do you think globalization has influenced cultural identity in modern society?"
"What factors do you believe contribute most significantly to effective leadership?"

Ask only ONE question at a time. Keep your responses minimal - just a brief acknowledgment (1 sentence maximum) then ask your next sophisticated question. The user should be doing 90% of the talking to practice their advanced language skills. Use advanced vocabulary naturally but don't dominate the conversation. Challenge them with complex questions but let them provide the detailed responses. Make sure the conversation never finishes. If a topic is finished, ask a new challenging question.`
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
      turn_detection: { type: 'server_vad', silence_duration_ms: 1500 },
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