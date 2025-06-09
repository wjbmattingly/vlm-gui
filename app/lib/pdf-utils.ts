import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker - use dynamic import for better Next.js compatibility
if (typeof window !== 'undefined') {
  // Try multiple CDN sources for better reliability
  const workerSources = [
    `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`,
    `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`,
    `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
  ];
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSources[0];
}

export interface PDFPageImage {
  pageNumber: number;
  fileName: string;
  blob: Blob;
  dataUrl: string;
}

export interface PDFProcessingProgress {
  currentPage: number;
  totalPages: number;
  percentage: number;
}

/**
 * Convert a PDF file to individual page images
 */
export async function convertPDFToImages(
  file: File,
  options: {
    scale?: number;
    format?: 'png' | 'jpeg';
    quality?: number;
    onProgress?: (progress: PDFProcessingProgress) => void;
  } = {}
): Promise<PDFPageImage[]> {
  const {
    scale = 2.0, // Higher scale = better quality
    format = 'png',
    quality = 0.95,
    onProgress
  } = options;

  try {
    // Load the PDF
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pageImages: PDFPageImage[] = [];
    
    // Process each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Get page dimensions
      const viewport = page.getViewport({ scale });
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      await page.render(renderContext).promise;
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          format === 'png' ? 'image/png' : 'image/jpeg',
          quality
        );
      });
      
      // Create data URL for preview
      const dataUrl = canvas.toDataURL(
        format === 'png' ? 'image/png' : 'image/jpeg',
        quality
      );
      
      // Generate filename
      const baseName = file.name.replace(/\.pdf$/i, '');
      const fileName = `${baseName}_page_${pageNum.toString().padStart(3, '0')}.${format}`;
      
      pageImages.push({
        pageNumber: pageNum,
        fileName,
        blob,
        dataUrl
      });
      
      // Report progress
      if (onProgress) {
        onProgress({
          currentPage: pageNum,
          totalPages,
          percentage: (pageNum / totalPages) * 100
        });
      }
    }
    
    // Clean up
    pdf.destroy();
    
    return pageImages;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert a blob to a File object
 */
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type });
}

/**
 * Validate if a file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Get estimated memory usage for PDF processing
 */
export function estimateMemoryUsage(
  pageCount: number,
  scale: number = 2.0,
  estimatedPageSize: { width: number; height: number } = { width: 612, height: 792 }
): number {
  // Estimate memory usage in MB
  const pixelsPerPage = estimatedPageSize.width * estimatedPageSize.height * scale * scale;
  const bytesPerPixel = 4; // RGBA
  const bytesPerPage = pixelsPerPage * bytesPerPixel;
  const totalBytes = bytesPerPage * pageCount;
  return totalBytes / (1024 * 1024); // Convert to MB
} 