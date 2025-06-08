import React from 'react';
import { Loader2, FileText, Image, Brain, CheckCircle, AlertTriangle } from 'lucide-react';

interface ProcessingStatusProps {
  currentStage: 'uploading' | 'parsing' | 'extracting' | 'analyzing' | 'completed' | 'error';
  progress: number;
  currentFile?: string;
  error?: string;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  currentStage,
  progress,
  currentFile,
  error
}) => {
  const stages = [
    { key: 'uploading', label: 'Uploading Files', icon: FileText, description: 'Sending files to server' },
    { key: 'parsing', label: 'Converting PDFs to Images', icon: Image, description: 'Processing PDF documents' },
    { key: 'extracting', label: 'Extracting Data with AI', icon: Brain, description: 'Using qwen2.5vl:7b for analysis' },
    { key: 'analyzing', label: 'Analyzing Credit Worthiness', icon: Loader2, description: 'Using deepseek-r1:8b for recommendations' },
    { key: 'completed', label: 'Analysis Complete', icon: CheckCircle, description: 'Ready to view results' }
  ];

  const getCurrentStageIndex = () => {
    return stages.findIndex(stage => stage.key === currentStage);
  };

  const currentStageIndex = getCurrentStageIndex();

  // Show error state if there's an error
  if (error) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-lg border border-red-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-red-800 mb-2">Processing Failed</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
            <h4 className="font-semibold text-red-800 mb-2">Troubleshooting Steps:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Check that the backend server is running on port 3001</li>
              <li>• Verify Ollama is running with required models</li>
              <li>• Ensure files are not corrupted or password-protected</li>
              <li>• Check network connection and firewall settings</li>
              <li>• Try refreshing the page and uploading again</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Processing Documents</h3>
        <p className="text-gray-600">
          Analyzing your financial documents using AI-powered insights
        </p>
        {currentFile && (
          <p className="text-sm text-blue-600 mt-2">
            Currently processing: {currentFile}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-center">
          <span className="text-lg font-semibold text-gray-700">{progress}% Complete</span>
        </div>

        {/* Stages */}
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = index === currentStageIndex;
            const isCompleted = index < currentStageIndex;
            const isUpcoming = index > currentStageIndex;

            return (
              <div
                key={stage.key}
                className={`flex items-center p-4 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : isCompleted
                    ? 'bg-green-50 border-2 border-green-200'
                    : 'bg-gray-50 border-2 border-gray-100'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive && stage.key !== 'completed' ? 'animate-spin' : ''
                    }`}
                  />
                </div>
                <div className="ml-4 flex-1">
                  <h4
                    className={`font-semibold ${
                      isActive
                        ? 'text-blue-800'
                        : isCompleted
                        ? 'text-green-800'
                        : 'text-gray-600'
                    }`}
                  >
                    {stage.label}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {isActive && 'Currently processing...'}
                    {isCompleted && 'Completed successfully'}
                    {isUpcoming && stage.description}
                  </p>
                </div>
                {isActive && (
                  <div className="ml-4">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">Processing Information</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Using qwen2.5vl:7b for document extraction and computer vision</p>
            <p>• Using deepseek-r1:8b for advanced credit analysis and reasoning</p>
            <p>• Processing time varies based on document complexity and size</p>
            <p>• All data is processed locally using your Ollama installation</p>
          </div>
        </div>
      </div>
    </div>
  );
};