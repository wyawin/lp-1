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

  // Enhanced JSON extraction with multiple fallback strategies
  extractJSON(text) {
    if (!text || typeof text !== 'string') {
      return null;
    }

    // Strategy 1: Look for complete JSON objects
    const jsonMatches = text.match(/\{[\s\S]*?\}/g);
    if (jsonMatches) {
      for (const match of jsonMatches) {
        try {
          const parsed = JSON.parse(match);
          if (parsed && typeof parsed === 'object') {
            return parsed;
          }
        } catch (e) {
          continue;
        }
      }
    }

    // Strategy 2: Look for JSON between code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch (e) {
        // Continue to next strategy
      }
    }

    // Strategy 3: Extract JSON from markdown-like format
    const lines = text.split('\n');
    let jsonStart = -1;
    let jsonEnd = -1;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('{') && jsonStart === -1) {
        jsonStart = i;
        braceCount = 1;
      } else if (jsonStart !== -1) {
        for (const char of line) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }
        if (braceCount === 0) {
          jsonEnd = i;
          break;
        }
      }
    }

    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonText = lines.slice(jsonStart, jsonEnd + 1).join('\n');
      try {
        return JSON.parse(jsonText);
      } catch (e) {
        // Continue to next strategy
      }
    }

    // Strategy 4: Try to fix common JSON issues
    let cleanedText = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(/^\s*[\w\s]*?(\{)/m, '$1') // Remove text before first {
      .replace(/(\})\s*[\w\s]*?$/m, '$1') // Remove text after last }
      .trim();

    // Fix common JSON formatting issues
    cleanedText = cleanedText
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
      .replace(/:\s*([^",{\[\]}\s][^",{\[\]}]*?)(\s*[,}])/g, ':"$1"$2'); // Quote unquoted string values

    try {
      return JSON.parse(cleanedText);
    } catch (e) {
      console.warn('All JSON extraction strategies failed:', e.message);
      return null;
    }
  }

  async extractFinancialData(imageBase64, documentType = 'unknown') {
    const prompts = {
      bank_statement: `
        Analyze this bank statement image and extract the following financial information. 
        Respond ONLY with valid JSON in this exact format:
        {
          "documentType": "bank_statement",
          "accountBalance": 0,
          "monthlyIncome": 0,
          "monthlyExpenses": 0,
          "accountAge": 0,
          "transactionCount": 0,
          "overdraftFees": 0,
          "averageBalance": 0,
          "riskFactors": [],
          "keyFindings": [],
          "confidence": 85
        }
        
        Extract numerical values where visible. For riskFactors and keyFindings, use short descriptive strings.
        Do not include any text before or after the JSON object.
      `,
      
      financial: `
        Analyze this financial statement and extract key business metrics. 
        Respond ONLY with valid JSON in this exact format:
        {
          "documentType": "financial",
          "annualRevenue": 0,
          "netProfit": 0,
          "totalAssets": 0,
          "totalLiabilities": 0,
          "cashFlow": 0,
          "employeeCount": 0,
          "businessAge": 0,
          "debtToEquityRatio": 0,
          "profitMargin": 0,
          "riskFactors": [],
          "keyFindings": [],
          "confidence": 85
        }
        
        Extract exact figures where visible. Use 0 for missing values.
        Do not include any text before or after the JSON object.
      `,
      
      legal: `
        Analyze this legal document and extract compliance information. 
        Respond ONLY with valid JSON in this exact format:
        {
          "documentType": "legal",
          "documentStatus": "Valid",
          "expirationDate": null,
          "legalRisk": "Low",
          "complianceScore": 85,
          "keyObligations": [],
          "riskFactors": [],
          "keyFindings": [],
          "confidence": 85
        }
        
        Use "Valid", "Invalid", "Pending", or "Expired" for documentStatus.
        Use "Low", "Medium", or "High" for legalRisk.
        Do not include any text before or after the JSON object.
      `,
      
      unknown: `
        Analyze this document image and determine its type. 
        Respond ONLY with valid JSON in this exact format:
        {
          "documentType": "unknown",
          "confidence": 60,
          "extractedData": {
            "amounts": [],
            "dates": [],
            "entities": []
          },
          "riskFactors": [],
          "keyFindings": [],
          "recommendation": ""
        }
        
        For documentType, use: "bank_statement", "financial", "legal", "invoice", "tax", or "other".
        Do not include any text before or after the JSON object.
      `
    };

    const prompt = prompts[documentType] || prompts.unknown;
    
    try {
      const response = await this.generateResponse(prompt, imageBase64, this.visionModel);
      
      // Extract JSON from response
      const extractedJSON = this.extractJSON(response);
      
      if (extractedJSON) {
        return {
          ...extractedJSON,
          documentType: extractedJSON.documentType || documentType,
          extractionModel: this.visionModel,
          rawResponse: response.substring(0, 200) + '...' // Keep first 200 chars for debugging
        };
      }
      
      // Fallback if JSON extraction fails
      console.warn('JSON extraction failed, using fallback structure');
      return {
        documentType: documentType,
        rawResponse: response,
        extractedData: {},
        riskFactors: ['Unable to parse structured data from vision model'],
        keyFindings: ['Document analysis completed but data extraction failed'],
        confidence: 50,
        extractionModel: this.visionModel,
        error: 'JSON parsing failed'
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

      Respond ONLY with valid JSON in this exact format:
      {
        "creditScore": 650,
        "rating": "Fair",
        "riskLevel": "Medium",
        "recommendation": "detailed recommendation text",
        "keyFactors": ["factor1", "factor2", "factor3"],
        "riskFactors": ["risk1", "risk2"],
        "improvementSuggestions": ["suggestion1", "suggestion2"],
        "maxCreditLimit": 15000,
        "interestRate": 12.5,
        "reasoning": "detailed explanation of scoring methodology",
        "confidence": 85,
        "analysisModel": "deepseek-r1:8b"
      }

      REQUIREMENTS:
      - creditScore: number between 300-850
      - rating: "Excellent", "Good", "Fair", "Poor", or "Very Poor"
      - riskLevel: "Low", "Medium", or "High"
      - All arrays should contain 2-5 relevant items
      - All text fields should be professional and detailed
      - Do not include any text before or after the JSON object
    `;

    try {
      const response = await this.generateResponse(prompt, null, this.reasoningModel);
      
      // Extract JSON from response
      const extractedJSON = this.extractJSON(response);
      
      if (extractedJSON) {
        return {
          ...extractedJSON,
          analysisModel: this.reasoningModel,
          generatedAt: new Date().toISOString()
        };
      }
      
      // Fallback response with valid structure
      console.warn('Credit recommendation JSON extraction failed, using fallback');
      return {
        creditScore: 650,
        rating: 'Fair',
        riskLevel: 'Medium',
        recommendation: 'Unable to generate detailed recommendation due to parsing error. Manual review recommended.',
        keyFactors: ['Document analysis completed', 'Multiple documents processed'],
        riskFactors: ['Analysis parsing failed', 'Manual review required'],
        improvementSuggestions: ['Provide additional documentation', 'Clarify financial statements'],
        maxCreditLimit: 10000,
        interestRate: 15.0,
        reasoning: 'Fallback analysis due to model response parsing failure',
        confidence: 60,
        analysisModel: this.reasoningModel,
        rawResponse: response.substring(0, 200) + '...',
        error: 'JSON parsing failed'
      };
    } catch (error) {
      console.error('Credit recommendation generation failed:', error);
      throw error;
    }
  }
}

export const ollamaClient = new OllamaClient();