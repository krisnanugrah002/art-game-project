import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize the SDK. It automatically picks up GEMINI_API_KEY from the environment.
const ai = new GoogleGenAI({});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, criteria } = body;

    if (!image || !criteria || !Array.isArray(criteria)) {
      return NextResponse.json(
        { error: 'Missing image or criteria array' },
        { status: 400 }
      );
    }

    const prompt = `You are an AI Art Critic evaluating a student's artwork based on the following criteria:
${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Analyze the provided image and output a JSON evaluating each criteria.
Output MUST strictly follow this JSON schema:
{
  "criteriaResults": [
    { "id": "integer index (0, 1, 2...)", "passed": boolean, "note": "string" }
  ],
  "feedback": "string",
  "unsafe_content": boolean,
  "contains_instruction_text": boolean
}
`;

    // Strip the "data:image/png;base64," part if it exists
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: 'image/png'
                        }
                    }
                ]
            }
        ],
        config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
        }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("No response from Gemini");
    }

    const resultJSON = JSON.parse(outputText);

    // Return evaluated score details
    return NextResponse.json({
      success: true,
      criteriaResults: resultJSON.criteriaResults || [],
      details: resultJSON
    });
    
  } catch (error: unknown) {
    console.error('Evaluation Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to evaluate image', details: errorMessage },
      { status: 500 }
    );
  }
}
