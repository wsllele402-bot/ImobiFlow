
import { GoogleGenAI } from "@google/genai";
import { Property } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePropertyDescription = async (property: Partial<Property>): Promise<string> => {
  try {
    const prompt = `Crie uma descrição atraente e profissional para um imóvel do tipo ${property.type}.
    Detalhes:
    - Título: ${property.title}
    - Endereço: ${property.address}
    - Preço mensal: R$ ${property.price}
    Foque nos benefícios de localização e custo-benefício. Responda em português.`;

    // Fix: Use ai.models.generateContent with the correct model and simplified string contents format
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // The .text property is a getter that returns the generated text. Do not use text().
    return response.text || "Descrição não disponível.";
  } catch (error) {
    console.error("Erro ao gerar descrição com Gemini:", error);
    return "Erro ao gerar descrição automática.";
  }
};