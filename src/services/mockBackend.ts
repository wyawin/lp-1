import { UploadedFile, ExtractedData, CreditRecommendation, AnalysisResults, ProcessingResult } from '../types';

class MockBackendService {
  // Simulate file upload and processing
  async processFiles(files: UploadedFile[]): Promise<AnalysisResults> {
    const results: ProcessingResult[] = [];
    
    for (const file of files) {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await this.processIndividualFile(file);
      results.push(result);
    }

    const creditRecommendation = this.generateCreditRecommendation(results);
    const overallRisk = this.calculateOverallRisk(results);
    
    return {
      files: results,
      creditRecommendation,
      overallRisk,
      confidence: Math.floor(Math.random() * 15) + 85 // 85-99%
    };
  }

  private async processIndividualFile(file: UploadedFile): Promise<ProcessingResult> {
    // Simulate PDF to image conversion
    const imageCount = Math.floor(Math.random() * 8) + 3; // 3-10 images
    const processingTime = Math.floor(Math.random() * 5) + 2; // 2-6 seconds
    
    // Mock extracted data based on file name patterns
    const extractedData = this.generateMockExtractedData(file.name);
    
    return {
      fileId: file.id,
      fileName: file.name,
      extractedData,
      imageCount,
      processingTime
    };
  }

  private generateMockExtractedData(fileName: string): ExtractedData {
    const lowerName = fileName.toLowerCase();
    
    if (lowerName.includes('bank') || lowerName.includes('statement')) {
      return {
        documentType: 'bank_statement',
        keyInformation: {
          accountBalance: Math.floor(Math.random() * 50000) + 10000,
          monthlyIncome: Math.floor(Math.random() * 8000) + 2000,
          monthlyExpenses: Math.floor(Math.random() * 6000) + 1500,
          accountAge: Math.floor(Math.random() * 60) + 12
        },
        riskFactors: this.generateRiskFactors('bank'),
        financialMetrics: {
          assets: Math.floor(Math.random() * 100000) + 50000,
          liabilities: Math.floor(Math.random() * 40000) + 10000
        }
      };
    } else if (lowerName.includes('financial') || lowerName.includes('income')) {
      return {
        documentType: 'financial',
        keyInformation: {
          annualRevenue: Math.floor(Math.random() * 500000) + 100000,
          netProfit: Math.floor(Math.random() * 50000) + 10000,
          employeeCount: Math.floor(Math.random() * 50) + 5,
          businessAge: Math.floor(Math.random() * 10) + 2
        },
        riskFactors: this.generateRiskFactors('financial'),
        financialMetrics: {
          revenue: Math.floor(Math.random() * 500000) + 100000,
          expenses: Math.floor(Math.random() * 300000) + 80000,
          netIncome: Math.floor(Math.random() * 50000) + 10000
        }
      };
    } else if (lowerName.includes('legal') || lowerName.includes('contract')) {
      return {
        documentType: 'legal',
        keyInformation: {
          documentStatus: 'Valid',
          expirationDate: '2025-12-31',
          legalRisk: 'Low',
          complianceScore: Math.floor(Math.random() * 20) + 80
        },
        riskFactors: this.generateRiskFactors('legal')
      };
    } else {
      return {
        documentType: 'unknown',
        keyInformation: {
          documentType: 'Unrecognized',
          confidence: Math.floor(Math.random() * 30) + 60
        },
        riskFactors: ['Document type could not be determined']
      };
    }
  }

  private generateRiskFactors(type: string): string[] {
    const riskFactors = {
      bank: [
        'Irregular income patterns detected',
        'High expense-to-income ratio',
        'Recent overdraft fees',
        'Low average balance maintenance'
      ],
      financial: [
        'Declining revenue trend',
        'High debt-to-equity ratio',
        'Seasonal revenue fluctuations',
        'Limited cash reserves'
      ],
      legal: [
        'Pending legal proceedings',
        'Regulatory compliance issues',
        'Contract renewal pending',
        'Intellectual property disputes'
      ]
    };

    const factors = riskFactors[type as keyof typeof riskFactors] || [];
    const count = Math.floor(Math.random() * 3) + 1;
    return factors.slice(0, count);
  }

  private generateCreditRecommendation(results: ProcessingResult[]): CreditRecommendation {
    // Calculate base score from document analysis
    let baseScore = 650;
    let riskLevel: 'Low' | 'Medium' | 'High' = 'Medium';
    
    // Analyze financial metrics
    const financialData = results
      .filter(r => r.extractedData.financialMetrics)
      .map(r => r.extractedData.financialMetrics!);
    
    if (financialData.length > 0) {
      const avgIncome = financialData.reduce((sum, data) => sum + (data.netIncome || 0), 0) / financialData.length;
      const avgAssets = financialData.reduce((sum, data) => sum + (data.assets || 0), 0) / financialData.length;
      
      if (avgIncome > 30000 && avgAssets > 75000) {
        baseScore += 100;
        riskLevel = 'Low';
      } else if (avgIncome > 15000 && avgAssets > 25000) {
        baseScore += 50;
      } else {
        baseScore -= 50;
        riskLevel = 'High';
      }
    }

    // Adjust for risk factors
    const totalRiskFactors = results.reduce((sum, r) => sum + r.extractedData.riskFactors.length, 0);
    baseScore -= totalRiskFactors * 15;

    // Ensure score is within bounds
    const score = Math.max(300, Math.min(850, baseScore));
    
    const rating = this.getScoreRating(score);
    const maxCreditLimit = this.calculateCreditLimit(score);
    const interestRate = this.calculateInterestRate(score);

    return {
      score,
      rating,
      riskLevel,
      recommendation: this.generateRecommendationText(score, rating, results),
      keyFactors: this.generateKeyFactors(results),
      improvementSuggestions: this.generateImprovementSuggestions(results),
      maxCreditLimit,
      interestRate
    };
  }

  private getScoreRating(score: number): CreditRecommendation['rating'] {
    if (score >= 800) return 'Excellent';
    if (score >= 740) return 'Good';
    if (score >= 670) return 'Fair';
    if (score >= 580) return 'Poor';
    return 'Very Poor';
  }

  private calculateCreditLimit(score: number): number {
    if (score >= 800) return 50000;
    if (score >= 740) return 25000;
    if (score >= 670) return 15000;
    if (score >= 580) return 8000;
    return 3000;
  }

  private calculateInterestRate(score: number): number {
    if (score >= 800) return 6.5;
    if (score >= 740) return 9.2;
    if (score >= 670) return 13.5;
    if (score >= 580) return 18.9;
    return 24.9;
  }

  private generateRecommendationText(score: number, rating: string, results: ProcessingResult[]): string {
    const hasFinancialDocs = results.some(r => r.extractedData.documentType === 'financial');
    const hasBankDocs = results.some(r => r.extractedData.documentType === 'bank_statement');
    const hasLegalDocs = results.some(r => r.extractedData.documentType === 'legal');

    let recommendation = `Based on the analysis of ${results.length} document(s), the applicant shows a ${rating.toLowerCase()} credit profile with a score of ${score}. `;

    if (hasFinancialDocs && hasBankDocs) {
      recommendation += "The comprehensive financial documentation provides strong evidence of financial stability and creditworthiness. ";
    } else if (hasFinancialDocs || hasBankDocs) {
      recommendation += "The financial documentation provides adequate evidence of creditworthiness, though additional documentation could strengthen the application. ";
    }

    if (hasLegalDocs) {
      recommendation += "Legal documentation appears to be in order with no significant compliance issues identified. ";
    }

    if (score >= 740) {
      recommendation += "This applicant is recommended for approval with favorable terms.";
    } else if (score >= 670) {
      recommendation += "This applicant is recommended for approval with standard terms and monitoring.";
    } else {
      recommendation += "This applicant may require additional scrutiny or enhanced terms to mitigate risk.";
    }

    return recommendation;
  }

  private generateKeyFactors(results: ProcessingResult[]): string[] {
    const factors = [
      'Comprehensive financial documentation provided',
      'Stable income patterns demonstrated',
      'Low debt-to-income ratio observed',
      'Strong asset portfolio identified',
      'Good payment history indicated',
      'Adequate cash flow management',
      'Diverse income sources noted',
      'Legal compliance maintained'
    ];

    return factors.slice(0, Math.floor(Math.random() * 3) + 3);
  }

  private generateImprovementSuggestions(results: ProcessingResult[]): string[] {
    const suggestions = [
      'Consider increasing regular savings deposits',
      'Reduce outstanding debt obligations',
      'Maintain consistent income documentation',
      'Improve expense management practices',
      'Establish longer banking relationship history',
      'Diversify income sources for stability',
      'Update legal documentation regularly',
      'Maintain higher cash reserves'
    ];

    const riskFactorCount = results.reduce((sum, r) => sum + r.extractedData.riskFactors.length, 0);
    const suggestionCount = Math.min(riskFactorCount + 1, 4);
    
    return suggestions.slice(0, suggestionCount);
  }

  private calculateOverallRisk(results: ProcessingResult[]): 'Low' | 'Medium' | 'High' {
    const totalRiskFactors = results.reduce((sum, r) => sum + r.extractedData.riskFactors.length, 0);
    const avgRiskFactors = totalRiskFactors / results.length;
    
    if (avgRiskFactors < 1.5) return 'Low';
    if (avgRiskFactors < 2.5) return 'Medium';
    return 'High';
  }
}

export const mockBackend = new MockBackendService();