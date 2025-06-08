export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
}

export interface ExtractedData {
  documentType: 'legal' | 'financial' | 'bank_statement' | 'unknown';
  keyInformation: {
    [key: string]: string | number;
  };
  riskFactors: string[];
  financialMetrics?: {
    revenue?: number;
    expenses?: number;
    netIncome?: number;
    assets?: number;
    liabilities?: number;
  };
  confidence?: number;
  error?: string;
}

export interface CreditRecommendation {
  score: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Very Poor';
  recommendation: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  keyFactors: string[];
  improvementSuggestions: string[];
  maxCreditLimit?: number;
  interestRate?: number;
  reasoning?: string;
  analysisModel?: string;
  generatedAt?: string;
}

export interface ProcessingResult {
  fileId: string;
  fileName: string;
  extractedData: ExtractedData;
  imageCount: number;
  processingTime: number;
  error?: string;
}

export interface AnalysisResults {
  files: ProcessingResult[];
  creditRecommendation: CreditRecommendation;
  overallRisk: 'Low' | 'Medium' | 'High';
  confidence: number;
  documentSummary?: {
    totalDocuments: number;
    documentTypes: string[];
    averageConfidence: number;
    totalProcessingTime: number;
    totalImages: number;
  };
  modelInfo?: {
    extractionModel: string;
    analysisModel: string;
    totalProcessingTime?: number;
    error?: string;
  };
}

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
}