const { Queue, Worker } = require('bullmq');
const redisClient = require('./redis');
require('dotenv').config();

class QueueService {
  constructor() {
    this.queues = {};
    this.workers = {};
  }

  async initialize() {
    await redisClient.connect();
    this.setupQueues();
  }

  setupQueues() {
    // Image processing queue
    this.queues.imageProcessing = new Queue('image-processing', {
      connection: redisClient.getClient(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    // Media processing queue (video/audio)
    this.queues.mediaProcessing = new Queue('media-processing', {
      connection: redisClient.getClient(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });

    console.log('✅ Queues initialized');
  }

  async addImageJob(jobData) {
    try {
      const job = await this.queues.imageProcessing.add('process-image', jobData, {
        priority: jobData.priority || 1,
        delay: jobData.delay || 0
      });
      console.log(`📸 Image job added: ${job.id}`);
      return job;
    } catch (error) {
      console.error('❌ Failed to add image job:', error);
      throw error;
    }
  }

  async addMediaJob(jobData) {
    try {
      const job = await this.queues.mediaProcessing.add('process-media', jobData, {
        priority: jobData.priority || 1,
        delay: jobData.delay || 0
      });
      console.log(`🎬 Media job added: ${job.id}`);
      return job;
    } catch (error) {
      console.error('❌ Failed to add media job:', error);
      throw error;
    }
  }

  async getJobStatus(queueName, jobId) {
    try {
      const queue = this.queues[queueName];
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        return { status: 'not_found' };
      }

      const state = await job.getState();
      const progress = job.progress;
      const result = job.returnvalue;
      const failedReason = job.failedReason;

      return {
        id: job.id,
        status: state,
        progress,
        result,
        failedReason,
        timestamp: job.timestamp
      };
    } catch (error) {
      console.error('❌ Failed to get job status:', error);
      throw error;
    }
  }

  async getQueueStats(queueName) {
    try {
      const queue = this.queues[queueName];
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      const completed = await queue.getCompleted();
      const failed = await queue.getFailed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length
      };
    } catch (error) {
      console.error('❌ Failed to get queue stats:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      for (const queueName in this.queues) {
        await this.queues[queueName].close();
      }
      await redisClient.disconnect();
      console.log('✅ Queue service cleaned up');
    } catch (error) {
      console.error('❌ Queue cleanup failed:', error);
    }
  }
}

module.exports = new QueueService(); 