'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppStore } from '../../lib/store';
import MainLayout from '../../components/MainLayout';
import { 
  FiArrowLeft, FiDownload, FiEdit, FiSave, 
  FiClipboard, FiTag, FiTrash2, FiRefreshCw 
} from 'react-icons/fi';
import { NerEntity } from '@/app/lib/transcription-service';

// Define available NER class colors
const NER_COLORS: Record<string, string> = {
  person: 'bg-red-100 border-red-200 text-red-800',
  organization: 'bg-blue-100 border-blue-200 text-blue-800',
  location: 'bg-green-100 border-green-200 text-green-800',
  date: 'bg-yellow-100 border-yellow-200 text-yellow-800',
  event: 'bg-purple-100 border-purple-200 text-purple-800',
  // Default color
  default: 'bg-gray-100 border-gray-200 text-gray-800'
};

// Helper for entity colors
const ENTITY_COLORS: Record<string, string> = {
  person: 'bg-red-100 text-red-800 border-red-200',
  organization: 'bg-blue-100 text-blue-800 border-blue-200',
  location: 'bg-green-100 text-green-800 border-green-200',
  date: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  event: 'bg-purple-100 text-purple-800 border-purple-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const { 
    currentDocument, 
    fetchDocument, 
    transcribeDocument, 
    updateDocument,
    updateAnnotation,
    deleteAnnotation,
    exportDocuments,
    nerLabels,
    setNerLabels
  } = useAppStore();
  
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customNerLabels, setCustomNerLabels] = useState(nerLabels);
  const [editableTranscript, setEditableTranscript] = useState<NerEntity[]>([]);
  const [selectedToken, setSelectedToken] = useState<{index: number, entity: NerEntity} | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');

  useEffect(() => {
    if (documentId) {
      fetchDocument(documentId);
    }
  }, [documentId, fetchDocument]);

  useEffect(() => {
    if (currentDocument?.transcript) {
      setEditableTranscript(JSON.parse(JSON.stringify(currentDocument.transcript)));
    }
  }, [currentDocument]);

  const handleTranscribe = async () => {
    if (!documentId) return;
    
    setIsTranscribing(true);
    try {
      await transcribeDocument(documentId, customNerLabels);
      // If the custom labels are different from the default, save them
      if (customNerLabels !== nerLabels) {
        setNerLabels(customNerLabels);
      }
    } catch (error) {
      console.error('Error transcribing document:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleExport = async () => {
    if (!documentId) return;
    
    try {
      const downloadUrl = await exportDocuments([documentId]);
      
      // Open the download URL in a new tab
      window.open(`/api/export?path=${downloadUrl}`, '_blank');
    } catch (error) {
      console.error('Error exporting document:', error);
    }
  };

  const handleSaveTranscript = async () => {
    if (!documentId || !currentDocument) return;
    
    try {
      // Update the document with the edited transcript
      await updateDocument(documentId, {
        transcript: editableTranscript
      });
      
      // Update annotations in the database
      if (currentDocument.annotations) {
        // For each entity with a class, check if it already has an annotation
        for (let i = 0; i < editableTranscript.length; i++) {
          const entity = editableTranscript[i];
          
          if (entity.class_or_confidence) {
            // Find if there's an existing annotation
            const existingAnnotation = currentDocument.annotations.find(a => 
              a.startIndex === i && a.endIndex === i + 1
            );
            
            if (existingAnnotation) {
              // Update existing annotation
              if (existingAnnotation.token !== entity.token || 
                  existingAnnotation.nerClass !== entity.class_or_confidence) {
                await updateAnnotation(existingAnnotation.id, {
                  token: entity.token,
                  nerClass: entity.class_or_confidence
                });
              }
            } else {
              // Create new annotation
              // This is handled on the server when we update the transcript
            }
          }
        }
        
        // Find annotations that should be deleted
        for (const annotation of currentDocument.annotations) {
          const entityIndex = annotation.startIndex;
          
          // If the entity no longer exists or no longer has a class
          if (entityIndex >= editableTranscript.length || 
              !editableTranscript[entityIndex].class_or_confidence) {
            await deleteAnnotation(annotation.id);
          }
        }
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving transcript:', error);
    }
  };

  const handleTokenClick = (index: number, entity: NerEntity) => {
    if (!isEditing) return;
    
    setSelectedToken({ index, entity });
  };

  const handleClassSelect = (className: string) => {
    if (!selectedToken || !isEditing) return;
    
    const updatedTranscript = [...editableTranscript];
    
    if (className) {
      updatedTranscript[selectedToken.index].class_or_confidence = className;
    } else {
      updatedTranscript[selectedToken.index].class_or_confidence = null;
    }
    
    setEditableTranscript(updatedTranscript);
    setSelectedToken(null);
  };

  const handleTokenEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedToken || !isEditing) return;
    
    const updatedTranscript = [...editableTranscript];
    updatedTranscript[selectedToken.index].token = e.target.value;
    
    setEditableTranscript(updatedTranscript);
  };

  const getNerClasses = () => {
    return customNerLabels.split(',').map(label => label.trim());
  };

  const getColorForClass = (className: string | null) => {
    if (!className) return '';
    
    const normalizedClass = className.trim().toLowerCase();
    return NER_COLORS[normalizedClass] || NER_COLORS.default;
  };

  if (!currentDocument) {
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
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">{currentDocument.name}</h1>
            <p className="text-base-content/70">Project ID: {currentDocument.projectId}</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <button
              className="btn btn-outline"
              onClick={() => router.push(`/projects/${currentDocument.projectId}`)}
            >
              <FiArrowLeft className="mr-2" /> Back to Project
            </button>
            <button
              className="btn btn-primary"
              onClick={handleExport}
            >
              <FiDownload className="mr-2" /> Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Document Image */}
          <div className="card bg-base-100 shadow-xl p-4 flex flex-col h-full">
            <h2 className="card-title mb-4">
              <FiClipboard className="mr-2" /> Document Image
            </h2>
            <div className="relative w-full h-[400px] bg-base-300 rounded-lg flex items-center justify-center">
              <Image
                src={currentDocument.imagePath}
                alt={currentDocument.name}
                fill
                className="object-contain rounded-lg"
              />
            </div>
          </div>

          {/* Transcription and NER */}
          <div className="card bg-base-100 shadow-xl p-4 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h2 className="card-title">
                <FiTag className="mr-2" /> Transcription & NER
              </h2>
              <div className="flex flex-wrap gap-2">
                {!currentDocument.transcript ? (
                  <button
                    className="btn btn-primary"
                    onClick={handleTranscribe}
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Transcribing...
                      </>
                    ) : (
                      <>
                        <FiRefreshCw className="mr-2" /> Transcribe
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    {isEditing ? (
                      <button
                        className="btn btn-success"
                        onClick={handleSaveTranscript}
                      >
                        <FiSave className="mr-2" /> Save
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => setIsEditing(true)}
                      >
                        <FiEdit className="mr-2" /> Edit
                      </button>
                    )}
                    <button
                      className="btn btn-outline"
                      onClick={handleTranscribe}
                      disabled={isTranscribing}
                    >
                      {isTranscribing ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <FiRefreshCw />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* NER Labels Input */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">NER Labels (comma-separated)</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={customNerLabels}
                onChange={(e) => setCustomNerLabels(e.target.value)}
                placeholder="person, organization, location, date, event"
              />
              <label className="label">
                <span className="label-text-alt">
                  These labels will be used for transcription and NER annotation.
                </span>
              </label>
            </div>

            {/* Transcription Display/Editor */}
            <div className="flex-1 flex flex-col">
              {!currentDocument.transcript ? (
                <div className="bg-base-200 p-8 text-center rounded-lg h-[300px] flex items-center justify-center">
                  <div className="max-w-md">
                    <h3 className="font-bold text-lg mb-2">No Transcription Yet</h3>
                    <p className="mb-4">
                      Click the "Transcribe" button to extract text and entities from this document.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-base-100 border rounded-lg p-4 h-[300px] overflow-y-auto">
                  <div className="prose max-w-none text-lg leading-relaxed">
                    {/* Inline NER highlights */}
                    <NERText
                      transcript={editableTranscript}
                      isEditing={isEditing}
                      onTokenClick={handleTokenClick}
                      selectedToken={selectedToken}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* NER Annotation Controls (when editing) */}
            {isEditing && currentDocument.transcript && (
              <div className="mt-4 border-t pt-4">
                <h3 className="font-bold text-lg mb-2">Entity Annotation</h3>
                {selectedToken ? (
                  <>
                    <div className="form-control mb-4">
                      <label className="label">
                        <span className="label-text">Edit Token Text</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered"
                        value={selectedToken.entity.token}
                        onChange={handleTokenEdit}
                        rows={3}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Entity Type</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={`btn btn-sm ${!selectedToken.entity.class_or_confidence ? 'btn-active' : ''}`}
                          onClick={() => handleClassSelect('')}
                        >
                          None
                        </button>
                        {getNerClasses().map((nerClass) => (
                          <button
                            key={nerClass}
                            className={`btn btn-sm ${selectedToken.entity.class_or_confidence === nerClass ? 'btn-active' : ''}`}
                            onClick={() => handleClassSelect(nerClass)}
                          >
                            {nerClass}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-base-content/70">
                    Click on any token in the transcription to edit or assign an entity type.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// --- Inline NERText component ---
function NERText({ transcript, isEditing, onTokenClick, selectedToken }: {
  transcript: NerEntity[];
  isEditing: boolean;
  onTokenClick: (index: number, entity: NerEntity) => void;
  selectedToken: { index: number; entity: NerEntity } | null;
}) {
  // Join tokens into a string, but highlight entities inline
  return (
    <span style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
      {transcript.map((entity, idx) => {
        if (entity.class_or_confidence) {
          const color = ENTITY_COLORS[entity.class_or_confidence.trim().toLowerCase()] || ENTITY_COLORS.default;
          return (
            <span
              key={idx}
              className={`inline-block align-baseline px-2 py-1 mx-0.5 rounded-full border text-sm font-semibold cursor-pointer transition-all duration-100 ${color} ${selectedToken?.index === idx ? 'ring-2 ring-primary' : ''} ${isEditing ? 'hover:bg-primary/10' : ''}`}
              title={entity.class_or_confidence}
              onClick={() => isEditing && onTokenClick(idx, entity)}
              style={{ marginBottom: 2 }}
            >
              {entity.token}
              <span className="ml-2 text-xs font-bold uppercase opacity-70">{entity.class_or_confidence}</span>
            </span>
          );
        } else {
          return (
            <span
              key={idx}
              className="inline whitespace-pre-wrap"
              onClick={() => isEditing && onTokenClick(idx, entity)}
              style={{ marginBottom: 2 }}
            >
              {entity.token}
            </span>
          );
        }
      })}
    </span>
  );
} 