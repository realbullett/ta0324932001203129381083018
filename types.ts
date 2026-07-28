export enum UrgencyLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export interface MedicalCondition {
  name: string;
  probability: number; // 0-100
  description: string;
  urgency: UrgencyLevel;
  symptoms_matched: string[];
  recommendations: string[];
}

export interface DiagnosisResponse {
  conditions: MedicalCondition[];
  disclaimer: string;
  general_advice: string;
}

export interface DiagnosisState {
  results: DiagnosisResponse | null;
  loading: boolean;
  error: string | null;
  messages: Message[];
  is_emergency: boolean;
  is_complete: boolean;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// --- Medication Types ---

export interface MedicationDetails {
  name: string;
  generic_name: string;
  manufacturer: {
    name: string;
    country_of_origin: string;
    country_of_distribution: string;
  };
  dates: {
    production_date: string; // Extracted or "Not visible on packaging"
    expiry_date: string;    // Extracted or "Not visible on packaging"
  };
  specifications: {
    type: string; // Tablet, Syrup, etc.
    dosage: string;
    composition: string;
  };
  clinical_info: {
    uses: string[];
    administration_guide: string;
    side_effects: string[];
    warnings: string;
  };
}

export interface MedicationResponse {
  medication: MedicationDetails;
  analysis_confidence: number; // 0-100
  disclaimer: string;
}

export interface MedicationState {
  results: MedicationResponse | null;
  loading: boolean;
  error: string | null;
}

export type ViewMode = 'landing' | 'home' | 'diagnosis' | 'medication' | 'about' | 'privacy';
