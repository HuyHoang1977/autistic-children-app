interface CreateArticleData {
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  tags?: string;
  status?: 'draft' | 'published';
  featured?: boolean;
  featured_image?: string;
}

interface UploadImageResponse {
  success: boolean;
  file_url?: string;
  error?: string;
}

export const simpleArticleApi = {
  // ✅ Upload image first
  async uploadImage(file: File): Promise<UploadImageResponse> {
    try {
      console.log('🔄 Uploading image:', file.name);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket_type', 'articles');
      formData.append('folder', 'featured');

      // Get token
      const token = localStorage.getItem('auth_token') ||
                   localStorage.getItem('access_token') ||
                   localStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:8000/api/images/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData
        },
        body: formData
      });

      console.log('📤 Upload response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 422) {
          throw new Error('Invalid token format. Please login again.');
        } else {
          throw new Error(`Upload failed: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('📤 Upload result:', result);

      return result;

    } catch (error: any) {
      console.error('❌ Image upload error:', error);
      throw error;
    }
  },

  // ✅ Create article with JSON data
  async createArticle(articleData: CreateArticleData): Promise<any> {
    try {
      console.log('🔄 Creating article:', articleData.title);

      // Get token
      const token = localStorage.getItem('auth_token') ||
                   localStorage.getItem('access_token') ||
                   localStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:8000/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(articleData)
      });

      console.log('📤 Create article response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 422) {
          throw new Error('Invalid token format. Please login again.');
        } else {
          const errorText = await response.text();
          console.error('❌ Create article error response:', errorText);
          throw new Error(`Create article failed: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('📤 Create article result:', result);

      return result;

    } catch (error: any) {
      console.error('❌ Create article error:', error);
      throw error;
    }
  },

  // ✅ Get articles
  async getArticles(params: any = {}): Promise<any> {
    try {
      console.log('🔄 Getting articles with params:', params);

      // Get token
      const token = localStorage.getItem('auth_token') ||
                   localStorage.getItem('access_token') ||
                   localStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query string
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key].toString());
        }
      });

      const url = `http://localhost:8000/api/articles${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('📡 Fetching URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Get articles response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else {
          throw new Error(`Get articles failed: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('📥 Get articles result:', result.success ? 'Success' : 'Failed');

      return result;

    } catch (error: any) {
      console.error('❌ Get articles error:', error);
      throw error;
    }
  },

  // ✅ Test backend connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing backend connection...');

      // Test main health endpoint
      const healthResponse = await fetch('http://localhost:8000/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (healthResponse.ok) {
        console.log('✅ Backend health check passed');

        // Test auth endpoint
        const authHealthResponse = await fetch('http://localhost:8000/api/auth/health');
        if (authHealthResponse.ok) {
          console.log('✅ Auth endpoint working');
        }

        // Test articles endpoint
        const articlesHealthResponse = await fetch('http://localhost:8000/api/articles/health');
        if (articlesHealthResponse.ok) {
          console.log('✅ Articles endpoint working');
        }

        // Test images endpoint
        const imagesHealthResponse = await fetch('http://localhost:8000/api/images/health');
        if (imagesHealthResponse.ok) {
          console.log('✅ Images endpoint working');
        }

        return true;
      } else {
        console.error('❌ Backend health check failed:', healthResponse.status);
        return false;
      }

    } catch (error) {
      console.error('❌ Backend connection test failed:', error);
      return false;
    }
  }
};
