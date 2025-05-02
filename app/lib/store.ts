import { create } from 'zustand';
import { NerEntity } from './transcription-service';

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    documents: number;
  };
}

export interface Document {
  id: string;
  name: string;
  imagePath: string;
  transcript?: NerEntity[];
  createdAt: string;
  updatedAt: string;
  projectId: string;
  annotations?: Annotation[];
}

export interface Annotation {
  id: string;
  token: string;
  nerClass: string | null;
  startIndex: number;
  endIndex: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  projects: Project[];
  currentProject: Project | null;
  documents: Document[];
  currentDocument: Document | null;
  nerLabels: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setDocuments: (documents: Document[]) => void;
  setCurrentDocument: (document: Document | null) => void;
  setNerLabels: (labels: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Fetch data
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  fetchDocuments: (projectId: string) => Promise<void>;
  fetchDocument: (id: string) => Promise<void>;
  
  // Create
  createProject: (name: string, description?: string) => Promise<Project>;
  createDocument: (projectId: string, file: File, name?: string) => Promise<Document>;
  
  // Update
  updateDocument: (id: string, data: Partial<Document>) => Promise<Document>;
  updateAnnotation: (id: string, data: Partial<Annotation>) => Promise<Annotation>;
  
  // Delete
  deleteProject: (id: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
  
  // Transcribe
  transcribeDocument: (id: string, nerLabels?: string) => Promise<Document>;
  
  // Export
  exportDocuments: (documentIds: string[]) => Promise<string>;
  exportProject: (projectId: string) => Promise<string>;
}

export const useAppStore = create<AppState>((set, get) => ({
  projects: [],
  currentProject: null,
  documents: [],
  currentDocument: null,
  nerLabels: 'person, organization, location, date, event',
  isLoading: false,
  error: null,
  
  // Setters
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setDocuments: (documents) => set({ documents }),
  setCurrentDocument: (document) => set({ currentDocument: document }),
  setNerLabels: (labels) => set({ nerLabels: labels }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  // Fetch data
  fetchProjects: async () => {
    const { setIsLoading, setError, setProjects } = get();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      
      const projects = await response.json();
      setProjects(projects);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  },
  
  fetchProject: async (id) => {
    const { setIsLoading, setError, setCurrentProject, setDocuments } = get();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }
      
      const project = await response.json();
      setCurrentProject(project);
      
      if (project.documents) {
        setDocuments(project.documents);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      console.error(`Error fetching project ${id}:`, error);
    } finally {
      setIsLoading(false);
    }
  },
  
  fetchDocuments: async (projectId) => {
    const { setIsLoading, setError, setDocuments } = get();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${projectId}/documents`);
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }
      
      const documents = await response.json();
      setDocuments(documents);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      console.error(`Error fetching documents for project ${projectId}:`, error);
    } finally {
      setIsLoading(false);
    }
  },
  
  fetchDocument: async (id) => {
    const { setIsLoading, setError, setCurrentDocument } = get();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/documents/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }
      
      const document = await response.json();
      setCurrentDocument(document);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      console.error(`Error fetching document ${id}:`, error);
    } finally {
      setIsLoading(false);
    }
  },
  
  // Create
  createProject: async (name, description) => {
    const { setIsLoading, setError, fetchProjects } = get();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.statusText}`);
      }
      
      const project = await response.json();
      await fetchProjects();
      
      return project;
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      console.error('Error creating project:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  },
  
  createDocument: async (projectId, file, name) => {
    const { setIsLoading, setError, fetchDocuments } = get();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      if (name) {
        formData.append('name', name);
      }
      
      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create document: ${response.statusText}`);
      }
      
      const document = await response.json();
      await fetchDocuments(projectId);
      
      return document;
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      console.error('Error creating document:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  },
  
  // Update
  updateDocument: async (id, data) => {
    const { setIsLoading, setError, fetchDocument, currentDocument } = get();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update document: ${response.statusText}`);
      }
      
      const updatedDocument = await response.json();
      
      // Refresh the current document if it's the one we just updated
      if (currentDocument && currentDocument.id === id) {
        await fetchDocument(id);
      }
      
      return updatedDocument;
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      console.error(`Error updating document ${id}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  },
  
  updateAnnotation: async (id, data) => {
    const { setIsLoading, setError, fetchDocument, currentDocument } = get();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/annotations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update annotation: ${response.statusText}`);
      }
      
      const updatedAnnotation = await response.json();
      
      // Refresh the current document if it contains this annotation
      if (currentDocument) {
        await fetchDocument(currentDocument.id);
      }
      
      return updatedAnnotation;
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      console.error(`Error updating annotation ${id}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  },
  
  // Delete
  deleteProject: async (id) => {
    const { setIsLoading, setError, fetchProjects, currentProject, setCurrentProject } = get();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete project: ${response.statusText}`);
      }
      
      // If the deleted project is the current project, clear it
      if (currentProject && currentProject.id === id) {
        setCurrentProject(null);
      }
      
      await fetchProjects();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      console.error(`Error deleting project ${id}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  },
  
  deleteDocument: async (id) => {
    const { setIsLoading, setError, fetchDocuments, currentDocument, setCurrentDocument, currentProject } = get();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.statusText}`);
      }
      
      // If the deleted document is the current document, clear it
      if (currentDocument && currentDocument.id === id) {
        setCurrentDocument(null);
      }
      
      // Refresh the documents list if we have a current project
      if (currentProject) {
        await fetchDocuments(currentProject.id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      console.error(`Error deleting document ${id}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  },
  
  deleteAnnotation: async (id) => {
    const { setIsLoading, setError, fetchDocument, currentDocument } = get();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/annotations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete annotation: ${response.statusText}`);
      }
      
      // Refresh the current document to update annotations
      if (currentDocument) {
        await fetchDocument(currentDocument.id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      console.error(`Error deleting annotation ${id}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  },
  
  // Transcribe
  transcribeDocument: async (id, nerLabels) => {
    const { setIsLoading, setError, fetchDocument, nerLabels: defaultNerLabels } = get();
    const labels = nerLabels || defaultNerLabels;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/documents/${id}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nerLabels: labels }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to transcribe document: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Refresh the document to get updated data
      await fetchDocument(id);
      
      return result.document;
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      console.error(`Error transcribing document ${id}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  },
  
  // Export
  exportDocuments: async (documentIds) => {
    const { setIsLoading, setError } = get();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentIds }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to export documents: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.downloadUrl;
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      console.error('Error exporting documents:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  },
  
  exportProject: async (projectId) => {
    const { setIsLoading, setError } = get();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to export project: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.downloadUrl;
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      console.error(`Error exporting project ${projectId}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  },
})); 