import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Percent } from 'lucide-react';
import { AnalysisResults } from '../types';

interface CreditReportProps {
  results: AnalysisResults;
}

export const CreditReport: React.FC<CreditReportProps> = ({ results }) => {
  const { creditRecommendation, files, overallRisk, confidence } = results;

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Excellent':
        return 'text-green-600 bg-green-100';
      case 'Good':
        return 'text-blue-600 bg-blue-100';
      case 'Fair':
        return 'text-yellow-600 bg-yellow-100';
      case 'Poor':
        return 'text-orange-600 bg-orange-100';
      case 'Very Poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'text-green-600 bg-green-100';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'High':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreIcon = (score: number) => {
    if (score >= 750) return <TrendingUp className="w-6 h-6 text-green-500" />;
    if (score >= 650) return <CheckCircle className="w-6 h-6 text-blue-500" />;
    return <TrendingDown className="w-6 h-6 text-red-500" />;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Credit Assessment Report</h2>
            <p className="text-blue-100">
              AI-powered analysis of {files.length} financial document{files.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold mb-1">{creditRecommendation.score}</div>
            <div className="text-sm text-blue-100">Credit Score</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Credit Rating</h3>
            {getScoreIcon(creditRecommendation.score)}
          </div>
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getRatingColor(creditRecommendation.rating)}`}>
            {creditRecommendation.rating}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Risk Level</h3>
            <AlertTriangle className={`w-6 h-6 ${overallRisk === 'High' ? 'text-red-500' : overallRisk === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`} />
          </div>
          <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getRiskColor(overallRisk)}`}>
            {overallRisk} Risk
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">AI Confidence</h3>
            <CheckCircle className="w-6 h-6 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{confidence}%</div>
          <div className="text-sm text-gray-500">Analysis Accuracy</div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recommendations */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Credit Recommendation</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Assessment</h4>
              <p className="text-gray-600 leading-relaxed">{creditRecommendation.recommendation}</p>
            </div>

            {creditRecommendation.maxCreditLimit && (
              <div className="flex items-center p-4 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <div className="font-semibold text-green-800">Recommended Credit Limit</div>
                  <div className="text-green-600">${creditRecommendation.maxCreditLimit.toLocaleString()}</div>
                </div>
              </div>
            )}

            {creditRecommendation.interestRate && (
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <Percent className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <div className="font-semibold text-blue-800">Suggested Interest Rate</div>
                  <div className="text-blue-600">{creditRecommendation.interestRate}% APR</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Key Factors */}
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Key Factors</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Positive Factors</h4>
              <ul className="space-y-2">
                {creditRecommendation.keyFactors.slice(0, 3).map((factor, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

            {creditRecommendation.improvementSuggestions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Areas for Improvement</h4>
                <ul className="space-y-2">
                  {creditRecommendation.improvementSuggestions.slice(0, 3).map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Analysis */}
      <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Document Analysis Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800 truncate">{file.fileName}</h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {file.extractedData.documentType.replace('_', ' ')}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                <div>Images processed: {file.imageCount}</div>
                <div>Processing time: {file.processingTime}s</div>
              </div>

              {file.extractedData.riskFactors.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-700 mb-1">Risk Factors:</div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {file.extractedData.riskFactors.slice(0, 2).map((risk, idx) => (
                      <li key={idx} className="flex items-center">
                        <div className="w-1 h-1 bg-red-400 rounded-full mr-2"></div>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};