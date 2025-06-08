import pdf from 'pdf-poppler';
import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { ollamaClient } from './ollamaClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function processDocuments(files) {
  const results = [];
  
  for (const file of files) {
    try {
      console.log(`Processing file: ${file.originalName}`);
      const result = await processIndividualDocument(file);
      results.push(result);
    } catch (error) {
      console.error(`Failed to process ${file.originalName}:`, error);
      results.push({
        fileId: file.id,
        fileName: file.originalName,
        error: error.message,
        extractedData: {
          documentType: 'error',
          keyInformation: {},
          riskFactors: ['Document processing failed'],
          confidence: 0
        },
        imageCount: 0,
        processingTime: 0
      });
    }
  }
  
  return results;
}

async function processIndividualDocument(file) {
  const startTime = Date.now();
  const tempDir = path.join(__dirname, '../temp', file.id);
  
  try {
    // Ensure temp directory exists
    await fs.ensureDir(tempDir);
    
    let images = [];
    
    if (file.mimetype === 'application/pdf') {
      // Convert PDF to images
      images = await convertPdfToImages(file.path, tempDir);
    } else if (file.mimetype.startsWith('image/')) {
      // Process single image
      const processedImage = await processImage(file.path, tempDir);
      images = [processedImage];
    }
    
    // Determine document type from filename
    const documentType = determineDocumentType(file.originalName);
    
    // Process each image with Ollama
    const extractedDataArray = [];
    for (let i = 0; i < images.length; i++) {
      const imagePath = images[i];
      console.log(`Processing image ${i + 1}/${images.length} for ${file.originalName}`);
      
      const imageBase64 = await convertImageToBase64(imagePath);
      const extractedData = await ollamaClient.extractFinancialData(imageBase64, documentType);
      extractedDataArray.push(extractedData);
    }
    
    // Combine extracted data from all images
    const combinedData = combineExtractedData(extractedDataArray, documentType);
    
    const processingTime = Math.round((Date.now() - startTime) / 1000);
    
    return {
      fileId: file.id,
      fileName: file.originalName,
      extractedData: combinedData,
      imageCount: images.length,
      processingTime
    };
    
  } finally {
    // Cleanup temp directory
    try {
      await fs.remove(tempDir);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp directory:', cleanupError);
    }
  }
}

async function convertPdfToImages(pdfPath, outputDir) {
  try {
    const options = {
      format: 'jpeg',
      out_dir: outputDir,
      out_prefix: 'page',
      page: null // Convert all pages
    };
    
    await pdf.convert(pdfPath, options);
    
    // Get list of generated images
    const files = await fs.readdir(outputDir);
    const imageFiles = files
      .filter(file => file.startsWith('page') && file.endsWith('.jpg'))
      .sort()
      .map(file => path.join(outputDir, file));
    
    return imageFiles;
  } catch (error) {
    console.error('PDF conversion failed:', error);
    throw new Error(`Failed to convert PDF to images: ${error.message}`);
  }
}

async function processImage(imagePath, outputDir) {
  try {
    const outputPath = path.join(outputDir, 'processed-image.jpg');
    
    // Optimize image for Ollama processing
    await sharp(imagePath)
      .resize(1024, 1024, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('Image processing failed:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

async function convertImageToBase64(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('Base64 conversion failed:', error);
    throw new Error(`Failed to convert image to base64: ${error.message}`);
  }
}

function determineDocumentType(filename) {
  const lowerName = filename.toLowerCase();
  
  if (lowerName.includes('bank') || lowerName.includes('statement')) {
    return 'bank_statement';
  } else if (lowerName.includes('financial') || lowerName.includes('income') || lowerName.includes('revenue')) {
    return 'financial';
  } else if (lowerName.includes('legal') || lowerName.includes('contract') || lowerName.includes('agreement')) {
    return 'legal';
  }
  
  return 'unknown';
}

function combineExtractedData(dataArray, documentType) {
  if (dataArray.length === 0) {
    return {
      documentType,
      keyInformation: {},
      riskFactors: ['No data extracted'],
      confidence: 0
    };
  }
  
  if (dataArray.length === 1) {
    return {
      documentType: dataArray[0].documentType || documentType,
      keyInformation: dataArray[0],
      riskFactors: dataArray[0].riskFactors || [],
      financialMetrics: extractFinancialMetrics(dataArray[0])
    };
  }
  
  // Combine data from multiple pages/images
  const combined = {
    documentType,
    keyInformation: {},
    riskFactors: [],
    financialMetrics: {}
  };
  
  // Merge all risk factors
  dataArray.forEach(data => {
    if (data.riskFactors) {
      combined.riskFactors.push(...data.riskFactors);
    }
  });
  
  // Remove duplicates
  combined.riskFactors = [...new Set(combined.riskFactors)];
  
  // Combine financial metrics (take averages or sums as appropriate)
  const metrics = dataArray.map(data => extractFinancialMetrics(data)).filter(Boolean);
  if (metrics.length > 0) {
    combined.financialMetrics = combineFinancialMetrics(metrics);
  }
  
  // Combine key information
  dataArray.forEach(data => {
    Object.assign(combined.keyInformation, data);
  });
  
  return combined;
}

function extractFinancialMetrics(data) {
  const metrics = {};
  
  // Extract common financial fields
  const financialFields = [
    'accountBalance', 'monthlyIncome', 'monthlyExpenses', 'annualRevenue',
    'netProfit', 'totalAssets', 'totalLiabilities', 'cashFlow'
  ];
  
  financialFields.forEach(field => {
    if (data[field] && typeof data[field] === 'number') {
      metrics[field] = data[field];
    }
  });
  
  return Object.keys(metrics).length > 0 ? metrics : null;
}

function combineFinancialMetrics(metricsArray) {
  const combined = {};
  const fields = ['accountBalance', 'monthlyIncome', 'monthlyExpenses', 'annualRevenue', 'netProfit'];
  
  fields.forEach(field => {
    const values = metricsArray.map(m => m[field]).filter(v => v !== undefined);
    if (values.length > 0) {
      // Take the average for most fields
      combined[field] = values.reduce((sum, val) => sum + val, 0) / values.length;
    }
  });
  
  return combined;
}