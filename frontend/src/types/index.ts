export interface User {
  id: number;
  email: string;
  full_name?: string | null;
  created_at: string;
}

export interface Project {
  id: number;
  user_id: number;
  title: string;
  document_type: "docx" | "pptx";
  main_topic: string;
  outline?: string[] | null;
  slides?: string[] | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Section {
  id: number;
  project_id: number;
  section_type: "section" | "slide";
  title: string;
  content?: string | null;
  order_index: number;
  created_at: string;
  updated_at?: string | null;
}

export interface Refinement {
  id: number;
  project_id: number;
  section_id: number;
  prompt: string;
  original_content: string;
  refined_content: string;
  user_feedback?: "like" | "dislike" | null;
  user_comment?: string | null;
  created_at: string;
}

