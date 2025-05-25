import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the structure for suggestions
const SuggestionSchema = z.object({
  suggestions: z.array(z.object({
    type: z.enum(['vocabulary', 'phrase', 'encouragement']),
    content: z.string(),
    translation: z.string().nullable(),
  }))
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      conversationHistory = [], 
      targetLanguage = 'french', 
      userNativeLanguage = 'english',
      difficultyLevel = 3,
      vocabularyOnly = false
    } = body;

    // Build conversation context
    const recentMessages = conversationHistory.slice(-6); // Last 6 messages for context
    const conversationContext = recentMessages
      .map((msg: { role: string; text: string }) => `${msg.role}: ${msg.text}`)
      .join('\n');

    // Create difficulty-appropriate prompt
    const difficultyDescriptions = {
      1: 'very basic vocabulary and simple phrases',
      2: 'elementary vocabulary and common expressions',
      3: 'intermediate vocabulary and everyday phrases',
      4: 'advanced vocabulary and professional expressions',
      5: 'sophisticated vocabulary and complex expressions'
    };

    const prompt = `You are helping a language learner during their conversation practice. Based on the recent conversation context, provide 6-8 vocabulary suggestions that help the user respond and continue the conversation.

Conversation context:
${conversationContext || 'No conversation yet - user is just starting'}

Target language: ${targetLanguage}
User's native language: ${userNativeLanguage}
Difficulty level: ${difficultyLevel} (${difficultyDescriptions[difficultyLevel as keyof typeof difficultyDescriptions]})

IMPORTANT: Focus on vocabulary that helps the user RESPOND and CONTRIBUTE to the conversation. Think about what the user might want to say next, not just understanding what was said.

${vocabularyOnly ? 
  `Provide 6-8 vocabulary words or short expressions that the user could use to respond or continue the conversation.` :
  `Types of suggestions:
- "vocabulary": Key words/expressions the user could say in response (provide translation)
- "phrase": Complete sentences the user might want to say next (provide translation)
- "encouragement": Motivational messages to keep the user engaged (no translation needed - leave translation empty)`
}

Guidelines for vocabulary suggestions:
- Think predictively: What might the user want to say in response?
- If asked about preferences: provide vocabulary for common preferences/opinions
- If asked about experiences: provide vocabulary for describing experiences
- If discussing a topic: provide vocabulary for expressing opinions, asking follow-up questions
- Focus on conversational vocabulary that helps the user participate actively
- Provide words/expressions the user can immediately use to respond
- Include opinion words, descriptive adjectives, common responses
- Think about natural conversation flow and what comes next

Examples of good predictive vocabulary:
- If discussing food: "delicious", "I prefer", "my favorite is", "I don't like"
- If discussing hobbies: "I enjoy", "I'm interested in", "I practice", "it's fun"
- If discussing travel: "I've been to", "I'd like to visit", "beautiful", "interesting"

Always provide exactly ${vocabularyOnly ? '6-8 vocabulary suggestions' : '6-8 suggestions total'} that help the user actively participate in the conversation.

If no conversation context exists, provide common conversational vocabulary for introducing oneself and starting conversations.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: prompt
        }
      ],
      response_format: zodResponseFormat(SuggestionSchema, 'suggestions'),
      temperature: 0.7,
    });

    const suggestions = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
    
    // Clean up the suggestions to ensure proper null values for empty translations
    if (suggestions.suggestions) {
      suggestions.suggestions = suggestions.suggestions.map((suggestion: { type: string; content: string; translation: string | null }) => ({
        ...suggestion,
        translation: suggestion.translation && suggestion.translation.trim() ? suggestion.translation : null
      }));
    }
    
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
} 