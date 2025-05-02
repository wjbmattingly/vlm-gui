'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '../../lib/store';
import MainLayout from '../../components/MainLayout';
import { FiUpload, FiDownload, FiImage, FiFile, FiTrash2, FiEdit, FiClipboard, FiList, FiGrid, FiRefreshCw } from 'react-icons/fi';
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
    exportProject,
    transcribeDocument,
    nerLabels
  } = useAppStore();
  
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isBatchTranscribing, setIsBatchTranscribing] = useState(false);
  const [transcribingIds, setTranscribingIds] = useState<string[]>([]);

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

  const toggleSelectDoc = (id: string) => {
    setSelectedDocs((prev) => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };
  const selectAll = () => setSelectedDocs(documents.map(d => d.id));
  const deselectAll = () => setSelectedDocs([]);
  const allSelected = selectedDocs.length === documents.length && documents.length > 0;

  const handleBatchTranscribe = async () => {
    setIsBatchTranscribing(true);
    setTranscribingIds(selectedDocs);
    try {
      for (const id of selectedDocs) {
        try {
          await transcribeDocument(id, nerLabels);
        } catch (e) {
          // Optionally handle per-doc error
        }
      }
    } finally {
      setIsBatchTranscribing(false);
      setTranscribingIds([]);
      deselectAll();
      // Optionally refetch documents
      fetchDocuments(projectId);
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
              className="btn btn-accent btn-lg font-semibold px-6 shadow-md transition-transform duration-150 hover:scale-105 hover:shadow-xl hover:brightness-110"
              onClick={() => router.push('/projects')}
            >
              Back to Projects
            </button>
            <button
              className="btn btn-primary btn-lg font-semibold px-6 shadow-md flex items-center gap-2 transition-transform duration-150 hover:scale-105 hover:shadow-xl hover:brightness-110"
              onClick={handleExport}
              disabled={documents.length === 0}
            >
              <FiDownload className="inline-block" />
              <span>Export Project</span>
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

          {/* Documents Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Documents ({documents.length})</h2>
              <button
                className={`btn btn-sm btn-ghost ${viewMode === 'grid' ? 'btn-active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <FiGrid />
              </button>
              <button
                className={`btn btn-sm btn-ghost ${viewMode === 'list' ? 'btn-active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <FiList />
              </button>
            </div>
            {documents.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  className="btn btn-accent btn-md font-semibold px-5 shadow-lg border-2 border-accent/60 bg-gradient-to-br from-accent to-accent-focus btn-accent-content hover:from-accent-focus hover:to-accent"
                  onClick={selectAll}
                  disabled={allSelected}
                  type="button"
                >
                  Select All
                </button>
                <button
                  className="btn btn-warning btn-md font-semibold px-5 shadow-lg border-2 border-warning/60 bg-gradient-to-br from-warning to-warning-focus btn-warning-content hover:from-warning-focus hover:to-warning"
                  onClick={deselectAll}
                  disabled={selectedDocs.length === 0}
                  type="button"
                >
                  Deselect All
                </button>
                <button
                  className="btn btn-primary btn-md font-semibold flex items-center gap-2 px-6 shadow-lg border-2 border-primary/60 bg-gradient-to-br from-primary to-primary-focus btn-primary-content hover:from-primary-focus hover:to-primary"
                  onClick={handleBatchTranscribe}
                  disabled={selectedDocs.length === 0 || isBatchTranscribing}
                  type="button"
                >
                  {isBatchTranscribing ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <FiRefreshCw />
                  )}
                  Transcribe Selected ({selectedDocs.length})
                </button>
              </div>
            )}
          </div>

          {/* Documents List or Grid */}
          <div>
            {documents.length === 0 ? (
              <div className="bg-base-200 p-8 text-center rounded-lg">
                <FiFile className="text-4xl mx-auto mb-4 text-primary opacity-50" />
                <p className="mb-2">No documents in this project yet.</p>
                <p>Upload some documents to get started.</p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="overflow-x-auto rounded-lg border border-base-200">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={allSelected}
                          onChange={allSelected ? deselectAll : selectAll}
                        />
                      </th>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Uploaded</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((document) => (
                      <tr key={document.id} className={selectedDocs.includes(document.id) ? 'bg-primary/10' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedDocs.includes(document.id)}
                            onChange={() => toggleSelectDoc(document.id)}
                          />
                        </td>
                        <td>
                          <div className="w-16 h-16 relative">
                            <Image src={document.imagePath} alt={document.name} fill className="object-contain rounded" />
                          </div>
                        </td>
                        <td className="font-semibold">{document.name}</td>
                        <td>
                          {document.transcript ? (
                            <span className="badge badge-success badge-outline">Transcribed</span>
                          ) : (
                            <span className="badge badge-outline">Not Transcribed</span>
                          )}
                          {transcribingIds.includes(document.id) && (
                            <span className="ml-2 loading loading-spinner loading-xs"></span>
                          )}
                        </td>
                        <td>{new Date(document.createdAt).toLocaleDateString()}</td>
                        <td className="flex gap-2">
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
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className={`group bg-white dark:bg-base-200 rounded-2xl shadow-lg border border-base-200 hover:shadow-2xl transition-all duration-150 p-0 flex flex-col min-h-[210px] cursor-pointer hover:border-primary/40 ${selectedDocs.includes(document.id) ? 'ring-2 ring-primary' : ''}`}
                    onClick={(e) => {
                      // Prevent click if clicking the delete or checkbox
                      if ((e.target as HTMLElement).closest('.no-prop')) return;
                      router.push(`/documents/${document.id}`);
                    }}
                    style={{ position: 'relative' }}
                  >
                    {/* Delete icon in top-right, only on hover */}
                    <button
                      className="no-prop absolute top-3 right-3 z-10 btn btn-sm btn-circle bg-white dark:bg-base-200 text-error border-error opacity-0 group-hover:opacity-100 transition-opacity shadow hover:bg-error/10"
                      onClick={(e) => { e.stopPropagation(); handleDeleteDocument(document.id); }}
                      title="Delete Document"
                      type="button"
                    >
                      <FiTrash2 />
                    </button>
                    <div className="flex items-center gap-2 p-4">
                      <input
                        type="checkbox"
                        className="checkbox no-prop"
                        checked={selectedDocs.includes(document.id)}
                        onChange={(e) => { e.stopPropagation(); toggleSelectDoc(document.id); }}
                        onClick={e => e.stopPropagation()}
                      />
                      <span className="text-base-content/60 text-xs">Select</span>
                    </div>
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
                        {transcribingIds.includes(document.id) && (
                          <span className="ml-2 loading loading-spinner loading-xs"></span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-base-content/50 mb-2">
                        <span>Uploaded:</span>
                        <span>{new Date(document.createdAt).toLocaleDateString()}</span>
                      </div>
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