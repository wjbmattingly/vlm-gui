import React from 'react';
import { PDFProcessingProgress } from '../lib/pdf-utils';
import { FiFile, FiImage } from 'react-icons/fi';

interface PDFUploadPreviewProps {
  fileName: string;
  progress: PDFProcessingProgress;
  className?: string;
}

export function PDFUploadPreview({ fileName, progress, className = '' }: PDFUploadPreviewProps) {
  return (
    <div className={`bg-base-100 rounded-lg p-4 border border-base-300 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <FiFile className="text-2xl text-primary" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm truncate">{fileName}</h4>
          <p className="text-xs text-base-content/70">Converting PDF to images...</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {/* Progress bar */}
        <div className="bg-base-300 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-primary h-2 transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
        
        {/* Progress details */}
        <div className="flex items-center justify-between text-xs text-base-content/60">
          <span className="flex items-center gap-1">
            <FiImage className="text-sm" />
            Page {progress.currentPage} of {progress.totalPages}
          </span>
          <span>{Math.round(progress.percentage)}%</span>
        </div>
      </div>
    </div>
  );
}

export default PDFUploadPreview; 