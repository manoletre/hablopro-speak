import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { transcript, language } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Prepare the system prompt for generating feedback
    const systemPrompt = `You are a language tutor assistant.

You will receive a transcript of a language learning session. Your task is to generate feedback to help the learner improve their ${language || 'French'}. Structure your output as JSON.

IMPORTANT: Focus primarily on the language used by the learner (marked with "User:"). 
Analyze their grammar, vocabulary usage, and pronunciation hints from their written transcription.
Ignore any mistakes made by the assistant.

Return two sections:
1. **grammar**: Identify 1–3 grammar mistakes made by the learner (not the assistant). For each mistake, show:
   - "youSaid": the incorrect phrase they said
   - "better": the corrected version
   - "explanation": a simple explanation with an analogy or helpful trick if possible

2. **vocabulary**: Identify 1–3 useful words or phrases that came up in the conversation that would help the learner. For each word, include:
   - "word": the word or phrase
   - "type": e.g. "adv.", "noun", "verb"
   - "meaning": in English
   - "usage": a short explanation of when to use it
   - "example": a sample sentence using it

Make the tone friendly, helpful, and encouraging. Prioritize the most impactful improvements.`;

    // Call OpenAI to generate feedback
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Transcript:\n"""${transcript}"""\n\nProvide feedback in JSON format.` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content;
    
    // Parse the JSON response
    let feedbackData;
    try {
      feedbackData = JSON.parse(responseContent || '{}');
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      
      // Fallback data structure for error cases
      feedbackData = {
        grammar: [
          {
            youSaid: "J'aime le fromage, mais je n'aime pas viande",
            better: "J'aime le fromage, mais je n'aime pas la viande",
            explanation: "After 'pas', you usually need to repeat the article ('la viande'). Think of it like restarting the sentence: you're saying you like one thing and not another — both need their own articles."
          }
        ],
        vocabulary: [
          {
            word: "seulement",
            type: "adv.",
            meaning: "only",
            usage: "useful for setting limits or expectations",
            example: "J'ai seulement dix minutes."
          }
        ]
      };
    }

    // Ensure we have at least empty arrays
    feedbackData.grammar = feedbackData.grammar || [];
    feedbackData.vocabulary = feedbackData.vocabulary || [];

    return NextResponse.json(feedbackData);
  } catch (error) {
    console.error('Error generating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    );
  }
} 