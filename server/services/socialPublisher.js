import { config } from '../config.js';

/**
 * Simulates publishing a post image and caption to various social platforms.
 * Logs API request payloads to mimic actual integrations.
 */
export class SocialPublisher {
  /**
   * Publish post to a specific platform using connected profile token.
   * @param {string} platform - facebook, instagram, linkedin, youtube, tiktok
   * @param {object} post - Post record from database (contains image_path, caption, etc)
   * @param {object} connection - User's social connection details
   * @returns {Promise<{ success: boolean, platformPostId?: string, publishedUrl?: string, error?: string }>}
   */
  async publish(platform, post, connection) {
    console.log(`[SocialPublisher] Initiating API publication on platform: ${platform}`);
    console.log(`[SocialPublisher] Target User ID: ${post.userId}, Post ID: ${post.id}`);
    console.log(`[SocialPublisher] Connected account: ${connection.profileName} (Token: ${connection.token.slice(0, 15)}...)`);

    // Add a slight delay to simulate real API network latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    const mockPostId = `${platform.slice(0, 2)}_${Math.random().toString(36).slice(2, 10)}`;

    try {
      switch (platform) {
        case 'facebook':
          return await this._publishFacebook(post, connection, mockPostId);
        case 'instagram':
          return await this._publishInstagram(post, connection, mockPostId);
        case 'linkedin':
          return await this._publishLinkedIn(post, connection, mockPostId);
        case 'youtube':
          return await this._publishYouTube(post, connection, mockPostId);
        case 'tiktok':
          return await this._publishTikTok(post, connection, mockPostId);
        default:
          throw new Error(`Unsupported social platform: ${platform}`);
      }
    } catch (error) {
      console.error(`[SocialPublisher] Failed posting to ${platform}:`, error.message);
      return {
        success: false,
        error: error.message || 'API request failed',
      };
    }
  }

  async _publishFacebook(post, connection, mockPostId) {
    const apiEndpoint = 'https://graph.facebook.com/v19.0/me/photos';
    console.log(`\n--- Facebook Graph API Call ---`);
    console.log(`POST ${apiEndpoint}`);
    console.log(`Headers: { Authorization: "Bearer ${connection.token}" }`);
    console.log(`Payload: {
      url: "${config.appUrl}/uploads/${post.imagePath}",
      caption: "${post.caption.replace(/"/g, '\\"')}",
      published: true
    }`);
    console.log(`---------------------------------\n`);

    return {
      success: true,
      platformPostId: mockPostId,
      publishedUrl: `https://facebook.com/posts/${mockPostId}`,
    };
  }

  async _publishInstagram(post, connection, mockPostId) {
    const creationEndpoint = 'https://graph.facebook.com/v19.0/me/media';
    const publishEndpoint = 'https://graph.facebook.com/v19.0/me/media_publish';
    
    console.log(`\n--- Instagram Container API Call ---`);
    console.log(`Step 1: Create media container`);
    console.log(`POST ${creationEndpoint}`);
    console.log(`Payload: {
      image_url: "${config.appUrl}/uploads/${post.imagePath}",
      caption: "${post.caption.replace(/"/g, '\\"')}"
    }`);
    const mockContainerId = `ig_container_${Math.random().toString(36).slice(2, 8)}`;
    console.log(`Response: { id: "${mockContainerId}" }`);
    
    console.log(`Step 2: Publish container`);
    console.log(`POST ${publishEndpoint}`);
    console.log(`Payload: { creation_id: "${mockContainerId}" }`);
    console.log(`-------------------------------------\n`);

    return {
      success: true,
      platformPostId: mockPostId,
      publishedUrl: `https://instagram.com/p/${mockPostId}`,
    };
  }

  async _publishLinkedIn(post, connection, mockPostId) {
    const apiEndpoint = 'https://api.linkedin.com/v2/ugcPosts';
    
    console.log(`\n--- LinkedIn UGC API Call ---`);
    console.log(`POST ${apiEndpoint}`);
    console.log(`Headers: { Authorization: "Bearer ${connection.token}" }`);
    console.log(`Payload: {
      author: "urn:li:person:${connection.token.slice(-8)}",
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: "${post.caption.replace(/"/g, '\\"')}" },
          shareMediaCategory: "IMAGE",
          media: [{
            status: "READY",
            description: { text: "Generated Template Post" },
            originalUrl: "${config.appUrl}/uploads/${post.imagePath}"
          }]
        }
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
    }`);
    console.log(`------------------------------\n`);

    return {
      success: true,
      platformPostId: mockPostId,
      publishedUrl: `https://linkedin.com/feed/update/urn:li:share:${mockPostId}`,
    };
  }

  async _publishYouTube(post, connection, mockPostId) {
    const apiEndpoint = 'https://www.googleapis.com/upload/youtube/v3/videos';
    
    console.log(`\n--- YouTube Video Upload API Call ---`);
    console.log(`POST ${apiEndpoint}?uploadType=multipart&part=snippet,status`);
    console.log(`[Notice] Conversion of flat image "${post.imagePath}" into 5-second slide video frame prior to upload...`);
    console.log(`Payload: {
      snippet: {
        title: "Content Studio Post",
        description: "${post.caption.replace(/"/g, '\\"')}"
      },
      status: { privacyStatus: "public" }
    }`);
    console.log(`--------------------------------------\n`);

    return {
      success: true,
      platformPostId: mockPostId,
      publishedUrl: `https://youtube.com/watch?v=${mockPostId}`,
    };
  }

  async _publishTikTok(post, connection, mockPostId) {
    const apiEndpoint = 'https://open.tiktokapis.com/v2/post/publish/video/self/init/';
    
    console.log(`\n--- TikTok Video Direct Publish API Call ---`);
    console.log(`POST ${apiEndpoint}`);
    console.log(`[Notice] Simulating video rendering of image asset for TikTok post requirement...`);
    console.log(`Payload: {
      post_info: {
        title: "${post.caption.slice(0, 150).replace(/"/g, '\\"')}",
        privacy_level: "PUBLIC_TO_EVERYONE"
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: 153298
      }
    }`);
    console.log(`--------------------------------------------\n`);

    return {
      success: true,
      platformPostId: mockPostId,
      publishedUrl: `https://tiktok.com/@${connection.profileName.replace(/\s+/g, '').toLowerCase()}/video/${mockPostId}`,
    };
  }
}

export const socialPublisher = new SocialPublisher();
