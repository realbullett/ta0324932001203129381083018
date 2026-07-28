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
    mechanism_of_injury: {
      type: Type.OBJECT,
      description: "ONLY fill this for trauma/injury cases. Leave null if not applicable.",
      properties: {
        mechanism: { type: Type.STRING, description: "How the injury happened (e.g., 'Fall onto outstretched hand (FOOSH)', 'Direct blow', 'Motor vehicle accident')" },
        height_of_fall: { type: Type.STRING, description: "If fall: standing height, stairs, sports-related, etc." },
        surface: { type: Type.STRING, description: "Surface landed on: concrete, grass, carpet, etc." },
        direction_of_impact: { type: Type.STRING, description: "How the body part was positioned at impact" },
        immediate_symptoms: { type: Type.STRING, description: "What happened right after: instant pain, popping sound, swelling, etc." },
      }
    },
    pain_location: {
      type: Type.OBJECT,
      description: "Detailed anatomical pain location. Fill as specifically as possible.",
      properties: {
        anatomical_site: { type: Type.STRING, description: "Specific location (e.g., 'Distal radius, radial side', 'Ulnar aspect of wrist', 'Central anterior chest')" },
        side: { type: Type.STRING, enum: ["Left", "Right", "Bilateral", "Central", "N/A"], description: "Laterality" },
        depth: { type: Type.STRING, description: "Deep bone pain vs surface/soft tissue pain" },
        point_tenderness: { type: Type.STRING, description: "Specific point(s) that are tender to palpation" },
        radiates: { type: Type.STRING, description: "Does pain radiate? Where?" },
      }
    },
    pain_characteristics: {
      type: Type.OBJECT,
      description: "Detailed pain quality and pattern.",
      properties: {
        quality: { type: Type.STRING, description: "Sharp, aching, throbbing, burning, stabbing, etc." },
        pattern: { type: Type.STRING, description: "Constant, intermittent, only with movement, night pain, etc." },
        severity_rest: { type: Type.STRING, description: "Pain level at rest (1-10 or description)" },
        severity_movement: { type: Type.STRING, description: "Pain level with movement/activity" },
        aggravating_factors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "What makes pain worse" },
        alleviating_factors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "What makes pain better" },
      }
    },
    functional_limitations: {
      type: Type.OBJECT,
      description: "What the patient can and cannot do. Very useful for functional assessment.",
      properties: {
        can_rotate_wrist: { type: Type.STRING, description: "Can they pronate/supinate (turn palm up/down)?" },
        can_grip: { type: Type.STRING, description: "Can they grip objects? Strength?" },
        can_write: { type: Type.STRING, description: "Can they write or perform fine motor tasks?" },
        can_open_doors: { type: Type.STRING, description: "Can they use doorknobs, jars, etc.?" },
        can_lift: { type: Type.STRING, description: "Can they lift objects? Weight limit?" },
        finger_movement: { type: Type.STRING, description: "Can they move all fingers normally?" },
        other_limitations: { type: Type.STRING, description: "Any other functional limitations reported" },
      }
    },
    physical_exam_findings: {
      type: Type.OBJECT,
      description: "Observable findings reported by the patient or noted during consultation.",
      properties: {
        swelling: { type: Type.STRING, description: "Location and degree of swelling" },
        bruising: { type: Type.STRING, description: "Bruising present? Location, color, extent" },
        deformity: { type: Type.STRING, description: "Any visible deformity (dinner fork, angulation, etc.)" },
        skin_condition: { type: Type.STRING, description: "Skin intact? Cuts, abrasions, punctures?" },
        temperature: { type: Type.STRING, description: "Warmth or coolness of the affected area" },
        range_of_motion: { type: Type.STRING, description: "Active ROM if reported" },
        tenderness_points: { type: Type.STRING, description: "Specific points of tenderness on palpation" },
      }
    },
    neurovascular_assessment: {
      type: Type.OBJECT,
      description: "Neurovascular status — critical for fractures and crush injuries.",
      properties: {
        sensation: { type: Type.STRING, description: "Finger/toe sensation: normal, decreased, numb, tingling" },
        finger_movement: { type: Type.STRING, description: "Can they actively move all digits?" },
        capillary_refill: { type: Type.STRING, description: "Capillary refill time if known (normal <2 sec)" },
        pulse: { type: Type.STRING, description: "Radial/dorsalis pedis pulse if known" },
        color: { type: Type.STRING, description: "Color of distal extremity: normal, pale, blue, mottled" },
      }
    },
    previous_injuries: {
      type: Type.STRING,
      description: "Any previous injuries, surgeries, fractures, arthritis, bone disease, or osteoporosis risk factors for the affected area."
    },
    tetanus_status: {
      type: Type.STRING,
      description: "ONLY if skin is broken (cut, abrasion, puncture). Last tetanus vaccination year if known."
    },
    treatment_already_given: {
      type: Type.STRING,
      description: "What treatment has the patient already tried? Ice, medications, splint, brace, etc."
    },
    patient_goals: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Patient's specific concerns or goals (e.g., 'wants to know if they can return to work', 'concerned about ability to exercise', 'wants pain management options')"
    },
    imaging_history: {
      type: Type.STRING,
      description: "Any previous imaging for this condition: X-rays, MRI, CT, ultrasound, and results if known."
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

// --- Lightweight Schema (early conversation turns) ---
const CHAT_DIAGNOSIS_SCHEMA_LITE = {
  type: Type.OBJECT,
  properties: {
    response: { type: Type.STRING, description: "The message to the patient — keep it brief, 1-3 sentences" },
    is_emergency: { type: Type.BOOLEAN, description: "Whether this is a life-threatening emergency" },
    is_complete: { type: Type.BOOLEAN, description: "Whether enough information has been gathered to provide a diagnosis" },
    quick_replies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-4 short, clickable reply options the user can tap to answer quickly."
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
          icon: { type: Type.STRING, description: "A single emoji for this entry" },
          label: { type: Type.STRING, description: "Short category label" },
          value: { type: Type.STRING, description: "What the patient told you" },
        },
        required: ["icon", "label", "value"],
      },
      description: "Running notes from this consultation."
    },
    doctor_tone: {
      type: Type.STRING,
      enum: ["reassuring", "concerned", "serious", "neutral", "urgent"],
      description: "The emotional tone of this response."
    },
    diagnostic_confidence: {
      type: Type.NUMBER,
      description: "Confidence from 0-100. Start low (10-20), increase as you gather info."
    },
    red_flags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Genuinely concerning findings. Empty array if none."
    },
  },
  required: ["response", "is_emergency", "is_complete"],
};

// --- Trimmed System Instruction (early conversation turns) ---
const SYSTEM_INSTRUCTION_LITE = `
  You are Dr. Tabib, a friendly health assistant. Help people understand what might be wrong.
  
  RULES:
  - Use simple everyday words. Be warm and caring.
  - Keep responses SHORT — 1 to 3 sentences max. Ask 1-2 questions per turn.
  - ALWAYS include 3-4 quick reply options the user can tap.
  - Collect: age, gender, symptom duration, pain level, location, what makes it better/worse, other symptoms, medications, allergies, existing conditions.
  - If someone mentions chest pain, trouble breathing, heavy bleeding, or stroke signs — set is_emergency to true IMMEDIATELY and give emergency steps.
  - NEVER set is_complete to true yet. You are still gathering information.
  - Every response must include notebook_entries with running notes from this consultation.
  - Every response must include doctor_tone and diagnostic_confidence (start low, increase as you learn more).
  - Include red_flags array with genuinely concerning findings, or empty if none.
`;

// --- Full System Instruction (final diagnosis turn) ---
const SYSTEM_INSTRUCTION_FULL = `
  You are Dr. Tabib, a friendly and caring health assistant powered by Tabib. Your job is to help everyday people figure out what might be wrong when they're not feeling well. You are thorough, careful, and you NEVER rush to a conclusion.
  
  HOW TO TALK:
  - Use simple, everyday words. No big medical words.
  - Be warm and caring, like a trusted family doctor.
  - Talk like you're having a normal conversation, not giving a lecture.
  - If you must use a medical word, explain it right away in simple terms.
  
  THIS IS YOUR FINAL DIAGNOSIS TURN:
  You have gathered enough information. Now provide a complete diagnosis.
  
  YOUR DIAGNOSIS MUST INCLUDE:
  - What you think is most likely going on (in simple terms)
  - How serious it is (Low/Medium/High/Critical)
  - What they should do about it (self-care at home, see a doctor, go to ER)
  - What to watch out for that would mean it's getting worse
  - Any home remedies or immediate steps they can take
  
  DETAILED CLINICAL DATA — fill ALL of these:
  
  FOR INJURIES/TRAUMA:
  - Mechanism of injury, height of fall, surface, direction of impact, immediate symptoms
  
  FOR PAIN:
  - Exact anatomical location, pain quality, pattern, severity at rest vs movement, aggravating/alleviating factors
  
  FOR ALL CONDITIONS:
  - Functional limitations, physical exam findings, neurovascular status if limb involved
  - Previous injuries/surgeries, imaging history, current treatment tried, tetanus status
  - Patient's specific goals or concerns
  
  EMERGENCY (if is_emergency is true):
  - Tell them to call 911 IMMEDIATELY. Give step-by-step emergency instructions.
  
  RULES:
  - Include notebook_entries with ALL confirmed facts.
  - Include doctor_tone, diagnostic_confidence (70-95), red_flags, and closing_summary.
  - If is_complete is true, always include the diagnosis object with conditions array.
  - Always remind them this is AI, not a real doctor.
`;
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
          },
          required: ["name", "country_of_origin", "country_of_distribution"],
        },
        dates: {
          type: Type.OBJECT,
          properties: {
            production_date: { type: Type.STRING, description: "Date extracted from image text if visible, otherwise state 'Not visible'" },
            expiry_date: { type: Type.STRING, description: "Date extracted from image text if visible, otherwise state 'Not visible'" },
          },
          required: ["production_date", "expiry_date"],
        },
        specifications: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "Tablet, Capsule, Syrup, Injection, etc." },
            dosage: { type: Type.STRING, description: "e.g., 500mg, 10ml" },
            composition: { type: Type.STRING, description: "Active chemical ingredients" },
          },
          required: ["type", "dosage", "composition"],
        },
        clinical_info: {
          type: Type.OBJECT,
          properties: {
            uses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "What this medication treats or is used for" },
            administration_guide: { type: Type.STRING, description: "How/When to take, with food/without food, dosage instructions" },
            side_effects: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Common and serious side effects" },
            warnings: { type: Type.STRING, description: "Major contraindications, interactions, or box warnings" },
          },
          required: ["uses", "administration_guide", "side_effects", "warnings"],
        },
      },
      required: ["name", "generic_name", "manufacturer", "dates", "specifications", "clinical_info"],
    },
    analysis_confidence: { type: Type.NUMBER, description: "Confidence in identification 0-100" },
    disclaimer: { type: Type.STRING },
  },
  required: ["medication", "analysis_confidence", "disclaimer"],
};

export const chatDiagnosis = async (history: Message[], image?: string): Promise<any> => {
  try {
    const modelId = 'gemini-3.5-flash-lite';
    
    const isEarlyTurn = history.length <= 8;
    const systemInstruction = isEarlyTurn ? SYSTEM_INSTRUCTION_LITE : SYSTEM_INSTRUCTION_FULL;
    const responseSchema = isEarlyTurn ? CHAT_DIAGNOSIS_SCHEMA_LITE : CHAT_DIAGNOSIS_SCHEMA;

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
        responseSchema: responseSchema,
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

export const analyzeMedication = async (query: string, images?: string[]): Promise<MedicationResponse> => {
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

    if (images && images.length > 0) {
      for (const image of images) {
        const matches = image.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
        } else {
          parts.push({ inlineData: { mimeType: 'image/png', data: image } });
        }
      }
    }

    parts.push({ 
      text: `Analyze this medication. Input: "${query}". ${images && images.length > 0 ? `[${images.length} IMAGE(S) ATTACHED]` : ''} \n\nYou MUST extract ALL of the following fields completely. Do NOT leave any field empty or null:\n- medication.name (brand name)\n- medication.generic_name\n- medication.manufacturer.name, country_of_origin, country_of_distribution\n- medication.dates.production_date, expiry_date (read from image or state "Not visible on packaging")\n- medication.specifications.type, dosage, composition\n- medication.clinical_info.uses (array of what this medication treats)\n- medication.clinical_info.administration_guide (how to take it)\n- medication.clinical_info.side_effects (array of side effects)\n- medication.clinical_info.warnings (contraindications)\n\nFor clinical_info fields, use your medical knowledge to populate them based on the identified medication. These fields are REQUIRED, not optional.` 
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

      3. SECTION: "Mechanism of Injury" (<h2>) — ONLY if trauma/injury
         - If mechanism_of_injury data is available, present it as a detailed clinical narrative.
         - Include: mechanism type, height/surface/direction of impact, immediate symptoms post-injury.
         - If not a trauma case, OMIT this entire section.

      4. SECTION: "Pain Assessment" (<h2>)
         - Present pain_location and pain_characteristics data.
         - Use a <table> with: Parameter | Finding
         - Include: anatomical site, laterality, depth, point tenderness, radiation, quality, pattern, severity at rest vs movement, aggravating/alleviating factors.

      5. SECTION: "Functional Assessment" (<h2>)
         - Present functional_limitations data.
         - Use a <table> with: Function | Status
         - Include all reported abilities: wrist rotation, grip, writing, door opening, lifting, finger movement, and any other limitations.

      6. SECTION: "Physical Examination Findings" (<h2>)
         - Present physical_exam_findings data if available.
         - Include: swelling, bruising, deformity, skin condition, temperature, range of motion, tenderness points.
         - If not reported, state "Formal examination not available via teleconsultation."

      7. SECTION: "Neurovascular Assessment" (<h2>) — ONLY if limb injury
         - Present neurovascular_assessment data if available.
         - Include: sensation, finger/toe movement, capillary refill, pulse, color.
         - If not assessed, state "Neurovascular status not formally assessed."
         - OMIT this section if not a limb/extremity complaint.

      8. SECTION: "Relevant History" (<h2>)
         - Extract and list any: age, gender, known medical conditions, current medications, allergies, family history, or lifestyle factors mentioned.
         - Include previous_injuries, imaging_history, and tetanus_status if available.
         - If not provided, state "Not reported by patient."

      9. SECTION: "Tabib AI Differential Analysis" (<h2>)
         - Present the AI-generated differential diagnoses as a ranked list.
         - For each condition, include:
           - <strong>Condition name</strong> — probability %, urgency level, and a brief clinical rationale.
           - Matched symptoms as a comma-separated list.
         - Format as a <table> with columns: Rank, Condition, Probability, Urgency, Rationale.

      10. SECTION: "Recommended Workup" (<h2>)
         - List all recommendations from the AI assessment.
         - Include suggested labs, imaging, specialist referrals, or immediate interventions.
         - Use <ul> with clear action items.

      11. SECTION: "Treatment Already Attempted" (<h2>)
         - Summarize treatment_already_given if available.
         - Include: ice, medications, splint/brace, and any improvement noted.
         - If none, state "No treatment attempted prior to consultation."

      12. SECTION: "Red Flags & Urgency" (<h2>)
         - State whether this case is marked as emergency or routine.
         - If emergency: list the specific emergency steps the patient was instructed to follow.
         - If routine: note the urgency level and any worsening signs to watch for.

      13. SECTION: "Patient Goals & Concerns" (<h2>)
         - List patient_goals if available.
         - Include any specific questions or concerns the patient expressed (return to work, exercise, pain management, etc.)
         - If none stated, state "No specific concerns stated beyond symptom resolution."

      14. SECTION: "Patient Instructions Given" (<h2>)
         - Summarize the plain-language advice Tabib gave the patient (self-care steps, OTC recommendations, follow-up timeline).

      15. FOOTER:
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
