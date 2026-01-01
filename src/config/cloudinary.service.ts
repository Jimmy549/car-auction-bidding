import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload a base64 encoded image to Cloudinary
   * @param base64Image - Base64 encoded image string
   * @param folder - Optional folder name in Cloudinary
   * @returns Cloudinary secure URL of the uploaded image
   */
  async uploadBase64Image(
    base64Image: string,
    folder: string = 'car-auctions',
  ): Promise<string> {
    try {
      // Upload the base64 image to Cloudinary
      const result: UploadApiResponse = await cloudinary.uploader.upload(
        base64Image,
        {
          folder,
          resource_type: 'auto',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto' },
          ],
        },
      );

      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
    }
  }

  /**
   * Upload multiple base64 images to Cloudinary
   * @param base64Images - Array of base64 encoded image strings
   * @param folder - Optional folder name in Cloudinary
   * @returns Array of Cloudinary secure URLs
   */
  async uploadMultipleBase64Images(
    base64Images: string[],
    folder: string = 'car-auctions',
  ): Promise<string[]> {
    const uploadPromises = base64Images.map((image) =>
      this.uploadBase64Image(image, folder),
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Check if a string is a base64 encoded image
   * @param str - String to check
   * @returns true if the string appears to be a base64 image
   */
  isBase64Image(str: string): boolean {
    if (!str || typeof str !== 'string') return false;
    
    // Check if it starts with data:image
    if (str.startsWith('data:image/')) {
      return true;
    }
    
    // Check if it's a long string that could be base64 (cloudinary URLs are much shorter)
    // Base64 images are typically very long (thousands of characters)
    return str.length > 1000 && !str.startsWith('http');
  }
}
