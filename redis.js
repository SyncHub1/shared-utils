const Redis = require('redis');
require('dotenv').config();

class RedisClient {
  constructor() {
    this.publisher = null;
    this.subscriber = null;
    this.client = null;
  }

  async connect() {
    try {
      // Main Redis client for general operations
      this.client = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      // Publisher for sending messages
      this.publisher = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      // Subscriber for receiving messages
      this.subscriber = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      await this.client.connect();
      await this.publisher.connect();
      await this.subscriber.connect();

      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  async publish(channel, message) {
    try {
      await this.publisher.publish(channel, JSON.stringify(message));
    } catch (error) {
      console.error('❌ Redis publish failed:', error);
      throw error;
    }
  }

  async subscribe(channel, callback) {
    try {
      await this.subscriber.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          console.error('❌ Failed to parse Redis message:', error);
        }
      });
    } catch (error) {
      console.error('❌ Redis subscribe failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) await this.client.quit();
      if (this.publisher) await this.publisher.quit();
      if (this.subscriber) await this.subscriber.quit();
      console.log('✅ Redis disconnected');
    } catch (error) {
      console.error('❌ Redis disconnect failed:', error);
    }
  }

  getClient() {
    return this.client;
  }
}

module.exports = new RedisClient(); 