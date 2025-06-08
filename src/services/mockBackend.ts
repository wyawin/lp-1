const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export class ApiClient {
  async uploadFiles(files: File[]): Promise<any> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('documents', file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, use response status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await this.safeJsonParse(response);
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async processDocuments(files: any[]): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files })
      });

      if (!response.ok) {
        let errorMessage = 'Processing failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, use response status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await this.safeJsonParse(response);
      return result;
    } catch (error) {
      console.error('Processing error:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      
      if (!response.ok) {
        throw new Error('Health check failed');
      }

      const result = await this.safeJsonParse(response);
      return result;
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  // Safe JSON parsing with enhanced error handling
  private async safeJsonParse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server response is not JSON format');
    }

    try {
      const text = await response.text();
      
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }

      // Try to parse the JSON
      const parsed = JSON.parse(text);
      return parsed;
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Response text:', await response.text().catch(() => 'Could not read response text'));
      
      if (parseError instanceof SyntaxError) {
        throw new Error('Invalid JSON response from server. Please check server logs.');
      } else {
        throw new Error(`Failed to parse server response: ${parseError.message}`);
      }
    }
  }
}

export const apiClient = new ApiClient();