import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { processDocuments } from './services/documentProcessor.js';
import { analyzeCredit } from './services/creditAnalyzer.js';
import { ollamaClient } from './services/ollamaClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
await fs.ensureDir(uploadsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Routes
app.post('/api/upload', upload.array('documents', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      id: uuidv4(),
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    }));

    console.log(`📁 Uploaded ${uploadedFiles.length} files for processing`);

    res.json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

app.post('/api/process', async (req, res) => {
  try {
    const { files } = req.body;
    
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Invalid files data' });
    }

    console.log(`🔄 Processing ${files.length} documents with dual Ollama models`);
    console.log(`📊 Extraction: qwen2.5vl:7b | Analysis: deepseek-r1:8b`);

    // Process documents with qwen2.5vl:7b for extraction
    const processedResults = await processDocuments(files);
    
    // Generate credit analysis with deepseek-r1:8b for reasoning
    const creditAnalysis = await analyzeCredit(processedResults);

    // Clean up uploaded files
    for (const file of files) {
      try {
        await fs.remove(file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup file:', file.path, cleanupError);
      }
    }

    console.log(`✅ Processing completed successfully`);
    console.log(`📈 Credit Score: ${creditAnalysis.recommendation.score}`);
    console.log(`⚠️  Risk Level: ${creditAnalysis.overallRisk}`);

    res.json({
      success: true,
      results: {
        files: processedResults,
        creditRecommendation: creditAnalysis.recommendation,
        overallRisk: creditAnalysis.overallRisk,
        confidence: creditAnalysis.confidence,
        modelInfo: creditAnalysis.modelInfo,
        documentSummary: creditAnalysis.documentSummary
      }
    });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ 
      error: 'Document processing failed',
      details: error.message 
    });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const ollamaHealth = await ollamaClient.checkHealth();
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      ollama: ollamaHealth,
      models: {
        extraction: 'qwen2.5vl:7b',
        analysis: 'deepseek-r1:8b'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      ollama: { connected: false }
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Credit Assessment Server running on port ${PORT}`);
  console.log(`🤖 Ollama Models:`);
  console.log(`   📄 Document Extraction: qwen2.5vl:7b`);
  console.log(`   🧠 Credit Analysis: deepseek-r1:8b`);
  console.log(`📁 Upload directory: ${uploadsDir}`);
});