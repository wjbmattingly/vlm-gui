'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '../../lib/store';
import MainLayout from '../../components/MainLayout';
import { FiUpload, FiDownload, FiImage, FiFile, FiTrash2, FiEdit, FiClipboard } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const { 
    currentProject, 
    documents, 
    fetchProject, 
    fetchDocuments, 
    createDocument, 
    deleteDocument,
    exportProject
  } = useAppStore();
  
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
      fetchDocuments(projectId);
    }
  }, [projectId, fetchProject, fetchDocuments]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !projectId) return;
    
    setIsUploading(true);
    try {
      // Process each file
      for (const file of acceptedFiles) {
        await createDocument(projectId, file);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  }, [projectId, createDocument]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.tiff', '.bmp', '.webp']
    }
  });

  const handleExport = async () => {
    if (!projectId) return;
    
    try {
      const downloadUrl = await exportProject(projectId);
      
      // Open the download URL in a new tab
      window.open(`/api/export?path=${downloadUrl}`, '_blank');
    } catch (error) {
      console.error('Error exporting project:', error);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(id);
      } catch (error) {
        console.error('Failed to delete document:', error);
      }
    }
  };

  if (!currentProject) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">{currentProject.name}</h1>
            {currentProject.description && (
              <p className="text-base-content/70">{currentProject.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <button
              className="btn btn-outline"
              onClick={() => router.push('/projects')}
            >
              Back to Projects
            </button>
            <button
              className="btn btn-primary"
              onClick={handleExport}
              disabled={documents.length === 0}
            >
              <FiDownload className="mr-2" /> Export Project
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Upload Section */}
          <div 
            {...getRootProps()} 
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors hover:bg-base-200
              ${isDragActive ? 'bg-primary/10 border-primary' : 'border-base-300'}
            `}
          >
            <input {...getInputProps()} />
            <FiUpload className="text-4xl mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-2">Upload Documents</h3>
            <p>Drag & drop image files here, or click to select files</p>
            <p className="text-sm text-base-content/70 mt-2">
              Supported formats: PNG, JPG, JPEG, GIF, TIFF, BMP, WebP
            </p>
            {isUploading && (
              <div className="mt-4">
                <div className="loading loading-spinner loading-md"></div>
                <p className="mt-2">Uploading...</p>
              </div>
            )}
          </div>

          {/* Documents List */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Documents ({documents.length})</h2>
            {documents.length === 0 ? (
              <div className="bg-base-200 p-8 text-center rounded-lg">
                <FiFile className="text-4xl mx-auto mb-4 text-primary opacity-50" />
                <p className="mb-2">No documents in this project yet.</p>
                <p>Upload some documents to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="group bg-white dark:bg-base-200 rounded-2xl shadow-lg border border-base-200 hover:shadow-2xl transition-all duration-150 p-0 flex flex-col min-h-[210px] cursor-pointer hover:border-primary/40"
                  >
                    <figure className="relative h-48 bg-base-300 rounded-t-2xl overflow-hidden">
                      <Image
                        src={document.imagePath}
                        alt={document.name}
                        fill
                        className="object-contain"
                      />
                    </figure>
                    <div className="flex-1 p-6 pb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-primary group-hover:text-primary-focus transition-colors">
                          {document.name}
                        </span>
                        {document.transcript ? (
                          <span className="ml-auto badge badge-success badge-outline text-xs font-semibold px-2 py-1">Transcribed</span>
                        ) : (
                          <span className="ml-auto badge badge-outline text-xs font-semibold px-2 py-1">Not Transcribed</span>
                        )}
                        {document.annotations && document.annotations.length > 0 && (
                          <span className="badge badge-info badge-outline text-xs font-semibold px-2 py-1">
                            {document.annotations.length} Anno
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-base-content/50 mb-2">
                        <span>Uploaded:</span>
                        <span>{new Date(document.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 px-6 pb-4 pt-2">
                      <button
                        className="btn btn-sm btn-circle btn-ghost text-error hover:bg-error/10"
                        onClick={() => handleDeleteDocument(document.id)}
                        title="Delete Document"
                      >
                        <FiTrash2 />
                      </button>
                      <Link
                        href={`/documents/${document.id}`}
                        className="btn btn-primary btn-sm rounded-lg px-4 font-semibold shadow-none"
                      >
                        Open Document
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 