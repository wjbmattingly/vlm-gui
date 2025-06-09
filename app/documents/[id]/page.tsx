'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '../../lib/store';
import MainLayout from '../../components/MainLayout';
import { 
  FiArrowLeft, FiDownload, FiEdit, FiSave, 
  FiClipboard, FiTag, FiTrash2, FiRefreshCw, FiZoomIn 
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
const DEFAULT_LABEL_COLORS: Record<string, string> = {
  person: '#fecaca', // red-200
  organization: '#bfdbfe', // blue-200
  location: '#bbf7d0', // green-200
  date: '#fef9c3', // yellow-100
  event: '#e9d5ff', // purple-200
  default: '#e5e7eb', // gray-200
};

interface EntityRange {
  start: number;
  end: number;
  className: string;
}

function getTextAndEntities(transcript: NerEntity[]): { text: string; entities: EntityRange[] } {
  let text = '';
  let entities: EntityRange[] = [];
  let pos = 0;
  for (let i = 0; i < transcript.length; i++) {
    const token = transcript[i].token;
    const start = pos;
    text += token;
    const end = pos + token.length;
    if (transcript[i].class_or_confidence) {
      entities.push({ start, end, className: transcript[i].class_or_confidence ?? '' });
    }
    pos = end;
  }
  return { text, entities };
}

interface TextSpan {
  text: string;
  entity: EntityRange | null;
}

function getSpans(text: string, entities: EntityRange[]): TextSpan[] {
  const spans: TextSpan[] = [];
  let last = 0;
  entities.sort((a, b) => a.start - b.start);
  for (const entity of entities) {
    if (entity.start > last) {
      spans.push({ text: text.slice(last, entity.start), entity: null });
    }
    spans.push({ text: text.slice(entity.start, entity.end), entity });
    last = entity.end;
  }
  if (last < text.length) {
    spans.push({ text: text.slice(last), entity: null });
  }
  return spans;
}

// --- Markdown NER helpers ---
function transcriptToMarkdown(transcript: NerEntity[]): string {
  return transcript.map(e =>
    e.class_or_confidence ? `[${e.token}]{${e.class_or_confidence}}` : e.token
  ).join('');
}

function markdownToTranscript(md: string): NerEntity[] {
  // Matches [entity]{class} or plain text, including line breaks
  const regex = /\[([^\]]+)\]\{([^}]+)\}|([^\[]+|\n)/g;
  const result: NerEntity[] = [];
  let match;
  while ((match = regex.exec(md)) !== null) {
    if (match[1] && match[2]) {
      result.push({ token: match[1], class_or_confidence: match[2] });
    } else if (match[3]) {
      result.push({ token: match[3], class_or_confidence: null });
    }
  }
  return result;
}

function PrettyNERDisplay({ transcript, labelColors }: { transcript: NerEntity[], labelColors: Record<string, string> }) {
  // Render transcript as pretty NER highlights, preserving line breaks
  return (
    <span className="text-lg leading-relaxed break-words whitespace-pre-wrap">
      {transcript.map((e, i) => {
        if (e.token === '\n') return <br key={i} />;
        if (e.class_or_confidence) {
          const color = labelColors[e.class_or_confidence.trim().toLowerCase()] || labelColors.default || '#e5e7eb';
          return (
            <span
              key={i}
              className={`inline-block align-baseline px-2 py-1 mx-0.5 rounded-full border text-sm font-semibold`}
              title={e.class_or_confidence}
              style={{ marginBottom: 2, background: color, borderColor: '#d1d5db', color: '#111827' }}
            >
              {e.token}
              <span className="ml-2 text-xs font-bold uppercase opacity-70">{e.class_or_confidence}</span>
            </span>
          );
        } else {
          return <span key={i}>{e.token}</span>;
        }
      })}
    </span>
  );
}

function NERLabelsEditor({ labels, setLabels, labelColors, setLabelColors }: {
  labels: string[];
  setLabels: (labels: string[]) => void;
  labelColors: Record<string, string>;
  setLabelColors: (colors: Record<string, string>) => void;
}) {
  const [input, setInput] = useState('');
  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !labels.includes(trimmed)) {
      setLabels([...labels, trimmed]);
      setLabelColors({ ...labelColors, [trimmed]: DEFAULT_LABEL_COLORS.default });
      setInput('');
    }
  };
  const handleDelete = (label: string) => {
    setLabels(labels.filter(l => l !== label));
    const newColors = { ...labelColors };
    delete newColors[label];
    setLabelColors(newColors);
  };
  const handleColorChange = (label: string, color: string) => {
    setLabelColors({ ...labelColors, [label]: color });
  };
  return (
    <div className="card bg-base-100 shadow p-4 mb-2 flex flex-col items-center">
      <div className="w-full flex flex-wrap gap-3 justify-center mb-2">
        {labels.map(label => (
          <div
            key={label}
            className="relative flex items-center gap-2 px-4 py-2 rounded-full font-semibold border-2 shadow group focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            style={{ background: labelColors[label] || labelColors.default || '#e5e7eb', borderColor: '#d1d5db', color: '#111827' }}
            role="group"
            tabIndex={0}
          >
            {/* Color Picker Wheel */}
            <span className="absolute -top-2 -left-2">
              <input
                type="color"
                value={labelColors[label] || labelColors.default || '#e5e7eb'}
                onChange={e => handleColorChange(label, e.target.value)}
                className="w-5 h-5 rounded-full border-2 border-base-300 cursor-pointer shadow"
                title="Change label color"
                style={{ padding: 0, border: '2px solid #d1d5db' }}
              />
            </span>
            <span className="pl-5 pr-2 text-base font-semibold capitalize">{label}</span>
            <button
              className="btn btn-xs btn-circle btn-ghost ml-1"
              onClick={() => handleDelete(label)}
              aria-label={`Remove ${label}`}
              type="button"
              tabIndex={-1}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 w-full justify-center mt-2">
        <input
          className="input input-bordered input-lg w-56 text-lg font-semibold"
          type="text"
          placeholder="Add new label (e.g. Person)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
        />
        <button className="btn btn-primary btn-lg font-bold px-6 shadow-md" onClick={handleAdd} type="button">Add</button>
      </div>
      <div className="text-xs text-base-content/60 mt-2 text-center">NER labels are used for transcription and annotation. Add, remove, or recolor as needed.</div>
    </div>
  );
}

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
  const [markdownValue, setMarkdownValue] = useState('');
  const [nerLabelsArray, setNerLabelsArray] = useState(customNerLabels.split(',').map(l => l.trim()).filter(Boolean));
  const [labelColors, setLabelColors] = useState<Record<string, string>>(() => {
    const arr = customNerLabels.split(',').map(l => l.trim()).filter(Boolean);
    const obj: Record<string, string> = { default: DEFAULT_LABEL_COLORS.default };
    arr.forEach(l => {
      obj[l] = DEFAULT_LABEL_COLORS[l.toLowerCase()] || DEFAULT_LABEL_COLORS.default;
    });
    return obj;
  });

  // Zoom functionality state
  const [isZoomMode, setIsZoomMode] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

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

  useEffect(() => {
    setMarkdownValue(transcriptToMarkdown(editableTranscript));
  }, [editableTranscript]);

  useEffect(() => {
    setCustomNerLabels(nerLabelsArray.join(', '));
  }, [nerLabelsArray]);

  const handleTranscribe = async () => {
    if (!documentId) return;
    setIsTranscribing(true);
    try {
      await transcribeDocument(documentId, customNerLabels);
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
      window.open(`/api/export?path=${downloadUrl}`, '_blank');
    } catch (error) {
      console.error('Error exporting document:', error);
    }
  };

  const handleSaveTranscript = async () => {
    if (!documentId || !currentDocument) return;
    try {
      const newTranscript = markdownToTranscript(markdownValue);
      await updateDocument(documentId, {
        transcript: newTranscript
      });
      setEditableTranscript(newTranscript);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving transcript:', error);
    }
  };

  // Mouse event handlers for zoom functionality
  const handleMouseEnter = () => {
    if (isZoomMode) {
      setShowMagnifier(true);
    }
  };

  const handleMouseLeave = () => {
    setShowMagnifier(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isZoomMode && imageContainerRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Ensure coordinates are within bounds
      const boundedX = Math.max(0, Math.min(x, rect.width));
      const boundedY = Math.max(0, Math.min(y, rect.height));
      
      setMousePosition({
        x: boundedX,
        y: boundedY
      });
    }
  };

  const handleImageLoad = () => {
    if (imageRef.current && currentDocument) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setImageNaturalSize({
        width: naturalWidth,
        height: naturalHeight
      });
      console.log('Image loaded:', { naturalWidth, naturalHeight });
      console.log('Image path:', currentDocument.imagePath);
      console.log('Image src:', imageRef.current.src);
    }
  };

  const toggleZoomMode = () => {
    setIsZoomMode(!isZoomMode);
    setShowMagnifier(false);
    console.log('Zoom mode toggled:', !isZoomMode);
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
        {/* Centered Top Action Buttons Row */}
        <div className="flex flex-wrap gap-2 items-center mb-2 justify-center">
          <button
            className="btn btn-outline btn-lg font-semibold px-6 shadow-md border-2 border-base-300 hover:scale-105 hover:shadow-xl transition-transform duration-150"
            onClick={() => router.push(`/projects/${currentDocument.projectId}`)}
          >
            <span className="flex items-center gap-2">
              <FiArrowLeft />
              Back to Project
            </span>
          </button>
          <button
            className="btn btn-primary btn-lg font-semibold px-6 shadow-md border-2 border-primary/60 hover:scale-105 hover:shadow-xl hover:brightness-110 transition-transform duration-150"
            onClick={handleExport}
          >
            <span className="flex items-center gap-2">
              <FiDownload />
              Export
            </span>
          </button>
          <button
            className="btn btn-accent btn-lg font-semibold px-6 shadow-md border-2 border-accent/60 hover:scale-105 hover:shadow-xl hover:brightness-110 transition-transform duration-150"
            onClick={handleTranscribe}
            disabled={isTranscribing}
          >
            <span className="flex items-center gap-2">
              {isTranscribing ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <FiRefreshCw />
              )}
              {isTranscribing ? 'Transcribing...' : 'Transcribe'}
            </span>
          </button>
        </div>

        {/* NER Labels Editor above transcript card */}
        <NERLabelsEditor labels={nerLabelsArray} setLabels={setNerLabelsArray} labelColors={labelColors} setLabelColors={setLabelColors} />

        {/* Main Content Row: Only two cards now */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-screen">
          {/* Document Image */}
          <div className="card bg-base-100 shadow-xl p-4 flex flex-col h-fit sticky top-4">
            <h2 className="card-title mb-4 flex items-center gap-2">
              <FiClipboard className="text-xl text-primary shrink-0" />
              Document Image
              {/* Zoom Toggle Button */}
              <button
                className={`btn btn-circle btn-sm ml-auto ${isZoomMode ? 'btn-primary' : 'btn-ghost'}`}
                onClick={toggleZoomMode}
                title={isZoomMode ? 'Disable zoom mode' : 'Enable zoom mode'}
              >
                <FiZoomIn className="text-lg" />
              </button>
            </h2>
            <div 
              ref={imageContainerRef}
              className={`relative w-full h-[400px] bg-base-300 rounded-lg flex items-center justify-center overflow-hidden ${isZoomMode ? 'cursor-crosshair' : 'cursor-default'}`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
            >
              {/* Zoom mode indicator */}
              {isZoomMode && (
                <div className="absolute top-2 left-2 z-20 bg-primary text-primary-content px-2 py-1 rounded text-sm font-semibold">
                  Zoom Mode Active
                </div>
              )}
              
              <img
                ref={imageRef}
                src={currentDocument.imagePath}
                alt={currentDocument.name}
                className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-500 hover:scale-110 cursor-pointer"
                onLoad={handleImageLoad}
                style={{ userSelect: 'none', pointerEvents: isZoomMode ? 'none' : 'auto' }}
              />
              
              {/* Magnifier */}
              {isZoomMode && showMagnifier && imageContainerRef.current && imageNaturalSize.width > 0 && imageNaturalSize.height > 0 && (
                <div
                  className="absolute pointer-events-none border-4 border-primary rounded-full shadow-lg overflow-hidden z-10"
                  style={{
                    width: '200px',
                    height: '200px',
                    left: Math.max(0, Math.min(mousePosition.x - 100, imageContainerRef.current.offsetWidth - 200)),
                    top: Math.max(0, Math.min(mousePosition.y - 100, imageContainerRef.current.offsetHeight - 200)),
                    backgroundColor: '#f3f4f6',
                  }}
                >
                  <img
                    src={currentDocument.imagePath}
                    alt="Magnified view"
                    className="absolute"
                    style={{
                      width: `${imageContainerRef.current.offsetWidth * 3}px`,
                      height: `${imageContainerRef.current.offsetHeight * 3}px`,
                      objectFit: 'contain',
                      left: `${-(mousePosition.x * 3 - 100)}px`,
                      top: `${-(mousePosition.y * 3 - 100)}px`,
                    }}
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-white shadow-inner pointer-events-none"></div>
                </div>
              )}
            </div>
          </div>

          {/* Transcript Markdown Editor/Viewer */}
          <div className="card bg-base-100 shadow-xl p-4 flex flex-col relative">
            <h2 className="card-title mb-4 flex items-center gap-2">
              <FiTag className="text-xl text-primary shrink-0" />
              Transcript
            </h2>
            {/* Edit Transcript Button */}
            {currentDocument.transcript && !isEditing && (
              <button
                className="btn btn-circle btn-sm btn-ghost absolute top-4 right-4 z-10"
                title="Edit Transcript"
                onClick={() => setIsEditing(true)}
              >
                <FiEdit className="text-lg" />
              </button>
            )}
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
              ) : isEditing ? (
                <div className="bg-base-100 border rounded-lg p-4 flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
                  <div className="mb-2 text-sm text-base-content/70 font-medium">
                    Editing transcript - Text will wrap automatically
                  </div>
                  <textarea
                    className="textarea textarea-bordered w-full flex-1 text-base font-mono resize-none"
                    value={markdownValue}
                    onChange={e => setMarkdownValue(e.target.value)}
                    spellCheck={false}
                    style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', minHeight: '500px' }}
                    placeholder="Edit your transcript here..."
                  />
                  <div className="flex gap-3 mt-4 justify-end flex-shrink-0">
                    <button
                      className="btn btn-success btn-md px-6 font-semibold"
                      onClick={handleSaveTranscript}
                    >
                      <FiSave className="mr-2" /> Save
                    </button>
                    <button
                      className="btn btn-ghost btn-md px-6 font-semibold"
                      onClick={() => { setIsEditing(false); setMarkdownValue(transcriptToMarkdown(editableTranscript)); }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-base-100 border rounded-lg p-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
                  <PrettyNERDisplay transcript={editableTranscript} labelColors={labelColors} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 