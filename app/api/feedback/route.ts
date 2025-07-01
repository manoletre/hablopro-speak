import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prompts = {
  en: `You are a language learning assistant focused on helping users speak more naturally and fluently. Analyze the following conversation transcript and provide feedback in JSON format.

IMPORTANT: Be generous with learning opportunities! Aim for 2-3 vocabulary and grammar recommendations per minute of conversation. Focus on teaching moments, not just error corrections. Focus ONLY on spoken language improvements. Do NOT correct spelling errors or typos - only focus on how the user can speak better.

**CRITICAL LANGUAGE INSTRUCTION**: The user is learning {targetLanguage}. ALL examples, vocabulary definitions, and corrections must be in {targetLanguage}. Your explanations should be in English, but the actual language examples must be in {targetLanguage}.

The feedback should include:

1. A key takeaway - identify the MOST IMPORTANT concrete improvement the user can make based on their conversation. Use the other corrections and make a concrete takeaway from the conversation to make it better. Make sure the key takeaway is useful and actionble. Adress it to the user ("You can improve by..."). Make sure the key takeaway is not too general, but specific to the conversation, and avoid repeating something here that is already mentioned in the other corrections.

2. Speaking improvements - BE GENEROUS! Look for ANY opportunity to teach better expressions, including:
   - Actual mistakes that need correction (just no spelling errors or typos)
   - Good phrases that could be made even more natural or sophisticated
   - Alternative ways to express the same ideas more fluently
   - More native-like expressions for common phrases they used
   - Opportunities to use more varied vocabulary
   - Ways to sound more confident or natural
   - Each item should have:
     * A category that describes the type of improvement (e.g., "Fluency", "Word Choice", "Sequence", "Redundancy", "Grammar", "Natural Expression", "Sentence Structure", "Sophistication", "Variety")
     * What the user said (exact phrase from conversation in {targetLanguage})
     * The part that could be improved highlighted in red (even if not wrong, just improvable)
     * A more natural/fluent/sophisticated way to express the same idea IN {targetLanguage}
     * The improved part highlighted in green
     * A detailed explanation in English of why the suggested version sounds more natural or sophisticated

3. Vocabulary items - BE GENEROUS! Include:
   - New words from the conversation they might not know well
   - Synonyms for words they used that could add variety
   - More sophisticated alternatives to simple words they used
   - Related words that would be useful in similar contexts
   - Words that would help them express similar ideas more precisely
   - Each item should have:
     * The word or phrase in {targetLanguage} (can be from conversation or related/alternative words)
     * Its part of speech (in English)
     * A clear definition in English
     * An example sentence showing natural usage IN {targetLanguage}

GOAL: For every minute of conversation, provide approximately 2-3 total recommendations (mix of grammar and vocabulary). A 3-minute conversation should yield around 6-9 learning opportunities.

Format the response as a JSON object with three properties: "keyTakeaway", "grammar", and "vocabulary". 

Use these exact field names:
- keyTakeaway: string (in English)
- grammar: array of objects with {"category", "youSaid", "problemHighlight", "better", "improvementHighlight", "explanation"}
- vocabulary: array of objects with {"word", "type", "meaning", "example"}

Transcript:
{transcript}`,

  es: `Eres un asistente de aprendizaje de idiomas enfocado en ayudar a los usuarios a hablar de manera más natural y fluida. Analiza la siguiente transcripción de conversación y proporciona retroalimentación en formato JSON.

IMPORTANTE: ¡Sé generoso con las oportunidades de aprendizaje! Apunta a 2-3 recomendaciones de vocabulario y gramática por minuto de conversación. Enfócate en momentos de enseñanza, no solo en correcciones de errores.

**INSTRUCCIÓN CRÍTICA DE IDIOMA**: El usuario está aprendiendo {targetLanguage}. TODOS los ejemplos, definiciones de vocabulario y correcciones deben estar en {targetLanguage}. Tus explicaciones deben estar en español, pero los ejemplos de idioma reales deben estar en {targetLanguage}.

La retroalimentación debe incluir:

1. Una conclusión clave - identifica la mejora concreta MÁS IMPORTANTE que el usuario puede hacer basada en su conversación. Usa las otras correcciones y haz una conclusión concreta de la conversación para mejorar. Asegúrate de que la conclusión es útil y accionable. Dirígete al usuario ("Puedes mejorar..."). Asegúrate de que la conclusión no es demasiado general, pero específica para la conversación, y evita repetir algo aquí que ya está mencionado en las otras correcciones.

2. Mejoras del habla - ¡SÉ GENEROSO! Busca CUALQUIER oportunidad para enseñar mejores expresiones, incluyendo:
   - Errores reales que necesitan corrección
   - Frases buenas que podrían hacerse aún más naturales o sofisticadas
   - Formas alternativas de expresar las mismas ideas con más fluidez
   - Expresiones más nativas para frases comunes que usaron
   - Oportunidades para usar vocabulario más variado
   - Formas de sonar más confiado o natural
   - Cada elemento debe tener:
     * Una categoría que describe el tipo de mejora (ej., "Fluidez", "Elección de Palabras", "Secuencia", "Redundancia", "Gramática", "Expresión Natural", "Estructura de Oración", "Sofisticación", "Variedad")
     * Lo que dijo el usuario (frase exacta de la conversación en {targetLanguage})
     * La parte que podría mejorarse resaltada en rojo (aunque no esté mal, solo mejorable)
     * Una forma más natural/fluida/sofisticada de expresar la misma idea EN {targetLanguage}
     * La parte mejorada resaltada en verde
     * Una explicación detallada en español de por qué la versión sugerida suena más natural o sofisticada

3. Elementos de vocabulario - ¡SÉ GENEROSO! Incluye:
   - Palabras nuevas de la conversación que podrían no conocer bien
   - Sinónimos para palabras que usaron que podrían añadir variedad
   - Alternativas más sofisticadas a palabras simples que usaron
   - Palabras relacionadas que serían útiles en contextos similares
   - Palabras que les ayudarían a expresar ideas similares con más precisión
   - Cada elemento debe tener:
     * La palabra o frase en {targetLanguage} (puede ser de la conversación o palabras relacionadas/alternativas)
     * Su categoría gramatical (en español)
     * Una definición clara en español
     * Un ejemplo de oración mostrando uso natural EN {targetLanguage}

OBJETIVO: Por cada minuto de conversación, proporciona aproximadamente 2-3 recomendaciones totales (mezcla de gramática y vocabulario). Una conversación de 3 minutos debería producir alrededor de 6-9 oportunidades de aprendizaje.

Formatea la respuesta como un objeto JSON con tres propiedades: "keyTakeaway", "grammar", y "vocabulary".

Usa exactamente estos nombres de campo:
- keyTakeaway: string (en español)
- grammar: array de objetos con {"category", "youSaid", "problemHighlight", "better", "improvementHighlight", "explanation"}
- vocabulary: array de objetos con {"word", "type", "meaning", "example"}

Transcripción:
{transcript}`
};

// JSON schema for structured output
const feedbackSchema = {
  name: "feedback",
  schema: {
    type: "object",
    properties: {
      keyTakeaway: {
        type: "string"
      },
      grammar: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: { type: "string" },
            youSaid: { type: "string" },
            problemHighlight: { type: "string" },
            better: { type: "string" },
            improvementHighlight: { type: "string" },
            explanation: { type: "string" }
          },
          required: ["category", "youSaid", "problemHighlight", "better", "improvementHighlight", "explanation"],
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
    required: ["keyTakeaway", "grammar", "vocabulary"],
    additionalProperties: false
  }
};

interface FeedbackGrammarItem {
  category: string;
  youSaid: string;
  problemHighlight: string;
  better: string;
  improvementHighlight: string;
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
  keyTakeaway: string;
  grammar: FeedbackGrammarItem[];
  vocabulary: FeedbackVocabularyItem[];
  [key: string]: string | FeedbackGrammarItem[] | FeedbackVocabularyItem[];
}

// Normalization function to handle legacy field names and ensure proper structure
function normalizeFeedback(feedback: FeedbackResponse): FeedbackResponse {
  // Ensure keyTakeaway exists
  if (!feedback.keyTakeaway) {
    feedback.keyTakeaway = '';
  }

  // Normalize grammar corrections
  if (Array.isArray(feedback.grammar)) {
    feedback.grammar = feedback.grammar.map((item: FeedbackGrammarItem) => ({
      category: item.category || 'General',
      youSaid: item.youSaid || item.what_user_said || item['what_user_said'] || '',
      problemHighlight: item.problemHighlight || '',
      better: item.better || item.a_better_way_to_say_it || item['better_way_to_say_it'] || item['a_better_way_to_say_it'] || '',
      improvementHighlight: item.improvementHighlight || '',
      explanation: item.explanation || ''
    }));
  } else {
    feedback.grammar = [];
  }

  // Normalize vocabulary items
  if (Array.isArray(feedback.vocabulary)) {
    feedback.vocabulary = feedback.vocabulary.map((item: FeedbackVocabularyItem) => ({
      word: item.word || '',
      type: item.type || item.part_of_speech || item['part_of_speech'] || '',
      meaning: item.meaning || item.definition || item['definition'] || '',
      example: item.example || item.example_sentence || item['example_sentence'] || ''
    }));
  } else {
    feedback.vocabulary = [];
  }

  return feedback;
}

export async function POST(request: Request) {
  try {
    const { transcript, language, targetLanguage } = await request.json();

    console.log('feedback language (UI):', language);
    console.log('target language (learning):', targetLanguage);
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Use language for selecting the prompt (UI language)
    const prompt = prompts[language as keyof typeof prompts] || prompts.en;
    
    // Replace both transcript and targetLanguage placeholders
    const finalPrompt = prompt
      .replace('{transcript}', transcript)
      .replace(/{targetLanguage}/g, targetLanguage || 'the target language');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: finalPrompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: feedbackSchema
      }
    });

    let feedback: FeedbackResponse = { keyTakeaway: '', grammar: [], vocabulary: [] };
    try {
      const parsedFeedback = JSON.parse(completion.choices[0].message.content || '{}');
      // Ensure the parsed object has the required properties
      feedback = {
        keyTakeaway: parsedFeedback.keyTakeaway || '',
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