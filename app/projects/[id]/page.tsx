'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '../../lib/store';
import MainLayout from '../../components/MainLayout';
import { FiUpload, FiDownload, FiImage, FiFile, FiTrash2, FiEdit, FiClipboard, FiList, FiGrid, FiRefreshCw } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { convertPDFToImages, blobToFile, isPDFFile, PDFProcessingProgress } from '../../lib/pdf-utils';

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
  const [pdfProgress, setPdfProgress] = useState<PDFProcessingProgress | null>(null);
  const [currentPdfName, setCurrentPdfName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'upload-date' | 'name' | 'transcription' | 'annotations'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [popoutDocument, setPopoutDocument] = useState<any>(null);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
      fetchDocuments(projectId);
    }
  }, [projectId, fetchProject, fetchDocuments]);

  const processPDFFile = async (file: File) => {
    setCurrentPdfName(file.name);
    setPdfProgress({ currentPage: 0, totalPages: 0, percentage: 0 });
    setUploadError(null);
    
    try {
      const pageImages = await convertPDFToImages(file, {
        scale: 2.0,
        format: 'png',
        onProgress: (progress) => {
          setPdfProgress(progress);
        }
      });

      // Upload each page as a separate document
      for (const pageImage of pageImages) {
        const imageFile = blobToFile(pageImage.blob, pageImage.fileName);
        await createDocument(projectId, imageFile);
      }
      
      return pageImages.length;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadError(`Failed to process PDF "${file.name}": ${errorMessage}`);
      console.error('PDF processing error:', error);
      throw error;
    } finally {
      setPdfProgress(null);
      setCurrentPdfName('');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !projectId) return;
    
    setIsUploading(true);
    setUploadError(null);
    try {
      let totalDocumentsCreated = 0;
      
      // Process each file
      for (const file of acceptedFiles) {
        try {
          if (isPDFFile(file)) {
            // Process PDF - convert to images and upload each page
            const pagesCount = await processPDFFile(file);
            totalDocumentsCreated += pagesCount;
          } else {
            // Regular image file - upload directly
            await createDocument(projectId, file);
            totalDocumentsCreated += 1;
          }
        } catch (error) {
          // Continue with other files even if one fails
          console.error(`Failed to process file ${file.name}:`, error);
        }
      }
      
      if (totalDocumentsCreated > 0) {
        console.log(`Successfully uploaded ${totalDocumentsCreated} documents`);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadError('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [projectId, createDocument]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.tiff', '.bmp', '.webp'],
      'application/pdf': ['.pdf']
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

  const selectAllWithoutTranscription = () => {
    setSelectedDocs(documents.filter(d => !d.transcript).map(d => d.id));
  };
  const allUntranscribedSelected = documents.length > 0 && documents.filter(d => !d.transcript).every(d => selectedDocs.includes(d.id));

  // Sorting logic
  const sortedDocuments = [...documents].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'upload-date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'transcription':
        // Sort by transcription status: transcribed items first or last depending on order
        const aHasTranscript = !!a.transcript;
        const bHasTranscript = !!b.transcript;
        if (aHasTranscript && !bHasTranscript) comparison = -1;
        else if (!aHasTranscript && bHasTranscript) comparison = 1;
        else comparison = 0;
        break;
      case 'annotations':
        const aAnnotations = a.annotations?.length || 0;
        const bAnnotations = b.annotations?.length || 0;
        comparison = aAnnotations - bAnnotations;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

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

  // Hover handlers for popout effect
  const handleMouseEnter = (document: any) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    const timeout = setTimeout(() => {
      setPopoutDocument(document);
    }, 1000); // 1 second
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const closePopout = () => {
    setPopoutDocument(null);
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
    };
  }, [hoverTimeout]);

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
              ${isUploading ? 'pointer-events-none opacity-75' : ''}
            `}
          >
            <input {...getInputProps()} />
            <FiUpload className="text-4xl mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-bold mb-2">Upload Documents</h3>
            <p>Drag & drop image files or PDFs here, or click to select files</p>
            <p className="text-sm text-base-content/70 mt-2">
              Supported formats: PNG, JPG, JPEG, GIF, TIFF, BMP, WebP, PDF
            </p>
            <p className="text-xs text-base-content/50 mt-1">
              PDF files will be automatically converted to individual page images
            </p>
            {uploadError && (
              <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg">
                <p className="text-error text-sm font-medium">{uploadError}</p>
              </div>
            )}
            {isUploading && (
              <div className="mt-4">
                <div className="loading loading-spinner loading-md"></div>
                {pdfProgress ? (
                  <div className="mt-3">
                    <p className="font-medium">Processing PDF: {currentPdfName}</p>
                    <div className="mt-2 bg-base-300 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-2 transition-all duration-300"
                        style={{ width: `${pdfProgress.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm mt-1">
                      Page {pdfProgress.currentPage} of {pdfProgress.totalPages} ({Math.round(pdfProgress.percentage)}%)
                    </p>
                  </div>
                ) : (
                  <p className="mt-2">Uploading...</p>
                )}
              </div>
            )}
          </div>

          {/* View Toggle and Batch Actions */}
          <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
            {/* Sort Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-base-content/70">Sort by:</span>
                <select 
                  className="select select-bordered select-sm w-40"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                >
                  <option value="upload-date">Upload Date</option>
                  <option value="name">File Name</option>
                  <option value="transcription">Transcription Status</option>
                  <option value="annotations">Annotations Count</option>
                </select>
              </div>
              <button
                className={`btn btn-sm btn-circle ${sortOrder === 'desc' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-base-content/70">View:</span>
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
          </div>

          {/* Documents Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Documents ({documents.length})</h2>
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
                  className="btn btn-info btn-md font-semibold px-5 shadow-lg border-2 border-info/60 bg-gradient-to-br from-info to-info-focus btn-info-content hover:from-info-focus hover:to-info"
                  onClick={selectAllWithoutTranscription}
                  disabled={allUntranscribedSelected || documents.filter(d => !d.transcript).length === 0}
                  type="button"
                >
                  Select All Without Transcription
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
                    {sortedDocuments.map((document) => (
                      <tr 
                        key={document.id} 
                        className={selectedDocs.includes(document.id) ? 'bg-primary/10' : ''}
                        onMouseEnter={() => handleMouseEnter(document)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedDocs.includes(document.id)}
                            onChange={() => toggleSelectDoc(document.id)}
                          />
                        </td>
                        <td>
                          <div className="w-16 h-16 relative overflow-hidden rounded">
                            <Image 
                              src={document.imagePath} 
                              alt={document.name} 
                              fill 
                              className="object-contain rounded transition-transform duration-500 hover:scale-110 cursor-pointer" 
                            />
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
                {sortedDocuments.map((document) => (
                  <div
                    key={document.id}
                    className={`group bg-white dark:bg-base-200 rounded-2xl shadow-lg border border-base-200 hover:shadow-2xl transition-all duration-150 p-0 flex flex-col min-h-[210px] cursor-pointer hover:border-primary/40 ${selectedDocs.includes(document.id) ? 'ring-2 ring-primary' : ''}`}
                    onClick={(e) => {
                      // Prevent click if clicking the delete or checkbox
                      if ((e.target as HTMLElement).closest('.no-prop')) return;
                      router.push(`/documents/${document.id}`);
                    }}
                    onMouseEnter={() => handleMouseEnter(document)}
                    onMouseLeave={handleMouseLeave}
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
                        className="object-contain transition-transform duration-500 hover:scale-110 cursor-pointer"
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

      {/* Popout Modal */}
      {popoutDocument && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closePopout}
        >
          <div 
            className="bg-white dark:bg-base-200 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-base-200">
              <div>
                <h3 className="text-2xl font-bold text-primary">{popoutDocument.name}</h3>
                <div className="flex items-center gap-4 mt-2">
                  {popoutDocument.transcript ? (
                    <span className="badge badge-success badge-lg">Transcribed</span>
                  ) : (
                    <span className="badge badge-outline badge-lg">Not Transcribed</span>
                  )}
                  {popoutDocument.annotations && popoutDocument.annotations.length > 0 && (
                    <span className="badge badge-info badge-lg">
                      {popoutDocument.annotations.length} Annotations
                    </span>
                  )}
                  <span className="text-sm text-base-content/70">
                    Uploaded: {new Date(popoutDocument.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button 
                className="btn btn-circle btn-ghost text-xl"
                onClick={closePopout}
              >
                ×
              </button>
            </div>
            
            {/* Image */}
            <div className="p-6">
              <div className="relative w-full h-[60vh] bg-base-300 rounded-lg overflow-hidden">
                <Image
                  src={popoutDocument.imagePath}
                  alt={popoutDocument.name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-base-200">
              <Link
                href={`/documents/${popoutDocument.id}`}
                className="btn btn-primary btn-lg px-8"
                onClick={closePopout}
              >
                Open Document
              </Link>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
} 