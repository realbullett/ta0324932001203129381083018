import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tzbpjhujzaaadwhivmce.supabase.co';
const supabaseKey = 'sb_publishable_dkQiwul3NVZSFk5zdLZRog_GMr7Of8W';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface DiagnosisRecord {
  id: string;
  user_email: string;
  user_name: string;
  type: 'diagnosis' | 'medication';
  conditions: string;
  messages: string;
  general_advice: string;
  disclaimer: string;
  is_emergency: boolean;
  medication_data: string | null;
  report_html: string | null;
  created_at: string;
}
