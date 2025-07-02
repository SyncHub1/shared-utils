import Redis from 'ioredis';
import { v2 as cloudinary } from 'cloudinary';
import { Queue, Worker } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

// Redis client
export const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

// Redis connection events
redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

redisClient.on('close', () => {
  console.log('🔌 Redis connection closed');
});

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary service
export const cloudinaryService = {
  uploadImage: async (buffer, options = {}) => {
    try {
      const uploadOptions = {
        resource_type: 'image',
        ...options
      };

      const base64File = buffer.toString('base64');
      const dataURI = `data:${options.mimetype || 'image/jpeg'};base64,${base64File}`;

      const result = await cloudinary.uploader.upload(dataURI, uploadOptions);
      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format
      };
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  uploadVideo: async (buffer, options = {}) => {
    try {
      const uploadOptions = {
        resource_type: 'video',
        ...options
      };

      const base64File = buffer.toString('base64');
      const dataURI = `data:${options.mimetype || 'video/mp4'};base64,${base64File}`;

      const result = await cloudinary.uploader.upload(dataURI, uploadOptions);
      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        duration: result.duration,
        width: result.width,
        height: result.height
      };
    } catch (error) {
      console.error('❌ Cloudinary video upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  uploadAudio: async (buffer, options = {}) => {
    try {
      const uploadOptions = {
        resource_type: 'audio',
        ...options
      };

      const base64File = buffer.toString('base64');
      const dataURI = `data:${options.mimetype || 'audio/mp3'};base64,${base64File}`;

      const result = await cloudinary.uploader.upload(dataURI, uploadOptions);
      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        duration: result.duration
      };
    } catch (error) {
      console.error('❌ Cloudinary audio upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  delete: async (publicId) => {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return {
        success: true,
        result
      };
    } catch (error) {
      console.error('❌ Cloudinary delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Queue service
export const queueService = {
  queues: {},

  initialize: async () => {
    try {
      // Create queues
      queueService.queues.imageProcessing = new Queue('image-processing', {
        connection: redisClient
      });

      queueService.queues.mediaProcessing = new Queue('media-processing', {
        connection: redisClient
      });

      console.log('✅ Queue service initialized');
    } catch (error) {
      console.error('❌ Queue service initialization failed:', error);
      throw error;
    }
  },

  addImageJob: async (jobData) => {
    try {
      const job = await queueService.queues.imageProcessing.add('image-processing', jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 50
      });

      console.log(`📤 Added image processing job: ${job.id}`);
      return job;
    } catch (error) {
      console.error('❌ Error adding image job:', error);
      throw error;
    }
  },

  addMediaJob: async (jobData) => {
    try {
      const job = await queueService.queues.mediaProcessing.add('media-processing', jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 50
      });

      console.log(`📤 Added media processing job: ${job.id}`);
      return job;
    } catch (error) {
      console.error('❌ Error adding media job:', error);
      throw error;
    }
  },

  cleanup: async () => {
    try {
      for (const queue of Object.values(queueService.queues)) {
        await queue.close();
      }
      console.log('🧹 Queue service cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up queue service:', error);
      throw error;
    }
  }
};

// Utility functions
export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'unknown';
};

// Export all utilities
export default {
  redisClient,
  cloudinaryService,
  queueService,
  generateId,
  formatFileSize,
  getFileType
}; 