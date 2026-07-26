import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResponse, UrgencyLevel } from "../types";

const API_KEY = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: API_KEY });

const DIAGNOSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    conditions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the medical condition" },
          probability: { type: Type.NUMBER, description: "Estimated percentage likelihood (0-100)" },
          description: { type: Type.STRING, description: "Brief explanation of the condition in relation to symptoms" },
          urgency: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"], description: "Urgency level of the condition" },
          symptoms_matched: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of user symptoms that match this condition" },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Actionable next steps for the user" },
        },
        required: ["name", "probability", "description", "urgency", "symptoms_matched", "recommendations"],
      },
    },
    disclaimer: { type: Type.STRING, description: "A mandatory medical disclaimer stating this is AI generated and not professional advice." },
    general_advice: { type: Type.STRING, description: "General health advice based on the context." },
  },
  required: ["conditions", "disclaimer", "general_advice"],
};

export const analyzeSymptoms = async (symptoms: string): Promise<DiagnosisResponse> => {
  try {
    const modelId = 'gemini-3.5-flash-lite'; // Using flash for speed and good reasoning on structured tasks
    
    const systemInstruction = `
      You are a friendly health assistant that helps people understand what might be causing their symptoms.
      
      Your Goal:
      1. Look at the symptoms the person describes carefully.
      2. List the 3-5 most likely reasons they might be feeling this way.
      3. Give each one a simple percentage chance.
      4. Say how urgent it is — be honest, don't downplay serious things.
      5. For each condition, explain:
         - What it is in simple words
         - Why it matches their symptoms
         - What they should do about it
         - What to watch for that would mean it's getting worse
      
      LANGUAGE RULES:
      - Use everyday words, not medical jargon.
      - Instead of "migraine" say "a bad headache".
      - Instead of "rhinitis" say "a runny or stuffy nose".
      - Instead of "gastrointestinal" say "stomach or digestive".
      - Explain any medical term you must use in parentheses, like "GERD (acid reflux)".
      - Talk like you're explaining to a friend, not a doctor.
      
      SERIOUSNESS LEVELS:
      - Low: Can probably be treated at home. Give clear home care steps.
      - Medium: Should see a doctor within a day or two. Explain why.
      - High: Should see a doctor today or go to urgent care. Be specific about why.
      - Critical: Call emergency services NOW. Give step-by-step instructions for what to do while waiting.
      
      EMERGENCIES:
      - If someone might be in serious danger, tell them to call emergency services right away.
      - Give them specific steps to take while waiting — not just "get help".
      - For heart attack: "Call 911, sit down, chew an aspirin if not allergic, don't drive yourself."
      - For stroke: "Call 911, note the time symptoms started, don't eat/drink, don't take aspirin."
      - For severe bleeding: "Call 911, press hard with a clean cloth, don't lift it to check."
      - For breathing trouble: "Call 911, sit upright, use inhaler if you have one."
      - For severe allergic reaction: "Call 911, use EpiPen if available, lie down with legs elevated."
      
      SAFETY:
      - You are NOT a real doctor. Always remind people to see a real doctor.
      - Be kind and caring in your responses.
      - It's better to be cautious and tell someone to see a doctor than to miss something serious.
      
      ACCURACY:
      - Even though you use simple words, your medical analysis must be just as accurate and thorough.
      - Do not skip less common conditions if the symptoms match them.
      - Always consider the most serious possibilities first, then work down to more common ones.
      - If someone shares a photo, use it to make your analysis more accurate.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Patient reports the following symptoms: "${symptoms}". Provide a differential diagnosis.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: DIAGNOSIS_SCHEMA,
        temperature: 0.3, // Low temperature for more deterministic/factual medical responses
      },
    });

    if (!response.text) {
      throw new Error("No response received from AI.");
    }

    const data = JSON.parse(response.text) as DiagnosisResponse;
    return data;
  } catch (error) {
    console.error("Diagnosis Error:", error);
    throw new Error("Failed to analyze symptoms. Please try again.");
  }
};
