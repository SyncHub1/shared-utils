const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryService {
  constructor() {
    this.cloudinary = cloudinary;
  }

  async uploadImage(filePath, options = {}) {
    try {
      const defaultOptions = {
        folder: 'processed_images',
        resource_type: 'image',
        ...options
      };

      const result = await this.cloudinary.uploader.upload(filePath, defaultOptions);
      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes
      };
    } catch (error) {
      console.error('❌ Cloudinary image upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async uploadVideo(filePath, options = {}) {
    try {
      const defaultOptions = {
        folder: 'processed_videos',
        resource_type: 'video',
        ...options
      };

      const result = await this.cloudinary.uploader.upload(filePath, defaultOptions);
      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        duration: result.duration,
        bytes: result.bytes
      };
    } catch (error) {
      console.error('❌ Cloudinary video upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async uploadAudio(filePath, options = {}) {
    try {
      const defaultOptions = {
        folder: 'processed_audio',
        resource_type: 'video', // Cloudinary treats audio as video
        ...options
      };

      const result = await this.cloudinary.uploader.upload(filePath, defaultOptions);
      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        duration: result.duration,
        bytes: result.bytes
      };
    } catch (error) {
      console.error('❌ Cloudinary audio upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteFile(publicId, resourceType = 'image') {
    try {
      const result = await this.cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });
      return {
        success: true,
        result
      };
    } catch (error) {
      console.error('❌ Cloudinary delete failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate optimized URLs with transformations
  getOptimizedUrl(publicId, options = {}) {
    const defaultOptions = {
      quality: 'auto',
      fetch_format: 'auto',
      ...options
    };

    return this.cloudinary.url(publicId, defaultOptions);
  }
}

module.exports = new CloudinaryService(); 