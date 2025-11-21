import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

let ai: GoogleGenAI | null = null;

if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
}

export const explainParameter = async (paramName: string, context: string): Promise<string> => {
    if (!ai) return "API Key not configured. Unable to fetch explanation.";

    const prompt = `
    You are an expert in Stable Diffusion training, specifically using kohya_ss / sd-scripts.
    
    Explain the parameter "${paramName}" in the context of "${context}".
    
    Keep the explanation concise (under 80 words), friendly, and focused on how it affects the training result (quality, speed, VRAM usage).
    If it is a technical term like "Gradient Checkpointing", explain the trade-off.
  `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "No explanation available.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Error retrieving explanation.";
    }
};

export const suggestOptimization = async (configJSON: string): Promise<string> => {
    if (!ai) return "API Key not configured.";

    const prompt = `
    Analyze this partial SD-Scripts training configuration:
    ${configJSON}
    
    Suggest 3 key improvements or checks for a LoRA training workflow. 
    Format as a bulleted Markdown list.
  `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "No suggestions available.";
    } catch (error) {
        return "Error generating suggestions.";
    }
};
