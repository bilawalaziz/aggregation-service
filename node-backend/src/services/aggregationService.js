  const axios = require('axios');
  const logger = require('../config/logger');
  const { retryOperation } = require('../utils/retryHelper');

  class AggregationService {
    
    constructor() {
      logger.info('AggregationService initialized')
    }

    getBaseURL() {
      const url = process.env.JSON_PLACEHOLDER_URL;
      if (!url) {
        logger.error('JSON_PLACEHOLDER_URL is not set in environment!');
        throw new Error('JSON_PLACEHOLDER_URL environment variable is required.');
      }
      return url;
    }
    
    async fetchPosts() {
      //console.log('=== DEBUG ===');
      //console.log('JSON_PLACEHOLDER_URL from env:', process.env.JSON_PLACEHOLDER_URL);
      const baseURL = this.getBaseURL();
      const url = `${baseURL}/posts`;
      logger.debug(`Fetching posts from: ${url}`);
      //console.log('Full URL being used:', url);
      //console.log('===============');
      return retryOperation(
        async () => {
          const response = await axios.get(url, {
            timeout: 5000,
            params: { _limit: 10 },
          });
          logger.debug(`Fetched ${response.data.length} posts.`);
          return response.data;
        },
        {
          maxRetries: 3,
          delay: 1000,
          logger,
          operationName: 'Fetch Posts',
        }
      );
    }
    
    async fetchUsers() {
      const baseURL = this.getBaseURL();
      const url = `${baseURL}/users`;
      logger.debug(`Fetching users from: ${url}`);
      return retryOperation(
        async () => {
          const response = await axios.get(url, {
            timeout: 5000,
            params: { _limit: 5 },
          });
          logger.debug(`Fetched ${response.data.length} users.`);
          return response.data;
        },
        {
          maxRetries: 3,
          delay: 1000,
          logger,
          operationName: 'Fetch Users',
        }
      );
    }
    
    async fetchComments() {
      const baseURL = this.getBaseURL();
      const url = `${baseURL}/comments`;
      logger.debug(`Fetching comments from: ${url}`);
      return retryOperation(
        async () => {
          const response = await axios.get(url, {
            timeout: 5000,
            params: { _limit: 20 },
          });
          logger.debug(`Fetched ${response.data.length} comments.`);
          return response.data;
        },
        {
          maxRetries: 3,
          delay: 1000,
          logger,
          operationName: 'Fetch Comments',
        }
      );
    }
    
    async aggregateData(taskType, params = {}) {
      const startTime = Date.now();
      
      try {
        let result = {};
        
        switch (taskType) {
          case 'full_aggregation':
            const results = await Promise.allSettled([
              this.fetchPosts(),
              this.fetchUsers(),
              this.fetchComments(),
            ]);

            const posts = results[0].status === 'fulfilled' ? results[0].value : [];
            const users = results[1].status === 'fulfilled' ? results[1].value : [];
            const comments = results[2].status === 'fulfilled' ? results[2].value : [];
            
            result = {
              summary: {
                totalPosts: posts.length,
                totalUsers: users.length,
                totalComments: comments.length,
                failedComponents: [
                  results[0].status === 'rejected' ? 'posts' : null,
                  results[1].status === 'rejected' ? 'users' : null,
                  results[2].status === 'rejected' ? 'comments' : null,
                ].filter(Boolean)
              },
              recentPosts: posts.slice(0, 5),
              users: users,
              sampleComments: comments.slice(0, 10),
              metadata: {
                aggregatedAt: new Date().toISOString(),
                processingTimeMs: Date.now() - startTime,
              },
            };
            break;
            
          case 'posts_only':
            const postsOnly = await this.fetchPosts();
            result = {
              posts: postsOnly,
              count: postsOnly.length,
              metadata: {
                aggregatedAt: new Date().toISOString(),
                processingTimeMs: Date.now() - startTime,
              },
            };
            break;
            
          case 'users_with_posts':
            const allUsers = await this.fetchUsers();
            const allPosts = await this.fetchPosts();
            
            const usersWithPosts = allUsers.map(user => ({
              ...user,
              posts: allPosts.filter(post => post.userId === user.id).slice(0, 3),
            }));
            
            result = {
              users: usersWithPosts,
              metadata: {
                aggregatedAt: new Date().toISOString(),
                processingTimeMs: Date.now() - startTime,
              },
            };
            break;
            
          default:
            throw new Error(`Unknown task type: ${taskType}`);
        }
        
        logger.info(`Aggregation completed for task type: ${taskType}`, {
          processingTimeMs: Date.now() - startTime,
        });
        
        return result;
      } catch (error) {
        logger.error(`Aggregation failed for task type: ${taskType}`, error);
        throw error;
      }
    }
  }

  module.exports = new AggregationService();