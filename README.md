# Credit Assessment Application with Dual Ollama Models

A comprehensive AI-powered credit assessment platform that uses computer vision and advanced reasoning to analyze financial documents for creditworthiness evaluation.

## Features

- **Multi-document Upload**: Drag & drop interface for PDF and image files
- **Dual AI Models**: 
  - **qwen2.5vl:7b** for document extraction and computer vision
  - **deepseek-r1:8b** for advanced credit analysis and reasoning
- **Enhanced PDF Processing**: Robust PDF conversion using pdf2pic with support for:
  - Encrypted/password-protected PDFs
  - Multi-page documents
  - Various PDF formats and qualities
  - Corrupted or damaged PDF recovery
- **Real-time Processing**: Live status updates and progress tracking
- **Credit Scoring**: Comprehensive credit recommendations with detailed reasoning
- **Professional Reports**: Detailed analysis results with actionable insights

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Vite for development and building

### Backend
- Node.js with Express
- Dual Ollama API integration:
  - **qwen2.5vl:7b** - Computer vision model for document extraction
  - **deepseek-r1:8b** - Advanced reasoning model for credit analysis
- **pdf2pic** for robust PDF processing with encrypted PDF support
- Image optimization with Sharp
- File upload handling with Multer

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Ollama** installed and running locally
3. **Required models** downloaded in Ollama:
   - `qwen2.5vl:7b` for document extraction
   - `deepseek-r1:8b` for credit analysis
4. **ImageMagick** (for PDF processing)

### Installing Ollama and Models

```bash
# Install Ollama (macOS/Linux)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the required models
ollama pull qwen2.5vl:7b
ollama pull deepseek-r1:8b

# Verify installation
ollama list
```

### Installing ImageMagick

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install imagemagick
```

**macOS:**
```bash
brew install imagemagick
```

**Windows:**
Download and install from: https://imagemagick.org/script/download.php#windows

## Quick Start

1. **Install dependencies**:
```bash
npm install
```

2. **Start Ollama service** (if not already running):
```bash
ollama serve
```

3. **Start both frontend and backend** (recommended):
```bash
npm run dev
```

This will start:
- Frontend development server on http://localhost:5173
- Backend API server on http://localhost:3001

### Alternative: Start Services Separately

**Start the backend server**:
```bash
npm run dev:backend
```

**Start the frontend development server** (in another terminal):
```bash
npm run dev:frontend
```

## Environment Configuration

Create a `.env` file in the root directory (copy from `.env.example`):

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Ollama Configuration (for reference)
OLLAMA_BASE_URL=http://localhost:11434
VISION_MODEL=qwen2.5vl:7b
REASONING_MODEL=deepseek-r1:8b

# Server Configuration (for reference)
PORT=3001
UPLOAD_MAX_SIZE=10485760
```

## AI Model Architecture

### Document Extraction Pipeline (qwen2.5vl:7b)
- **Computer Vision**: Analyzes document images and extracts structured data
- **Financial Data Recognition**: Identifies amounts, dates, account information
- **Document Classification**: Automatically categorizes document types
- **Risk Factor Detection**: Identifies potential red flags in documents

### Credit Analysis Pipeline (deepseek-r1:8b)
- **Advanced Reasoning**: Synthesizes data from multiple documents
- **Credit Scoring**: Calculates comprehensive credit scores (300-850)
- **Risk Assessment**: Evaluates overall creditworthiness
- **Recommendation Generation**: Provides detailed analysis and suggestions

## API Endpoints

### POST /api/upload
Upload multiple documents (PDF/images) for processing.

### POST /api/process
Process uploaded documents with dual AI model analysis.

### GET /api/health
Check server and both Ollama model availability.

## Document Types Supported

- **Bank Statements**: Account balances, transaction history, income patterns
- **Financial Statements**: Revenue, profit, assets, liabilities
- **Legal Documents**: Contracts, agreements, compliance status
- **General Images**: Automatic document type detection

### PDF Support Features

- **Encrypted PDFs**: Automatic handling of password-protected documents
- **Multi-page Documents**: Processes all pages individually
- **High-quality Conversion**: 200 DPI conversion for optimal OCR
- **Error Recovery**: Fallback mechanisms for corrupted files
- **Format Flexibility**: Supports various PDF versions and formats

## AI Analysis Features

### Document Extraction (qwen2.5vl:7b)
- Extract text and numerical data from document images
- Identify document types and structures
- Calculate financial metrics and ratios
- Detect risk factors and anomalies

### Credit Analysis (deepseek-r1:8b)
- Comprehensive multi-document analysis
- Advanced reasoning for credit decisions
- Detailed scoring methodology
- Professional recommendation generation

## Development Scripts

```bash
# Start both frontend and backend concurrently
npm run dev

# Start only frontend (Vite dev server)
npm run dev:frontend

# Start only backend (Express server)
npm run dev:backend

# Build frontend for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

### Project Structure

```
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API client services
│   └── types/             # TypeScript type definitions
├── server/                # Backend Node.js application
│   ├── services/          # Backend services
│   │   ├── ollamaClient.js    # Dual Ollama API integration
│   │   ├── documentProcessor.js # PDF/image processing with pdf2pic
│   │   └── creditAnalyzer.js   # Credit analysis with deepseek-r1
│   └── index.js           # Express server setup
└── README.md
```

### Model Usage Flow

1. **Document Upload**: Files uploaded via REST API
2. **PDF Conversion**: PDFs converted to images using pdf2pic with encryption support
3. **Vision Analysis**: Each image processed by qwen2.5vl:7b for data extraction
4. **Data Aggregation**: Extracted data combined and structured
5. **Credit Analysis**: deepseek-r1:8b analyzes all data for credit recommendation
6. **Report Generation**: Comprehensive credit report with reasoning

## Troubleshooting

### Common Issues

1. **Ollama Connection Failed**
   - Ensure Ollama is running: `ollama serve`
   - Check if both models are available: `ollama list`
   - Verify the base URL in configuration

2. **Model Not Found**
   - Pull missing models: `ollama pull qwen2.5vl:7b` and `ollama pull deepseek-r1:8b`
   - Check model names match exactly

3. **PDF Processing Errors**
   - Install ImageMagick: Required for pdf2pic
   - Check file permissions in upload directory
   - For encrypted PDFs: Ensure they're not password-protected

4. **Memory Issues**
   - Large documents may require more memory
   - Consider implementing file size limits
   - Monitor server memory usage during processing

5. **Port Conflicts**
   - Frontend runs on port 5173 (Vite default)
   - Backend runs on port 3001
   - Ensure these ports are available

### System Dependencies

**ImageMagick Installation:**

**Ubuntu/Debian:**
```bash
sudo apt-get install imagemagick libmagickwand-dev
```

**macOS:**
```bash
brew install imagemagick
```

**Windows:**
- Download from ImageMagick official website
- Ensure it's added to system PATH

### PDF Processing Issues

1. **Encrypted PDF Errors**
   - Error message will indicate password protection
   - Request unlocked version from user
   - Some PDFs may have restrictions that prevent processing

2. **Conversion Quality Issues**
   - Adjust DPI settings in documentProcessor.js
   - Increase image quality settings
   - Check ImageMagick installation

3. **Memory Issues with Large PDFs**
   - Process pages individually
   - Implement pagination for very large documents
   - Monitor server memory usage

## Performance Considerations

- **qwen2.5vl:7b**: Optimized for fast document extraction
- **deepseek-r1:8b**: More computationally intensive for reasoning
- **pdf2pic**: Efficient PDF processing with memory management
- Processing time scales with document count and complexity
- Consider implementing queue system for high-volume processing

## Production Deployment

1. **Build the frontend**:
```bash
npm run build
```

2. **Configure environment variables** for production
3. **Set up reverse proxy** (nginx/Apache) for the backend
4. **Configure file upload limits** and security measures
5. **Set up monitoring** for both Ollama models
6. **Implement caching** for frequently processed document types
7. **Install ImageMagick** on production server

## Security Considerations

- Implement file type validation and virus scanning
- Add rate limiting for API endpoints
- Secure file storage and cleanup procedures
- Validate and sanitize all user inputs
- Use HTTPS in production environments
- Monitor AI model outputs for sensitive data exposure
- Handle encrypted PDFs securely

## Model Information

### qwen2.5vl:7b
- **Purpose**: Computer vision and document extraction
- **Strengths**: Excellent OCR and structured data extraction
- **Use Case**: Converting document images to structured JSON data

### deepseek-r1:8b
- **Purpose**: Advanced reasoning and credit analysis
- **Strengths**: Complex financial analysis and decision making
- **Use Case**: Generating comprehensive credit recommendations

## License

This project is licensed under the MIT License.