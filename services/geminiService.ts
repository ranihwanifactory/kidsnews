import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateArticleSummary = async (content: string): Promise<string> => {
  try {
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