import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";

export interface PresignedUrlResponse {
  success: boolean;
  data: {
    presigned_url: string;
    image_id: string;
    expires_in: number;
  };
}

export interface ImageUploadResult {
  success: boolean;
  image_url: string;
  image_id: string;
}

class UploadService {
  /**
   * Step 1: Get presigned URL from backend
   */
  async getPresignedUrl(fileName: string, fileType: string): Promise<PresignedUrlResponse> {
    try {
      console.log('🚀 Getting presigned URL for:', fileName);

      const response = await apiClient.get<PresignedUrlResponse>(
        API_ENDPOINTS.UPLOADS.PRESIGNED_URL,
        {
          params: {
            file_name: fileName,
            file_type: fileType,
            bucket_type: 'articles' // for article images
          }
        }
      );

      if (!response.data.success) {
        throw new Error('Failed to get presigned URL');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ Error getting presigned URL:', error);
      throw new Error(error.response?.data?.message || 'Failed to get upload URL');
    }
  }

  /**
   * Step 3: Upload file directly to MinIO using presigned URL
   */
  async uploadToMinIO(presignedUrl: string, file: File): Promise<void> {
    try {
      console.log('📤 Uploading to MinIO...');

      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Upload to MinIO successful');
    } catch (error: any) {
      console.error('❌ Error uploading to MinIO:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  /**
   * Step 5: Confirm upload and move from tmp to main folder
   */
  async confirmUpload(imageId: string): Promise<ImageUploadResult> {
    try {
      console.log('✅ Confirming upload for image:', imageId);

      const response = await apiClient.post<{
        success: boolean;
        data: {
          image_url: string;
          image_id: string;
        };
      }>(API_ENDPOINTS.UPLOADS.CONFIRM, {
        image_id: imageId
      });

      if (!response.data.success) {
        throw new Error('Failed to confirm upload');
      }

      return {
        success: true,
        image_url: response.data.data.image_url,
        image_id: response.data.data.image_id
      };
    } catch (error: any) {
      console.error('❌ Error confirming upload:', error);
      throw new Error(error.response?.data?.message || 'Failed to confirm upload');
    }
  }

  /**
   * Complete upload flow: Get presigned URL → Upload to MinIO → Confirm
   */
  async uploadImage(file: File): Promise<ImageUploadResult> {
    try {
      // Step 1: Get presigned URL
      const presignedResponse = await this.getPresignedUrl(file.name, file.type);

      // Step 3: Upload to MinIO
      await this.uploadToMinIO(presignedResponse.data.presigned_url, file);

      // Step 5: Confirm upload (move from tmp to main)
      const result = await this.confirmUpload(presignedResponse.data.image_id);

      console.log('🎉 Complete upload flow successful:', result);
      return result;

    } catch (error: any) {
      console.error('❌ Upload flow failed:', error);
      throw error;
    }
  }

  /**
   * Delete image
   */
  async deleteImage(imageId: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.UPLOADS.DELETE(imageId));
      console.log('🗑️ Image deleted:', imageId);
    } catch (error: any) {
      console.error('❌ Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }
}

export const uploadService = new UploadService();