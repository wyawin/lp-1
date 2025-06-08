import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UploadedFile, AnalysisResults } from '../types';
import { apiClient } from '../services/apiClient';

interface ProcessorState {
  currentStage: 'uploading' | 'parsing' | 'extracting' | 'analyzing' | 'completed';
  progress: number;
  currentFile?: string;
}

export const useFileProcessor = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processorState, setProcessorState] = useState<ProcessorState>({
    currentStage: 'uploading',
    progress: 0
  });
  const [results, setResults] = useState<AnalysisResults | null>(null);

  const addFiles = useCallback((newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map(file => ({
      id: uuidv4(),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...uploadedFiles]);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  const startProcessing = useCallback(async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setResults(null);

    try {
      // Stage 1: Uploading
      setProcessorState({ currentStage: 'uploading', progress: 10 });
      setFiles(prev => prev.map(file => ({ ...file, status: 'processing' as const })));

      console.log('Starting file upload...');
      
      // Upload files to backend with enhanced error handling
      let uploadResponse;
      try {
        uploadResponse = await apiClient.uploadFiles(files.map(f => f.file));
        console.log('Upload successful:', uploadResponse);
      } catch (uploadError) {
        console.error('Upload failed:', uploadError);
        throw new Error(`File upload failed: ${uploadError.message}`);
      }
      
      setProcessorState({ currentStage: 'parsing', progress: 30 });

      // Validate upload response
      if (!uploadResponse || !uploadResponse.files || !Array.isArray(uploadResponse.files)) {
        throw new Error('Invalid upload response format');
      }

      const serverFiles = uploadResponse.files;
      console.log('Server files:', serverFiles);
      
      // Stage 2: Processing with backend
      setProcessorState({ currentStage: 'extracting', progress: 60 });
      
      console.log('Starting document processing...');
      
      // Process documents with Ollama with enhanced error handling
      let processResponse;
      try {
        processResponse = await apiClient.processDocuments(serverFiles);
        console.log('Processing successful:', processResponse);
      } catch (processError) {
        console.error('Processing failed:', processError);
        throw new Error(`Document processing failed: ${processError.message}`);
      }
      
      setProcessorState({ currentStage: 'analyzing', progress: 85 });
      
      // Validate processing response
      if (!processResponse || !processResponse.results) {
        throw new Error('Invalid processing response format');
      }

      // Validate results structure
      const results = processResponse.results;
      if (!results.creditRecommendation || !results.files) {
        throw new Error('Incomplete analysis results received');
      }

      // Complete processing
      setFiles(prev => prev.map(file => ({ 
        ...file, 
        status: 'completed' as const, 
        progress: 100 
      })));

      setResults(results);
      setProcessorState({ currentStage: 'completed', progress: 100 });

      console.log('Processing completed successfully');

    } catch (error) {
      console.error('Processing failed:', error);
      
      // Update file status to error
      setFiles(prev => prev.map(file => ({ 
        ...file, 
        status: 'error' as const 
      })));
      
      // Reset processing state
      setProcessorState({ currentStage: 'uploading', progress: 0 });
      
      // Show user-friendly error message
      let errorMessage = 'Processing failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Show error to user with more context
      alert(`❌ ${errorMessage}\n\nPlease check:\n• Server is running\n• Ollama models are available\n• Files are not corrupted\n• Network connection is stable`);
    } finally {
      setIsProcessing(false);
    }
  }, [files]);

  const resetProcessor = useCallback(() => {
    setFiles([]);
    setIsProcessing(false);
    setProcessorState({ currentStage: 'uploading', progress: 0 });
    setResults(null);
  }, []);

  return {
    files,
    isProcessing,
    processorState,
    results,
    addFiles,
    removeFile,
    startProcessing,
    resetProcessor
  };
};