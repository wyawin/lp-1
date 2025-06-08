import React from 'react';
import { Loader2, FileText, Image, Brain, CheckCircle } from 'lucide-react';

interface ProcessingStatusProps {
  currentStage: 'uploading' | 'parsing' | 'extracting' | 'analyzing' | 'completed';
  progress: number;
  currentFile?: string;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  currentStage,
  progress,
  currentFile
}) => {
  const stages = [
    { key: 'uploading', label: 'Uploading Files', icon: FileText },
    { key: 'parsing', label: 'Converting PDFs to Images', icon: Image },
    { key: 'extracting', label: 'Extracting Data with Ollama', icon: Brain },
    { key: 'analyzing', label: 'Analyzing Credit Worthiness', icon: Loader2 },
    { key: 'completed', label: 'Analysis Complete', icon: CheckCircle }
  ];

  const getCurrentStageIndex = () => {
    return stages.findIndex(stage => stage.key === currentStage);
  };

  const currentStageIndex = getCurrentStageIndex();

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
                <div className="ml-4">
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
                    {isUpcoming && 'Waiting...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};