
import { supabase } from "@/integrations/supabase/client";

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string | null;
  categories: string[] | null;
  file_url: string | null;
  file_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  publication_date?: string | null;
  journal?: string | null;
  doi?: string | null;
  keywords?: string[] | null;
}

export interface PaperComment {
  id: string;
  content: string;
  author_name: string;
  dataset_id: string | null;
  created_at: string | null;
}

// Get all research papers
export const getPapers = async (): Promise<ResearchPaper[]> => {
  console.log("Fetching research papers from database");
  
  const { data, error } = await supabase
    .from('research_papers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching papers:', error);
    throw error;
  }

  return data || [];
};

// Get all research papers (alias)
export const getResearchPapers = async (): Promise<ResearchPaper[]> => {
  return getPapers();
};

// Add a new research paper
export const addPaper = async (paperData: any): Promise<ResearchPaper> => {
  console.log("Adding research paper to database:", paperData);
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to add papers");
  }

  // Prepare the data for insertion
  const insertData = {
    title: paperData.title,
    authors: paperData.authors ? paperData.authors.split(',').map((author: string) => author.trim()) : [],
    abstract: paperData.abstract || null,
    publication_date: paperData.publication_date || null,
    journal: paperData.journal || null,
    doi: paperData.doi || null,
    keywords: paperData.keywords ? paperData.keywords.split(',').map((keyword: string) => keyword.trim()) : null,
    categories: paperData.categories || null,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from('research_papers')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('Error adding paper:', error);
    throw error;
  }

  console.log('Paper added successfully:', data);
  return data;
};

// Get a single research paper by ID
export const getResearchPaper = async (id: string): Promise<ResearchPaper | null> => {
  console.log("Fetching research paper:", id);
  
  const { data, error } = await supabase
    .from('research_papers')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching paper:', error);
    throw error;
  }

  return data;
};

// Get a single research paper by ID (alias)
export const getPaperById = async (id: string): Promise<ResearchPaper | null> => {
  return getResearchPaper(id);
};

// Add a new research paper (alias)
export const addResearchPaper = async (paper: Omit<ResearchPaper, 'id' | 'created_at' | 'updated_at'>): Promise<ResearchPaper> => {
  return addPaper(paper);
};

// Update a research paper
export const updateResearchPaper = async (id: string, updates: Partial<ResearchPaper>): Promise<ResearchPaper> => {
  console.log("Updating research paper:", id, updates);
  
  const { data, error } = await supabase
    .from('research_papers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating paper:', error);
    throw error;
  }

  return data;
};

// Delete a research paper
export const deletePaper = async (id: string): Promise<boolean> => {
  console.log("Deleting research paper:", id);
  
  const { error } = await supabase
    .from('research_papers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting paper:', error);
    throw error;
  }

  return true;
};

// Get comments for a paper (using research_comments table structure)
export const getPaperComments = async (paperId: string): Promise<PaperComment[]> => {
  console.log('Fetching comments for paper:', paperId);
  
  const { data, error } = await supabase
    .from('research_comments')
    .select('*')
    .eq('dataset_id', paperId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  return data || [];
};

// Add a comment to a paper (adapted for research_comments table)
export const addPaperComment = async (comment: { content: string; author_name: string; dataset_id: string }): Promise<PaperComment> => {
  console.log('Adding comment to paper:', comment);
  
  const { data, error } = await supabase
    .from('research_comments')
    .insert([comment])
    .select()
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }

  return data;
};

// Get paper file URL
export const getPaperFileUrl = async (filePath: string): Promise<string | null> => {
  console.log('Getting file URL for path:', filePath);
  
  const { data } = supabase.storage
    .from('papers')
    .getPublicUrl(filePath);

  return data?.publicUrl || null;
};

// Get paper file
export const getPaperFile = async (paperId: string): Promise<Blob | null> => {
  console.log('Getting paper file for ID:', paperId);
  
  // First get the paper to find the file path
  const paper = await getPaperById(paperId);
  if (!paper?.file_path) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from('papers')
    .download(paper.file_path);

  if (error) {
    console.error('Error downloading file:', error);
    return null;
  }

  return data;
};

// Get papers linked to a project
export const getPaperProjects = async (paperId: string): Promise<string[]> => {
  console.log('Fetching paper projects for:', paperId);
  // This would require a junction table - for now return empty array
  return [];
};

// Link paper to project
export const linkPaperToProject = async (paperId: string, projectId: string): Promise<boolean> => {
  console.log('Linking paper to project:', paperId, projectId);
  // This would require a junction table - for now return false
  return false;
};

// Get papers linked to a project
export const getLinkedPapers = async (projectId: string): Promise<ResearchPaper[]> => {
  console.log('Fetching linked papers for project:', projectId);
  // This would require a junction table - for now return empty array
  return [];
};
