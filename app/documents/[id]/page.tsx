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

function PrettyNERDisplay({ transcript }: { transcript: NerEntity[] }) {
  // Render transcript as pretty NER highlights, preserving line breaks
  return (
    <span className="text-lg leading-relaxed break-words whitespace-pre-wrap">
      {transcript.map((e, i) => {
        if (e.token === '\n') return <br key={i} />;
        if (e.class_or_confidence) {
          const color = ENTITY_COLORS[e.class_or_confidence.trim().toLowerCase()] || ENTITY_COLORS.default;
          return (
            <span
              key={i}
              className={`inline-block align-baseline px-2 py-1 mx-0.5 rounded-full border text-sm font-semibold ${color}`}
              title={e.class_or_confidence}
              style={{ marginBottom: 2 }}
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

function NERLabelsEditor({ labels, setLabels }: { labels: string[]; setLabels: (labels: string[]) => void }) {
  const [input, setInput] = useState('');
  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !labels.includes(trimmed)) {
      setLabels([...labels, trimmed]);
      setInput('');
    }
  };
  const handleDelete = (label: string) => {
    setLabels(labels.filter(l => l !== label));
  };
  return (
    <div className="card bg-base-100 shadow p-4 mb-2 flex flex-col items-center">
      <div className="w-full flex flex-wrap gap-2 justify-center mb-2">
        {labels.map(label => (
          <span key={label} className="badge badge-lg badge-outline flex items-center gap-1 px-3 py-2 text-base font-semibold">
            {label}
            <button
              className="btn btn-xs btn-circle btn-ghost ml-1"
              onClick={() => handleDelete(label)}
              aria-label={`Remove ${label}`}
              type="button"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 w-full justify-center">
        <input
          className="input input-bordered input-sm w-40"
          type="text"
          placeholder="Add label"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
        />
        <button className="btn btn-primary btn-sm" onClick={handleAdd} type="button">Add</button>
      </div>
      <div className="text-xs text-base-content/60 mt-2 text-center">NER labels are used for transcription and annotation. Add or remove as needed.</div>
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
            className="btn btn-outline btn-lg font-semibold px-6"
            onClick={() => router.push(`/projects/${currentDocument.projectId}`)}
          >
            <FiArrowLeft className="mr-2" /> Back to Project
          </button>
          <button
            className="btn btn-primary btn-lg font-semibold px-6"
            onClick={handleExport}
          >
            <FiDownload className="mr-2" /> Export
          </button>
          <button
            className="btn btn-accent btn-lg font-semibold px-6"
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
        </div>

        {/* NER Labels Editor above transcript card */}
        <NERLabelsEditor labels={nerLabelsArray} setLabels={setNerLabelsArray} />

        {/* Main Content Row: Only two cards now */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Document Image */}
          <div className="card bg-base-100 shadow-xl p-4 flex flex-col h-full">
            <h2 className="card-title mb-4 flex items-center gap-2">
              <FiClipboard className="text-xl text-primary shrink-0" />
              Document Image
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

          {/* Transcript Markdown Editor/Viewer */}
          <div className="card bg-base-100 shadow-xl p-4 flex flex-col h-full">
            <h2 className="card-title mb-4 flex items-center gap-2">
              <FiTag className="text-xl text-primary shrink-0" />
              Transcript
            </h2>
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
                <div className="bg-base-100 border rounded-lg p-4 h-[300px] flex flex-col">
                  <textarea
                    className="textarea textarea-bordered w-full h-full text-base font-mono"
                    value={markdownValue}
                    onChange={e => setMarkdownValue(e.target.value)}
                    spellCheck={false}
                    style={{ whiteSpace: 'pre', minHeight: 200 }}
                  />
                  <div className="flex gap-3 mt-4 justify-end">
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
                <PrettyNERDisplay transcript={editableTranscript} />
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 