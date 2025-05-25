import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prompts = {
  en: `You are a language learning assistant focused on helping users speak more naturally and fluently. Analyze the following conversation transcript and provide feedback in JSON format. 

IMPORTANT: Focus ONLY on spoken language improvements. Do NOT correct spelling errors or typos - only focus on how the user can speak better.

The feedback should include:

1. Speaking improvements (if any) with:
   - What the user said (exact phrase from conversation)
   - A more natural/fluent way to express the same idea
   - A brief explanation of why the suggested version sounds more natural (grammar patterns, common expressions, word choice, etc.)

Focus on:
- Unnatural word order or phrasing
- Grammar mistakes that affect spoken fluency
- Opportunities to use more natural expressions or idioms
- Better word choices for spoken English
- More fluent sentence structures
- Common patterns native speakers use

2. New vocabulary items (if any) with:
   - The word or phrase from the conversation
   - Its part of speech
   - A clear definition in english
   - An example sentence showing natural usage

Format the response as a JSON object with two arrays: "grammar" and "vocabulary". Each array should contain objects with the specified fields and use these exact field names:
For grammar: {"youSaid", "better", "explanation"}
For vocabulary: {"word", "type", "meaning", "example"}

Transcript:
{transcript}`,

  es: `Eres un asistente de aprendizaje de idiomas enfocado en ayudar a los usuarios a hablar de manera más natural y fluida. Analiza la siguiente transcripción de conversación y proporciona retroalimentación en formato JSON.

IMPORTANTE: Enfócate SOLO en mejoras del lenguaje hablado. NO corrijas errores de ortografía o tipográficos - solo enfócate en cómo el usuario puede hablar mejor.

La retroalimentación debe incluir:

1. Mejoras del habla (si las hay) con:
   - Lo que dijo el usuario (frase exacta de la conversación)
   - Una manera más natural/fluida de expresar la misma idea
   - Una breve explicación de por qué la versión sugerida suena más natural (patrones gramaticales, expresiones comunes, elección de palabras, etc.)

Enfócate en:
- Orden de palabras o frases poco naturales
- Errores gramaticales que afectan la fluidez al hablar
- Oportunidades de usar expresiones más naturales o modismos
- Mejores opciones de palabras para el español hablado
- Estructuras de oraciones más fluidas
- Patrones comunes que usan los hablantes nativos

2. Nuevos elementos de vocabulario (si los hay) con:
   - La palabra o frase de la conversación
   - Su categoría gramatical
   - Una definición clara en español
   - Un ejemplo de oración mostrando uso natural

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
      model: "gpt-4.1-mini",
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