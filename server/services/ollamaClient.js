import axios from 'axios';

class OllamaClient {
  constructor(baseURL = 'http://localhost:11434') {
    this.baseURL = baseURL;
    this.visionModel = 'qwen2.5vl:7b';  // For document extraction
    this.reasoningModel = 'deepseek-r1:8b';  // For credit recommendations
  }

  async generateResponse(prompt, imageBase64 = null, model = null) {
    try {
      const selectedModel = model || (imageBase64 ? this.visionModel : this.reasoningModel);
      
      const payload = {
        model: selectedModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: imageBase64 ? 0.1 : 0.3, // Lower temp for extraction, higher for reasoning
          top_p: 0.9,
          top_k: 40
        }
      };

      // Add image if provided (only for vision model)
      if (imageBase64 && selectedModel === this.visionModel) {
        payload.images = [imageBase64];
      }

      console.log(`Using model: ${selectedModel} for ${imageBase64 ? 'document extraction' : 'credit analysis'}`);

      const response = await axios.post(`${this.baseURL}/api/generate`, payload, {
        timeout: 180000, // 3 minutes timeout for reasoning model
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data.response;
    } catch (error) {
      console.error('Ollama API error:', error.message);
      throw new Error(`Ollama API request failed: ${error.message}`);
    }
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: 5000
      });
      
      const models = response.data.models || [];
      const hasVisionModel = models.some(model => model.name.includes('qwen2.5vl'));
      const hasReasoningModel = models.some(model => model.name.includes('deepseek-r1'));
      
      return {
        connected: true,
        visionModelAvailable: hasVisionModel,
        reasoningModelAvailable: hasReasoningModel,
        models: models.map(m => m.name),
        status: {
          vision: hasVisionModel ? 'available' : 'missing',
          reasoning: hasReasoningModel ? 'available' : 'missing'
        }
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  async extractFinancialData(imageBase64, documentType = 'unknown') {
    const prompts = {
      bank_statement: `
        Analyze this bank statement image and extract the following financial information in JSON format:
        {
          "accountBalance": number,
          "monthlyIncome": number,
          "monthlyExpenses": number,
          "accountAge": number (in months),
          "transactionCount": number,
          "overdraftFees": number,
          "averageBalance": number,
          "riskFactors": ["list of identified risk factors"],
          "keyFindings": ["important observations"],
          "confidence": number (0-100)
        }
        
        Focus on identifying:
        - Current account balance and available funds
        - Regular income deposits and their frequency
        - Monthly expense patterns and spending habits
        - Any overdraft fees or negative balances
        - Account age and transaction history depth
        - Unusual spending patterns or red flags
        - Payment consistency and reliability indicators
        
        Be precise with numerical values and provide confidence scores.
      `,
      
      financial: `
        Analyze this financial statement and extract key business metrics in JSON format:
        {
          "annualRevenue": number,
          "netProfit": number,
          "totalAssets": number,
          "totalLiabilities": number,
          "cashFlow": number,
          "employeeCount": number,
          "businessAge": number (in years),
          "debtToEquityRatio": number,
          "profitMargin": number,
          "riskFactors": ["list of identified risk factors"],
          "keyFindings": ["important observations"],
          "confidence": number (0-100)
        }
        
        Look for:
        - Revenue and profit figures across periods
        - Asset and liability information
        - Cash flow statements and liquidity
        - Debt obligations and payment schedules
        - Business performance indicators and trends
        - Financial stability markers and ratios
        - Growth patterns and seasonal variations
        
        Extract exact figures where visible and calculate ratios.
      `,
      
      legal: `
        Analyze this legal document and extract compliance and risk information in JSON format:
        {
          "documentType": "string",
          "documentStatus": "Valid/Invalid/Pending/Expired",
          "expirationDate": "YYYY-MM-DD or null",
          "legalRisk": "Low/Medium/High",
          "complianceScore": number (0-100),
          "keyObligations": ["list of key legal obligations"],
          "riskFactors": ["list of identified legal risks"],
          "keyFindings": ["important legal observations"],
          "confidence": number (0-100)
        }
        
        Focus on:
        - Document validity and current status
        - Legal obligations and requirements
        - Compliance issues and violations
        - Expiration dates and renewal requirements
        - Legal risks and potential liabilities
        - Regulatory compliance status
        - Contract terms and conditions
      `,
      
      unknown: `
        Analyze this document image and determine its type and extract any relevant financial information in JSON format:
        {
          "documentType": "string (bank_statement/financial/legal/invoice/tax/other)",
          "confidence": number (0-100),
          "extractedData": {
            "amounts": ["list of monetary amounts found"],
            "dates": ["list of dates found"],
            "entities": ["list of company/person names"]
          },
          "riskFactors": ["list of any identified risks"],
          "keyFindings": ["important observations"],
          "recommendation": "string (what type of document this appears to be and next steps)"
        }
        
        Try to identify:
        - What type of document this is based on layout and content
        - Any financial figures, amounts, or monetary data
        - Important dates and deadlines
        - Company names, account numbers, or identifiers
        - Potential risks or concerns
        - Document quality and completeness
      `
    };

    const prompt = prompts[documentType] || prompts.unknown;
    
    try {
      const response = await this.generateResponse(prompt, imageBase64, this.visionModel);
      
      // Try to parse JSON response
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            ...parsed,
            documentType: parsed.documentType || documentType,
            extractionModel: this.visionModel
          };
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON response, using fallback');
      }
      
      // Fallback if JSON parsing fails
      return {
        documentType: documentType,
        rawResponse: response,
        extractedData: {},
        riskFactors: ['Unable to parse structured data from vision model'],
        keyFindings: ['Document analysis completed but data extraction failed'],
        confidence: 50,
        extractionModel: this.visionModel
      };
    } catch (error) {
      console.error('Financial data extraction failed:', error);
      throw error;
    }
  }

  async generateCreditRecommendation(extractedDataArray, documentSummary) {
    const prompt = `
      As an expert credit analyst, analyze the following extracted financial data and provide a comprehensive credit recommendation.

      EXTRACTED DATA FROM DOCUMENTS:
      ${JSON.stringify(extractedDataArray, null, 2)}

      DOCUMENT SUMMARY:
      - Total documents analyzed: ${documentSummary.totalDocuments}
      - Document types: ${documentSummary.documentTypes.join(', ')}
      - Average confidence: ${documentSummary.averageConfidence}%

      Please provide a detailed credit analysis in the following JSON format:
      {
        "creditScore": number (300-850),
        "rating": "Excellent/Good/Fair/Poor/Very Poor",
        "riskLevel": "Low/Medium/High",
        "recommendation": "detailed recommendation text",
        "keyFactors": ["list of positive factors supporting the decision"],
        "riskFactors": ["list of risk factors and concerns"],
        "improvementSuggestions": ["specific suggestions for improvement"],
        "maxCreditLimit": number,
        "interestRate": number,
        "reasoning": "detailed explanation of the scoring methodology",
        "confidence": number (0-100),
        "analysisModel": "deepseek-r1:8b"
      }

      ANALYSIS REQUIREMENTS:
      1. Calculate a credit score based on:
         - Income stability and amount
         - Asset-to-liability ratios
         - Cash flow patterns
         - Risk factors identified
         - Document completeness and quality

      2. Provide specific reasoning for the score including:
         - How each document contributed to the assessment
         - Weight given to different factors
         - Comparison to industry standards

      3. Make practical recommendations for:
         - Appropriate credit limits based on income/assets
         - Interest rates reflecting the risk level
         - Specific improvement areas

      4. Consider the following risk factors heavily:
         - Irregular income patterns
         - High debt-to-income ratios
         - Recent financial difficulties
         - Incomplete documentation
         - Legal or compliance issues

      Provide a thorough, professional analysis that a loan officer could use to make informed decisions.
    `;

    try {
      const response = await this.generateResponse(prompt, null, this.reasoningModel);
      
      // Try to parse JSON response
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            ...parsed,
            analysisModel: this.reasoningModel,
            generatedAt: new Date().toISOString()
          };
        }
      } catch (parseError) {
        console.warn('Failed to parse credit recommendation JSON, using fallback');
      }
      
      // Fallback response
      return {
        creditScore: 650,
        rating: 'Fair',
        riskLevel: 'Medium',
        recommendation: 'Unable to generate detailed recommendation due to parsing error. Manual review recommended.',
        keyFactors: ['Document analysis completed'],
        riskFactors: ['Analysis parsing failed'],
        improvementSuggestions: ['Provide additional documentation'],
        maxCreditLimit: 10000,
        interestRate: 15.0,
        reasoning: 'Fallback analysis due to model response parsing failure',
        confidence: 60,
        analysisModel: this.reasoningModel,
        rawResponse: response
      };
    } catch (error) {
      console.error('Credit recommendation generation failed:', error);
      throw error;
    }
  }
}

export const ollamaClient = new OllamaClient();