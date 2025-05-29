import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string; };

export async function POST(request: Request) {
  try {
    const { word, sourceLanguage, targetLanguage, context } = await request.json();

    // If source and target languages are the same, return the word with a definition
    if (sourceLanguage.toLowerCase() === targetLanguage.toLowerCase()) {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: 'You are a helpful language assistant. When the source and target languages are the same, provide a brief definition or explanation of the word in that language. Respond with only valid JSON: { "translation": "..." }.',
        },
        {
          role: 'user',
          content: `The word "${word}" is in ${sourceLanguage}. Since we\'re translating to the same language, please provide a brief definition or explanation of this word in the context: "${context}". Respond with a JSON object with a single key "translation" and no additional text.`,
        },
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-nano',
        messages: messages,
        temperature: 0,
      });

      const reply = response.choices?.[0]?.message?.content || '';
      let translation = '';
      try {
        const data = JSON.parse(reply);
        translation = data.translation;
      } catch {
        console.error('Failed to parse translation response:', reply);
        translation = `Definition: ${reply.trim()}`;
      }

      return NextResponse.json({ translation });
    }

    // Original translation logic for different languages
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful translator. Translate single words from the source language into the target language using the provided context to determine the correct meaning. Respond with only valid JSON: { "translation": "..." }.',
      },
      {
        role: 'user',
        content: `Translate the word "${word}" from ${sourceLanguage} to ${targetLanguage} in the following context: "${context}". Respond with a JSON object with a single key "translation" and no additional text.`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: messages,
      temperature: 0,
    });

    const reply = response.choices?.[0]?.message?.content || '';
    let translation = '';
    try {
      const data = JSON.parse(reply);
      translation = data.translation;
    } catch {
      console.error('Failed to parse translation response:', reply);
      translation = reply.trim();
    }

    return NextResponse.json({ translation });
  } catch (error) {
    console.error('Error translating word:', error);
    return NextResponse.json({ translation: '' }, { status: 500 });
  }
} 