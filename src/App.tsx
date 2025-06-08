import React from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { ProcessingStatus } from './components/ProcessingStatus';
import { CreditReport } from './components/CreditReport';
import { useFileProcessor } from './hooks/useFileProcessor';

function App() {
  const {
    files,
    isProcessing,
    processorState,
    results,
    addFiles,
    removeFile,
    startProcessing,
    resetProcessor
  } = useFileProcessor();

  const showResults = results && processorState.currentStage === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CreditAnalyzer AI</h1>
                <p className="text-sm text-gray-600">Powered by Ollama & qwen2.5vl:7b</p>
              </div>
            </div>
            
            {(isProcessing || showResults) && (
              <button
                onClick={resetProcessor}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                disabled={isProcessing}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                New Analysis
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isProcessing && !showResults && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                AI-Powered Credit Assessment
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Upload your financial documents and let our advanced AI analyze creditworthiness 
                using computer vision and natural language processing.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200">
              <FileUpload
                files={files}
                onFilesAdd={addFiles}
                onFileRemove={removeFile}
                onUploadStart={startProcessing}
                isProcessing={isProcessing}
              />
            </div>

            {/* Features */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Processing</h3>
                <p className="text-gray-600">
                  Advanced PDF parsing and image extraction for comprehensive analysis
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-green-600 rounded text-white flex items-center justify-center text-sm font-bold">
                    AI
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ollama Integration</h3>
                <p className="text-gray-600">
                  Powered by qwen2.5vl:7b model for accurate financial data extraction
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-purple-600 rounded text-white flex items-center justify-center text-lg">
                    ★
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Credit Scoring</h3>
                <p className="text-gray-600">
                  Comprehensive risk assessment and credit recommendations
                </p>
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="max-w-2xl mx-auto">
            <ProcessingStatus
              currentStage={processorState.currentStage}
              progress={processorState.progress}
              currentFile={processorState.currentFile}
            />
          </div>
        )}

        {showResults && results && (
          <div className="max-w-7xl mx-auto">
            <CreditReport results={results} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">CreditAnalyzer AI</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Advanced AI-powered credit assessment platform utilizing computer vision 
              and natural language processing to evaluate financial documents and provide 
              comprehensive creditworthiness analysis.
            </p>
            <div className="mt-8 pt-8 border-t border-gray-800 text-gray-500 text-sm">
              <p>© 2025 CreditAnalyzer AI. Built with React, TypeScript, and Ollama integration.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;