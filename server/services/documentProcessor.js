import { fromPath } from 'pdf2pic';
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
      // Convert PDF to images using pdf2pic
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
    console.log(`Converting PDF to images: ${pdfPath}`);
    
    // Configure pdf2pic with enhanced options for encrypted PDFs
    const convert = fromPath(pdfPath, {
      density: 200,           // Higher DPI for better quality
      saveFilename: "page",   // Filename prefix
      savePath: outputDir,    // Output directory
      format: "jpeg",         // Output format
      width: 1024,           // Max width
      height: 1024,          // Max height
      quality: 85,           // JPEG quality
      preserveAspectRatio: true,
      // Additional options for handling encrypted PDFs
      graphicsMagick: false,  // Use ImageMagick instead of GraphicsMagick
      buffer: false          // Save to files instead of buffer
    });

    // Get PDF info to determine page count
    let pageCount = 1;
    try {
      // Try to get page count, fallback to processing all pages
      const info = await convert.getInfo();
      pageCount = info.pages || 1;
    } catch (infoError) {
      console.warn('Could not get PDF info, processing all pages:', infoError.message);
    }

    console.log(`PDF has ${pageCount} page(s)`);

    // Convert all pages
    const results = [];
    
    if (pageCount === 1) {
      // Single page conversion
      try {
        const result = await convert(1, { responseType: "image" });
        if (result && result.path) {
          results.push(result.path);
        }
      } catch (pageError) {
        console.warn('Failed to convert page 1:', pageError.message);
        throw new Error(`Failed to convert PDF page 1: ${pageError.message}`);
      }
    } else {
      // Multi-page conversion
      for (let page = 1; page <= pageCount; page++) {
        try {
          const result = await convert(page, { responseType: "image" });
          if (result && result.path) {
            results.push(result.path);
          }
        } catch (pageError) {
          console.warn(`Failed to convert page ${page}:`, pageError.message);
          // Continue with other pages even if one fails
        }
      }
    }

    if (results.length === 0) {
      // Fallback: try to convert without specifying pages
      try {
        console.log('Attempting fallback conversion...');
        const fallbackResult = await convert.bulk(-1, { responseType: "image" });
        if (Array.isArray(fallbackResult)) {
          results.push(...fallbackResult.map(r => r.path).filter(Boolean));
        } else if (fallbackResult && fallbackResult.path) {
          results.push(fallbackResult.path);
        }
      } catch (fallbackError) {
        throw new Error(`PDF conversion failed completely: ${fallbackError.message}`);
      }
    }

    // Verify files exist and are readable
    const validImages = [];
    for (const imagePath of results) {
      try {
        await fs.access(imagePath);
        const stats = await fs.stat(imagePath);
        if (stats.size > 0) {
          validImages.push(imagePath);
        }
      } catch (accessError) {
        console.warn(`Generated image not accessible: ${imagePath}`);
      }
    }

    if (validImages.length === 0) {
      throw new Error('No valid images were generated from PDF');
    }

    console.log(`Successfully converted PDF to ${validImages.length} image(s)`);
    return validImages;
    
  } catch (error) {
    console.error('PDF conversion failed:', error);
    
    // Enhanced error handling for different PDF issues
    if (error.message.includes('encrypted') || error.message.includes('password')) {
      throw new Error('PDF is password protected or encrypted. Please provide an unlocked version.');
    } else if (error.message.includes('corrupt') || error.message.includes('damaged')) {
      throw new Error('PDF file appears to be corrupted or damaged.');
    } else if (error.message.includes('permission')) {
      throw new Error('Insufficient permissions to process this PDF file.');
    } else {
      throw new Error(`Failed to convert PDF to images: ${error.message}`);
    }
  }
}

async function processImage(imagePath, outputDir) {
  try {
    const outputPath = path.join(outputDir, 'processed-image.jpg');
    
    // Optimize image for Ollama processing with enhanced settings
    await sharp(imagePath)
      .resize(1024, 1024, { 
        fit: 'inside',
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White background for transparency
      })
      .jpeg({ 
        quality: 90,
        progressive: true,
        mozjpeg: true // Better compression
      })
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