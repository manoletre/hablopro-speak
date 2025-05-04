import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST() {
  try {
    const response = await openai.beta.realtime.sessions.create({
      model: 'gpt-4o-mini-realtime-preview',
      voice: 'alloy',
      instructions: 'You are a helpful assistant that can answer questions and help with tasks.',
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