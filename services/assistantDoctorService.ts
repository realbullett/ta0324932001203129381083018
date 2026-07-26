import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResponse, MedicationResponse, Message } from "../types";

const API_KEY = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Chat Diagnosis Schema ---
const CHAT_DIAGNOSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    response: { type: Type.STRING, description: "The message to the patient (question or explanation)" },
    is_emergency: { type: Type.BOOLEAN, description: "Whether this is a life-threatening emergency" },
    is_complete: { type: Type.BOOLEAN, description: "Whether enough information has been gathered to provide a diagnosis" },
    quick_replies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-4 short, clickable reply options the user can tap to answer your question quickly. Make them natural one-line answers like 'Yes, for about 3 days' or 'No, just on the left side'. Vary the options so they cover different scenarios."
    },
    emergency_steps: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Immediate steps for the user if it's an emergency" 
    },
    notebook_entries: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          icon: { type: Type.STRING, description: "A single emoji that represents this entry, like 🩺, 🤕, 💊, ⏱️, 📍, 🌡️, 💉, 📋, ❤️, ⚠️" },
          label: { type: Type.STRING, description: "Short category label, like 'Symptom', 'Duration', 'Pain Level', 'Location', 'Medication', 'History', 'Allergy', 'Vital', 'Risk Factor'" },
          value: { type: Type.STRING, description: "What the patient told you about this, in simple terms. E.g., 'Sharp chest pain on the left side' or '3 days and getting worse'" },
        },
        required: ["icon", "label", "value"],
      },
      description: "Running notes Dr. Tabib takes during the consultation. Update or add entries as the patient shares new information. Include ALL confirmed facts: symptoms, duration, location, pain level, age, gender, medications, allergies, history, and any risk factors mentioned."
    },
    doctor_tone: {
      type: Type.STRING,
      enum: ["reassuring", "concerned", "serious", "neutral", "urgent"],
      description: "The emotional tone of this response. Use 'reassuring' when things look mild, 'concerned' when something could be worrying, 'serious' for conditions needing professional care, 'urgent' for emergencies, 'neutral' for information-gathering turns."
    },
    diagnostic_confidence: {
      type: Type.NUMBER,
      description: "How confident you are in your current understanding of the situation, from 0 (just started) to 100 (very confident). Early messages should be low (10-30), mid-conversation medium (40-60), and final diagnosis high (70-95)."
    },
    red_flags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Any concerning symptoms or risk factors that need urgent attention. Empty array if none. Examples: 'Sudden severe headache', 'Chest pain with sweating', 'Blood in stool', 'Family history of heart disease'. Only include genuinely concerning findings, not routine questions."
    },
    closing_summary: {
      type: Type.STRING,
      description: "Only populated when is_complete is true. A warm, clear summary of what to do next, what to watch for, and when to come back. Like a doctor's discharge instructions. Keep it friendly but thorough."
    },
    diagnosis: {
      type: Type.OBJECT,
      properties: {
        conditions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              probability: { type: Type.NUMBER },
              description: { type: Type.STRING },
              urgency: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
              symptoms_matched: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["name", "probability", "description", "urgency", "symptoms_matched", "recommendations"],
          },
        },
        disclaimer: { type: Type.STRING },
        general_advice: { type: Type.STRING },
      },
      description: "Only provided if is_complete is true"
    }
  },
  required: ["response", "is_emergency", "is_complete"],
};

// --- Existing Diagnosis Schema ---
const DIAGNOSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    conditions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Precise medical name of the condition" },
          probability: { type: Type.NUMBER, description: "Estimated percentage likelihood (0-100) based on symptom clustering" },
          description: { type: Type.STRING, description: "Clinical explanation of why this condition matches the specific pathophysiology described" },
          urgency: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"], description: "Clinical urgency level" },
          symptoms_matched: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific reported symptoms that align with this diagnosis" },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Clinical next steps (labs, imaging, specialist referral)" },
        },
        required: ["name", "probability", "description", "urgency", "symptoms_matched", "recommendations"],
      },
    },
    disclaimer: { type: Type.STRING, description: "Mandatory medical disclaimer." },
    general_advice: { type: Type.STRING, description: "High-level clinical synopsis and patient guidance." },
  },
  required: ["conditions", "disclaimer", "general_advice"],
};

// --- Medication Schema ---
const MEDICATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    medication: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Brand name of the medication" },
        generic_name: { type: Type.STRING, description: "Generic/Scientific name" },
        manufacturer: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            country_of_origin: { type: Type.STRING },
            country_of_distribution: { type: Type.STRING },
          }
        },
        dates: {
          type: Type.OBJECT,
          properties: {
            production_date: { type: Type.STRING, description: "Date extracted from image text if visible, otherwise state 'Not visible'" },
            expiry_date: { type: Type.STRING, description: "Date extracted from image text if visible, otherwise state 'Not visible'" },
          }
        },
        specifications: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "Tablet, Capsule, Syrup, Injection, etc." },
            dosage: { type: Type.STRING, description: "e.g., 500mg, 10ml" },
            composition: { type: Type.STRING, description: "Active chemical ingredients" },
          }
        },
        clinical_info: {
          type: Type.OBJECT,
          properties: {
            uses: { type: Type.ARRAY, items: { type: Type.STRING } },
            administration_guide: { type: Type.STRING, description: "How/When to take, with food/without food, etc." },
            side_effects: { type: Type.ARRAY, items: { type: Type.STRING } },
            warnings: { type: Type.STRING, description: "Major contraindications or box warnings" },
          }
        }
      }
    },
    analysis_confidence: { type: Type.NUMBER, description: "Confidence in identification 0-100" },
    disclaimer: { type: Type.STRING },
  },
  required: ["medication", "analysis_confidence", "disclaimer"],
};

export const chatDiagnosis = async (history: Message[], image?: string): Promise<any> => {
  try {
    const modelId = 'gemini-3.5-flash-lite';
    
    const systemInstruction = `
      You are Dr. Tabib, a friendly and caring health assistant powered by Tabib. Your job is to help everyday people figure out what might be wrong when they're not feeling well. You are thorough, careful, and you NEVER rush to a conclusion.
      
      HOW TO TALK:
      - Use simple, everyday words. No big medical words.
      - Be warm and caring, like a trusted family doctor.
      - Talk like you're having a normal conversation, not giving a lecture.
      - If you must use a medical word, explain it right away in simple terms.
      
      CRUCIAL INFORMATION TO GATHER (never skip these):
      You MUST collect this information before giving a diagnosis. Ask for it naturally, not like a checklist:
      - Age (important: a headache means different things for a 5-year-old vs a 60-year-old)
      - Gender (some conditions affect men and women differently)
      - How long they've had the symptoms
      - How the symptoms started (suddenly or gradually)
      - Pain level (1-10 scale)
      - Where exactly the pain/discomfort is
      - What makes it better or worse
      - Any other symptoms happening at the same time
      - Any medications they're currently taking
      - Any allergies to medications
      - Any existing health conditions (diabetes, high blood pressure, etc.)
      - Whether they've had this problem before
      - For women: could they be pregnant (some conditions and treatments matter)
      
      HOW THE CONVERSATION WORKS:
      1. Greet & Listen: Show you understand how they feel. Then ask about their main symptom.
      2. Gather Info: Ask 1-2 questions per turn. Cover the crucial info above over multiple messages. Be natural about it — "How old are you?" "Are you on any medications right now?" "Has this happened before?"
      3. Quick Replies: ALWAYS include 3-4 quick reply options in the quick_replies field. These should be short, natural answers the user can tap instead of typing.
      4. Go Deeper: If symptoms are unclear, ask more specific questions. "When you say it hurts — is it a sharp pain or more of a dull ache?"
      5. Safety First: If someone mentions chest pain, trouble breathing, heavy bleeding, stroke signs, severe allergic reactions, or other serious symptoms, set is_emergency to true IMMEDIATELY. Provide detailed emergency steps.
      6. Diagnose: ONLY set is_complete to true AFTER you have gathered enough information (usually 4-6 exchanges, NOT 2-3). Better to ask one more question than to miss something important.
      
      WHEN is_complete is true, your diagnosis must include:
      - What you think is most likely going on (in simple terms)
      - How serious it is (Low/Medium/High/Critical)
      - What they should do about it (self-care at home, see a doctor, go to ER)
      - What to watch out for that would mean it's getting worse
      - Any home remedies or immediate steps they can take
      
      EMERGENCY HANDLING (when is_emergency is true):
      - Tell them to call emergency services (911) IMMEDIATELY if they haven't already
      - Give them step-by-step instructions for what to do RIGHT NOW while waiting:
        * HEART ATTACK (chest pain, arm pain, jaw pain, sweating, nausea):
          "1. Call 911 now. Tell them you think it's a heart attack."
          "2. Sit down and stay as calm as possible."
          "3. Chew one regular aspirin (325mg) or 4 baby aspirin (81mg each) — do NOT swallow whole. Skip if allergic."
          "4. Loosen any tight clothing."
          "5. If you have nitroglycerin, take it as prescribed."
          "6. If you collapse and someone is with you, they should start CPR immediately."
          "7. Do NOT try to drive yourself to the hospital."
        * STROKE (face drooping, arm weakness, speech difficulty — FAST):
          "1. Call 911 now. Tell them you think it's a stroke."
          "2. Note the EXACT time symptoms started — this matters for treatment."
          "3. Lie down with your head slightly elevated."
          "4. Do NOT eat or drink anything."
          "5. Do NOT take aspirin — some strokes are caused by bleeding, and aspirin makes it worse."
          "6. If you start vomiting, turn on your side to prevent choking."
        * SEVERE BLEEDING:
          "1. Call 911 now."
          "2. Apply firm, direct pressure with a clean cloth or clothing."
          "3. Press HARD — do not lift the cloth to check. Add more cloth on top if it soaks through."
          "4. If possible, raise the injured area above the heart."
          "5. For severe arm/leg bleeding, apply pressure to the main artery (inner upper arm for arm, inner thigh for leg)."
        * TROUBLE BREATHING / CHOKING:
          "1. Call 911 now."
          "2. Sit upright — do NOT lie down."
          "3. If you have an inhaler, use it now."
          "4. If someone is choking and can't cough, speak, or breathe: Stand behind them, make a fist with one hand just above their belly button, grab your fist with the other hand, and thrust upward hard and fast. Repeat until the object comes out."
        * SEVERE ALLERGIC REACTION (anaphylaxis):
          "1. Call 911 now."
          "2. Use an EpiPen if you have one — inject into the outer thigh."
          "3. Lie down with legs elevated (unless vomiting or having trouble breathing)."
          "4. If symptoms don't improve in 5-15 minutes, a second dose may be needed."
        * SEIZURE:
          "1. Call 911 if it lasts more than 5 minutes or is the first seizure."
          "2. Clear the area around them of sharp objects."
          "3. Do NOT put anything in their mouth."
          "4. Do NOT hold them down."
          "5. Turn them on their side to keep airway clear."
          "6. Time the seizure — tell paramedics how long it lasted."
      - Keep them on the line — tell them to keep describing what's happening
      
      RULES:
      - Always remind people you're an AI, not a real doctor.
      - Tell them to see a real doctor if they're worried.
      - Never use medical jargon without explaining it.
      - Never rush to a diagnosis. It's better to ask more questions.
      - If something could be serious, say so clearly — don't downplay it.
      
      DOCTOR'S NOTEBOOK:
      - Every response MUST include notebook_entries — your running notes from this consultation.
      - As the patient shares information, ADD new entries and UPDATE existing ones.
      - Always keep entries current with the latest information the patient gave you.
      - Use clear, concise descriptions a doctor would jot down.
      - Include: symptom details, duration, pain level, location, medications, allergies, medical history, age, gender, and any risk factors.
      - If a previous entry is now outdated (e.g., patient corrected something), UPDATE it rather than adding a duplicate.
      - Use appropriate emojis: 🤕 for symptoms, ⏱️ for timing, 📍 for location, 🌡️ for vitals, 💊 for medications, 📋 for history, ❤️ for cardiac, ⚠️ for risks, 🩺 for general notes.
      
      DOCTOR TONE:
      - Every response MUST include doctor_tone — reflect how a real doctor would feel about what the patient is telling you.
      - 'reassuring' — when symptoms sound mild or manageable (cold, minor headache, small cut)
      - 'concerned' — when something could be serious but needs more info (persistent pain, unusual symptoms)
      - 'serious' — when the situation likely needs professional medical care (possible infection, fracture, etc.)
      - 'urgent' — when it's an emergency (chest pain, stroke signs, severe bleeding)
      - 'neutral' — for early information-gathering turns before you have a clear picture
      
      DIAGNOSTIC CONFIDENCE:
      - Every response MUST include diagnostic_confidence (0-100) — how sure you are about your current understanding.
      - Start low (10-20) when you barely know anything.
      - Increase as you gather more info (30-50 after a few exchanges).
      - Reach 70-95 when you're ready to diagnose.
      - This helps the patient see the consultation progressing.
      
      RED FLAGS:
      - Every response MUST include red_flags — an array of genuinely concerning findings.
      - Include things like: sudden severe headache, chest pain with sweating, blood in stool, family history of heart disease, high fever in elderly, etc.
      - Keep the array EMPTY if nothing is concerning yet. Do NOT include routine risk factors unless they are genuinely alarming.
      - These help the patient understand which symptoms need urgent attention.
      
      CLOSING SUMMARY:
      - Only populate closing_summary when is_complete is true.
      - Write it like a doctor's discharge instructions: what to do next, what to watch for, when to come back.
      - Be warm but clear. Include specific timeframes (e.g., "if this doesn't improve in 2-3 days").
      - Mention when to seek emergency care if things worsen.
      
      ACCURACY:
      - Simple words do not mean simple analysis. Your medical reasoning must be thorough and accurate.
      - If someone shares a photo, look at it carefully for clues.
      - Consider serious conditions first, even if they're rare.
      - Ask smart follow-up questions to narrow things down.
      - Age, gender, and medical history CHANGE your diagnosis. Never ignore them.
    `;

    const parts: any[] = history.map(m => ({ text: `${m.role.toUpperCase()}: ${m.content}` }));

    if (image) {
      const matches = image.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
      }
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: CHAT_DIAGNOSIS_SCHEMA,
        temperature: 0.2,
      },
    });

    if (!response.text) {
      throw new Error("Failed to get response from Dr. Tabib.");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Chat Diagnosis Error:", error);
    throw new Error("Diagnostic conversation failed. Please try again.");
  }
};

export const analyzePatientSymptoms = async (symptoms: string, image?: string): Promise<DiagnosisResponse> => {
  try {
    const modelId = 'gemini-3.5-flash-lite'; 
    
    const systemInstruction = `
      You are Dr. Tabib, a friendly health assistant powered by Tabib. You help everyday people understand what might be causing their symptoms. You are thorough and you take your time to get it right.

      WHAT YOU CAN DO:
      - Look at the symptoms someone describes and figure out what might be wrong.
      - If someone shares a photo (like a rash, swelling, or wound), you can look at it to help give a better answer.
      - You know a lot about health, but you explain things in simple, easy-to-understand words.

      HOW YOU WORK:
      1. Read the symptoms carefully. Think about when they started, how bad they are, and what makes them better or worse.
      2. If there's a photo, look at it for clues like redness, swelling, or anything unusual.
      3. Think about what health problems match these symptoms best.
      4. Always consider the patient's age, gender, and medical history when available.
      5. Always keep in mind if this could be something serious that needs urgent care.
      6. Use simple words everyone can understand. If you must use a medical word, explain it right away.

      WHAT YOUR DIAGNOSIS MUST INCLUDE:
      For each condition you list, explain:
      - What it is in simple words (not just the medical name)
      - Why you think it matches their symptoms
      - How serious it is (can they treat it at home, or do they need to see a doctor?)
      - What they should do RIGHT NOW
      - What to watch for that would mean it's getting worse

      FOR SMALL ISSUES (cold, mild headache, small cut, etc.):
      - Explain what it is
      - Give clear home care instructions (rest, ice, over-the-counter medicine, etc.)
      - Say when they should see a doctor if it doesn't get better
      - Don't make them worry unnecessarily

      FOR SERIOUS ISSUES (possible infections, broken bones, severe pain, etc.):
      - Be honest about how serious it is
      - Tell them exactly what to do next (see a doctor today, go to urgent care, etc.)
      - Explain what could happen if they ignore it

      FOR EMERGENCIES (chest trouble breathing, heavy bleeding, stroke signs):
      - Tell them to call emergency services IMMEDIATELY
      - Give step-by-step instructions for what to do while waiting
      - Keep them calm and give them clear actions to take

      IMPORTANT RULES:
      - You are an AI helper, NOT a real doctor. Always remind people of this.
      - Be kind and caring in every response.
      - Never use fancy medical words without explaining them in plain English.
      - It's better to be cautious and tell someone to see a doctor than to miss something serious.
      
      ACCURACY:
      - Simple language does not mean skipping important details. Your analysis must be thorough.
      - If someone shares a photo, examine it carefully for visual clues.
      - Consider serious but less common conditions alongside common ones.
      - Rank your suggestions by how likely they are based on the symptoms.
    `;

    const parts: any[] = [];

    if (image) {
      // Extract base64 data and mime type if it's a data URL
      const matches = image.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        });
      } else {
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: image
          }
        });
      }
    }

    // Add the text prompt
    parts.push({ 
      text: `Patient Presentation: "${symptoms}". ${image ? '[IMAGE ATTACHED FOR ANALYSIS]' : ''} \n\nTask: Perform a rigorous differential diagnosis. Identify the most probable pathologies, explain the mechanism of disease for the top match, and recommend clinical workup.` 
    });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: DIAGNOSIS_SCHEMA,
        temperature: 0.2,
      },
    });

    if (!response.text) {
      throw new Error("Tabib system failed to return a diagnosis.");
    }

    const data = JSON.parse(response.text) as DiagnosisResponse;
    return data;
  } catch (error) {
    console.error("Tabib Error:", error);
    throw new Error("Diagnostic analysis failed. Please verify input and retry.");
  }
};

export const analyzeMedication = async (query: string, image?: string): Promise<MedicationResponse> => {
  try {
    const modelId = 'gemini-3.5-flash-lite';
    
    const systemInstruction = `
      You are the Tabib "Pharma-Mind" helper. You help everyday people learn about their medicines in simple, easy-to-understand words.
      
      YOUR JOB:
      Look at the medication name or photo (box, bottle, pill, prescription) and explain what it is in plain English.
      
      IF THERE'S A PHOTO:
      - Read any text you can see on the packaging.
      - Look for the expiry date, when it was made, and the batch number. If you can read them, share them. If they're blurry or hidden, just say "I can't see this in the photo."
      - Note the company that made it and what strength it is (like 500mg).
      
      WHAT TO EXPLAIN:
      - What the medicine is for (in simple words).
      - How to take it (with food, without food, how often).
      - Common side effects (what might happen when you take it).
      - Important warnings (who should NOT take it).
      
      RULES:
      - Use everyday words, not pharmacy jargon.
      - If you see a loose pill with no label, try to describe its shape and color, but say you're not sure and recommend asking a pharmacist.
      - Always remind people to talk to their doctor or pharmacist before taking any medicine.
      - Structure your answer clearly.
      
      ACCURACY:
      - Simple words do not mean less accurate information. Be thorough and precise.
      - If a photo is provided, read every detail you can see.
      - Include all important warnings and side effects, even if they're rare.
      - If you're not sure about something, say so honestly.
    `;

    const parts: any[] = [];

    if (image) {
      const matches = image.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
      } else {
        parts.push({ inlineData: { mimeType: 'image/png', data: image } });
      }
    }

    parts.push({ 
      text: `Analyze this medication. Input: "${query}". ${image ? '[IMAGE ATTACHED]' : ''} \n\nExtract all visible details (dates, manufacturer) and provide deep clinical info.` 
    });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: MEDICATION_SCHEMA,
        temperature: 0.1, // Very low temp for factual accuracy
      },
    });

    if (!response.text) {
      throw new Error("Failed to analyze medication.");
    }

    return JSON.parse(response.text) as MedicationResponse;

  } catch (error) {
    console.error("Medication Analysis Error:", error);
    throw new Error("Medication analysis failed. Please ensure the image is clear or the name is correct.");
  }
};

export const generatePatientSample = async (): Promise<string> => {
  try {
    const modelId = 'gemini-3.5-flash-lite';
    const response = await ai.models.generateContent({
      model: modelId,
      contents: "Generate a short, realistic, first-person description of a patient experiencing a specific set of medical symptoms (approx 30-50 words). Do not mention the diagnosis name. Vary the specialty (neurology, cardiology, gastro, etc.).",
      config: {
        temperature: 1.0, 
      }
    });
    return response.text || "I've been having a persistent throbbing headache on the left side of my head for 2 days, accompanied by nausea and sensitivity to light.";
  } catch (error) {
    console.error("Error generating sample:", error);
    return "I have a sharp pain in my lower right abdomen that gets worse when I move, along with a low-grade fever and loss of appetite.";
  }
};

export const generateClinicalReport = async (diagnosisData: DiagnosisResponse, userSymptoms: string): Promise<string> => {
  try {
    const modelId = 'gemini-3.5-flash-lite';
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const patientId = Math.random().toString(36).substr(2, 8).toUpperCase();

    const prompt = `
      You are generating a clinical briefing document for an attending physician. This report was auto-generated by Tabib (an AI health assistant) after a patient consultation. Write in professional medical language appropriate for a doctor-to-doctor handoff.
      CRITICAL: The entire report MUST be written in English, regardless of what language the patient used to describe their symptoms. Translate any non-English symptoms, descriptions, or patient quotes into proper English clinical language.

      PATIENT SELF-REPORTED SYMPTOMS:
      "${userSymptoms}"

      TABIB AI ASSESSMENT DATA:
      ${JSON.stringify(diagnosisData, null, 2)}

      FORMAT REQUIREMENTS:
      - Use clean HTML inside a single <div class="report-content"> wrapper.
      - Do NOT use Markdown. Use only HTML tags: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <table>, <tr>, <td>.
      - Do NOT include <html>, <head>, <body>, or <style> tags.

      DOCUMENT STRUCTURE (write in this exact order):

      1. HEADER BLOCK:
         - <h1>Tabib — AI Health Assistant</h1>
         - <p><strong>Clinical Consultation Briefing</strong></p>
         - <div class="report-header-meta">
           <span>Patient ID: ${patientId}</span>
           <span>Date: ${today}</span>
           <span>Source: Tabib AI Triage</span>
         </div>

      2. SECTION: "Patient Presentation" (<h2>)
         - Summarize what the patient reported in their own words (third-person clinical tone).
         - Include: chief complaint, symptom onset, duration, severity (pain scale if given), location, and aggravating/alleviating factors.
         - Use <ul> to list individual reported symptoms.

      3. SECTION: "Relevant History" (<h2>)
         - Extract and list any: age, gender, known medical conditions, current medications, allergies, family history, or lifestyle factors mentioned.
         - If not provided, state "Not reported by patient."

      4. SECTION: "Tabib AI Differential Analysis" (<h2>)
         - Present the AI-generated differential diagnoses as a ranked list.
         - For each condition, include:
           - <strong>Condition name</strong> — probability %, urgency level, and a brief clinical rationale.
           - Matched symptoms as a comma-separated list.
         - Format as a <table> with columns: Rank, Condition, Probability, Urgency, Rationale.

      5. SECTION: "Recommended Workup" (<h2>)
         - List all recommendations from the AI assessment.
         - Include suggested labs, imaging, specialist referrals, or immediate interventions.
         - Use <ul> with clear action items.

      6. SECTION: "Red Flags & Urgency" (<h2>)
         - State whether this case is marked as emergency or routine.
         - If emergency: list the specific emergency steps the patient was instructed to follow.
         - If routine: note the urgency level and any worsening signs to watch for.

      7. SECTION: "Patient Instructions Given" (<h2>)
         - Summarize the plain-language advice Tabib gave the patient (self-care steps, OTC recommendations, follow-up timeline).

      8. FOOTER:
         - <p style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
             <strong>Disclaimer:</strong> This briefing was generated by Tabib, an AI-powered health assistant. It is not a substitute for professional medical judgment. All recommendations should be verified by a licensed physician before implementation. Tabib © ${new Date().getFullYear()} — All rights reserved.
           </p>

      TONE: Professional, concise, clinical. Write as if you are handing this patient off to the next doctor on shift.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { temperature: 0.2 }
    });

    return response.text || "<p>Unable to generate report at this time.</p>";
  } catch (e) {
    console.error("Error generating report", e);
    return "<p>Error generating report content.</p>";
  }
};
