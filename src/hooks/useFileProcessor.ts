import { useState, useCallback } from 'react';
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
      id: crypto.randomUUID(),
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

      // Upload files to backend
      const uploadResponse = await apiClient.uploadFiles(files.map(f => f.file));
      
      setProcessorState({ currentStage: 'parsing', progress: 30 });

      // Update files with server response
      const serverFiles = uploadResponse.files;
      
      // Stage 2: Processing with backend
      setProcessorState({ currentStage: 'extracting', progress: 60 });
      
      // Process documents with Ollama
      const processResponse = await apiClient.processDocuments(serverFiles);
      
      setProcessorState({ currentStage: 'analyzing', progress: 85 });
      
      // Complete processing
      setFiles(prev => prev.map(file => ({ 
        ...file, 
        status: 'completed' as const, 
        progress: 100 
      })));

      setResults(processResponse.results);
      setProcessorState({ currentStage: 'completed', progress: 100 });

    } catch (error) {
      console.error('Processing failed:', error);
      setFiles(prev => prev.map(file => ({ 
        ...file, 
        status: 'error' as const 
      })));
      
      // Show error to user
      alert(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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