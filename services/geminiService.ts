import { GoogleGenAI } from "@google/genai";
import { HeartRateSample } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeHeartRate = async (data: HeartRateSample[]): Promise<string> => {
  if (data.length < 5) {
    return "Not enough data points to analyze yet.";
  }

  // Calculate some basic stats to help the model
  const values = data.map(d => d.bpm);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Create a condensed string of recent trend
  const trend = values.slice(-20).join(", ");

  const prompt = `
    You are a fitness health assistant. 
    Here is a stream of heart rate data (BPM) collected over a short period: [${trend}].
    Statistics: Average: ${avg}, Min: ${min}, Max: ${max}.
    
    Please provide a very short, concise sentence (max 20 words) describing the heart rate status. 
    Examples: "Heart rate is steady and resting," "Elevated heart rate detected, possible exertion," "Irregular fluctuations observed."
    Do not give medical advice.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate insight at this time.";
  }
};
