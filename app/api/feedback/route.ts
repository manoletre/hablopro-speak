import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prompts = {
  en: `You are a language learning assistant. Analyze the following conversation transcript and provide feedback in JSON format. The feedback should include:

1. Grammar corrections (if any) with:
   - What the user said
   - A better way to say it
   - A brief explanation of the grammar rule in english

2. New vocabulary items (if any) with:
   - The word or phrase
   - Its part of speech
   - A clear definition in english
   - An example sentence

Format the response as a JSON object with two arrays: "grammar" and "vocabulary". Each array should contain objects with the specified fields and use these exact field names:
For grammar: {"youSaid", "better", "explanation"}
For vocabulary: {"word", "type", "meaning", "example"}

Transcript:
{transcript}`,

  es: `Eres un asistente de aprendizaje de idiomas. Analiza la siguiente transcripción de conversación y proporciona retroalimentación en formato JSON. La retroalimentación debe incluir:

1. Correcciones gramaticales (si las hay) con:
   - Lo que dijo el usuario
   - Una mejor manera de decirlo
   - Una breve explicación de la regla gramatical en español

2. Nuevos elementos de vocabulario (si los hay) con:
   - La palabra o frase
   - Su categoría gramatical
   - Una definición clara en español
   - Un ejemplo de oración

Formatea la respuesta como un objeto JSON con dos arrays: "grammar" y "vocabulary". Cada array debe contener objetos con los campos especificados y usa exactamente estos nombres de campo:
Para gramática: {"youSaid", "better", "explanation"}
Para vocabulario: {"word", "type", "meaning", "example"}

Transcripción:
{transcript}`
};

// JSON schema for structured output
const feedbackSchema = {
  name: "feedback",
  schema: {
    type: "object",
    properties: {
      grammar: {
        type: "array",
        items: {
          type: "object",
          properties: {
            youSaid: { type: "string" },
            better: { type: "string" },
            explanation: { type: "string" }
          },
          required: ["youSaid", "better", "explanation"],
          additionalProperties: false
        }
      },
      vocabulary: {
        type: "array",
        items: {
          type: "object",
          properties: {
            word: { type: "string" },
            type: { type: "string" },
            meaning: { type: "string" },
            example: { type: "string" }
          },
          required: ["word", "type", "meaning", "example"],
          additionalProperties: false
        }
      }
    },
    required: ["grammar", "vocabulary"],
    additionalProperties: false
  }
};

interface FeedbackGrammarItem {
  youSaid: string;
  better: string;
  explanation: string;
  [key: string]: string;
}

interface FeedbackVocabularyItem {
  word: string;
  type: string;
  meaning: string;
  example: string;
  [key: string]: string;
}

interface FeedbackResponse {
  grammar: FeedbackGrammarItem[];
  vocabulary: FeedbackVocabularyItem[];
  [key: string]: FeedbackGrammarItem[] | FeedbackVocabularyItem[];
}

// Normalization function to map alternative field names to expected ones
function normalizeFeedback(feedback: FeedbackResponse): FeedbackResponse {
  // Normalize grammar corrections
  if (Array.isArray(feedback.grammar)) {
    feedback.grammar = feedback.grammar.map((item: FeedbackGrammarItem) => ({
      youSaid: item.youSaid || item.what_user_said || item['what_user_said'] || '',
      better: item.better || item.a_better_way_to_say_it || item['better_way_to_say_it'] || item['a_better_way_to_say_it'] || '',
      explanation: item.explanation || ''
    }));
  }
  // Normalize vocabulary items
  if (Array.isArray(feedback.vocabulary)) {
    feedback.vocabulary = feedback.vocabulary.map((item: FeedbackVocabularyItem) => ({
      word: item.word || '',
      type: item.type || item.part_of_speech || item['part_of_speech'] || '',
      meaning: item.meaning || item.definition || item['definition'] || '',
      example: item.example || item.example_sentence || item['example_sentence'] || ''
    }));
  }
  return feedback;
}

export async function POST(request: Request) {
  try {
    const { transcript, language } = await request.json();

    console.log('feedback language:', language);
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    const prompt = prompts[language as keyof typeof prompts] || prompts.en;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: prompt.replace('{transcript}', transcript)
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: feedbackSchema
      }
    });

    let feedback: FeedbackResponse = { grammar: [], vocabulary: [] };
    try {
      const parsedFeedback = JSON.parse(completion.choices[0].message.content || '{}');
      // Ensure the parsed object has the required properties
      feedback = {
        grammar: Array.isArray(parsedFeedback.grammar) ? parsedFeedback.grammar : [],
        vocabulary: Array.isArray(parsedFeedback.vocabulary) ? parsedFeedback.vocabulary : []
      };
    } catch {
      // Keep the default empty feedback object initialized above
    }
    feedback = normalizeFeedback(feedback);
    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
} 