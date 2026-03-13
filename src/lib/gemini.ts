import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateGuidance(
  text: string,
  prompt: string,
  style: string,
  language: string,
  model: string
) {
  const systemPrompt = `${prompt}
  
  You MUST output a JSON object with the following structure:
  {
    "markdown": "The generated guidance and checklist in Markdown format. If style is not 'Normal', write it in the style of ${style}.",
    "mermaid": "A Mermaid.js graph TD flowchart representing the system components and testing requirements.",
    "crossReferences": "A string explaining the global standards cross-references (e.g., FDA Product Codes, EU MDR).",
    "risks": "A string listing the Top 3 Critical Failures or risks.",
    "architectureMermaid": "A Mermaid.js graph TD or mindmap illustrating the product's system component architecture (e.g., anchoring components, bridging components) and their corresponding testing requirements.",
    "summary": {
      "estimatedReviewDays": 45,
      "complexityLevel": "High",
      "keyFocusArea": "Biocompatibility"
    }
  }
  
  Language: ${language}
  Style: ${style}
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: text.substring(0, 30000), // Limit text to avoid huge payloads if needed
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          markdown: { type: Type.STRING },
          mermaid: { type: Type.STRING },
          crossReferences: { type: Type.STRING },
          risks: { type: Type.STRING },
          architectureMermaid: { type: Type.STRING },
          summary: {
            type: Type.OBJECT,
            properties: {
              estimatedReviewDays: { type: Type.NUMBER },
              complexityLevel: { type: Type.STRING },
              keyFocusArea: { type: Type.STRING }
            }
          }
        },
        required: ["markdown", "mermaid", "crossReferences", "risks", "architectureMermaid", "summary"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function chatWithDocumentStream(
  text: string,
  history: { role: string; content: string }[],
  message: string,
  language: string,
  model: string
) {
  const systemInstruction = `You are a helpful AI assistant for a medical device reviewer. 
  Answer the user's questions based on the uploaded document text.
  Language: ${language}
  
  Document Text:
  ${text.substring(0, 30000)}
  `;

  const conversation = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');
  const prompt = `${conversation}\nUser: ${message}`;
  
  return await ai.models.generateContentStream({
    model: model,
    contents: prompt,
    config: { systemInstruction }
  });
}
