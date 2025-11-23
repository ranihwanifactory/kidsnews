import { GoogleGenAI } from "@google/genai";

// Initialize Gemini lazily to avoid 'process is not defined' errors during module load in some environments
let aiInstance: GoogleGenAI | null = null;

const getAi = (): GoogleGenAI => {
  if (!aiInstance) {
    // Check if API_KEY is available in process.env, otherwise handle gracefully
    const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : '';
    if (!apiKey) {
        console.warn("Gemini API Key is missing. AI features will not work.");
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey });
  }
  return aiInstance;
};

export const generateArticleSummary = async (content: string): Promise<string> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following news article for a children's newspaper in Korean. Keep it under 150 characters and make it exciting: ${content}`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Summary generation failed.";
  }
};

export const polishArticle = async (content: string): Promise<string> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a helpful editor for a children's newspaper. Please fix grammar mistakes and make the following text more engaging and easy to understand for elementary school students (in Korean). Keep the HTML formatting if present: ${content}`,
    });
    return response.text || content;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return content;
  }
};