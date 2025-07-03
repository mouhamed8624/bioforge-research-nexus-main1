
import { Json } from "@/integrations/supabase/types";

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  abstract?: string | null;
  publication_date?: string | null;
  journal?: string | null;
  doi?: string | null;
  keywords?: string[] | null;
  categories?: string[] | null;
  file_path?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
}

export interface PaperComment {
  id: string;
  paper_id: string;
  user_id: string;
  content: string;
  page_number?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PaperProjectLink {
  id: string;
  paper_id: string;
  project_id: string;
  created_at?: string | null;
}

export interface PaperFormData {
  title: string;
  authors: string;
  abstract?: string;
  publication_date?: string;
  journal?: string;
  doi?: string;
  keywords?: string;
  categories?: string[];
  file?: File | null;
}

export const PAPER_CATEGORIES = [
  'Clinical Research',
  'Basic Science',
  'Epidemiology',
  'Public Health',
  'Immunology',
  'Virology',
  'Parasitology',
  'Genomics',
  'Bioinformatics',
  'Drug Development',
  'Vaccine Research',
  'Diagnostics',
  'Tropical Medicine',
  'Infectious Diseases',
  'Malaria Research',
  'HIV/AIDS',
  'Tuberculosis',
  'Neglected Tropical Diseases',
  'Global Health',
  'Other'
];
