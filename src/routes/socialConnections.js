import { Router } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { query } from '../database/db.js';
import { authenticate } from '../middleware/auth.js';
import { config } from '../config.js';

const router = Router();

const PLATFORMS = new Set(['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok']);

// Get user's social connections
router.get('/', authenticate, async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, platform, profile_name AS profileName, profile_picture AS profilePicture, connected_at AS connectedAt
       FROM social_connections
       WHERE user_id = ?
       ORDER BY platform ASC`,
      [req.user.id]
    );
    res.json({ connections: rows });
  } catch (error) {
    console.error('List social connections error:', error);
    res.status(500).json({ error: 'Failed to list social connections' });
  }
});

// Initiates the OAuth flow
router.get('/auth/:platform', async (req, res) => {
  const { platform } = req.params;
  const token = req.query.token;

  if (!token) {
    return res.status(401).send('Authentication token required');
  }

  if (!PLATFORMS.has(platform)) {
    return res.status(400).send('Invalid platform selection');
  }

  let userId;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    userId = payload.sub;
  } catch (err) {
    return res.status(401).send('Invalid or expired token');
  }

  // Generate secure signed state token carrying the user ID
  const stateToken = jwt.sign({ userId }, config.jwtSecret, { expiresIn: '15m' });
  const redirectUri = `${config.oauth.redirectBase}/${platform}`;

  try {
    let authUrl = '';
    switch (platform) {
      case 'facebook':
      case 'instagram':
        authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${config.oauth.facebook.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish&state=${stateToken}`;
        break;
      case 'linkedin':
        authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${config.oauth.linkedin.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=w_member_social,r_liteprofile&state=${stateToken}`;
        break;
      case 'youtube':
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.oauth.youtube.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload%20https://www.googleapis.com/auth/youtube.readonly&state=${stateToken}&access_type=offline&prompt=consent`;
        break;
      case 'tiktok':
        authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${config.oauth.tiktok.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=user.info.basic,video.publish,video.upload&state=${stateToken}`;
        break;
      default:
        return res.status(400).send('Unsupported platform');
    }

    res.redirect(authUrl);
  } catch (error) {
    console.error(`[OAuth] Start failed for ${platform}:`, error.message);
    res.status(500).send('Failed to start authentication flow');
  }
});

// OAuth Redirect callback endpoint
router.get('/callback/:platform', async (req, res) => {
  const { platform } = req.params;
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send(`OAuth Error: ${error}`);
  }

  if (!code || !state) {
    return res.status(400).send('Missing code or state token');
  }

  let userId;
  try {
    const decoded = jwt.verify(state, config.jwtSecret);
    userId = decoded.userId;
  } catch (err) {
    return res.status(400).send('Invalid or expired state token');
  }

  const redirectUri = `${config.oauth.redirectBase}/${platform}`;
  
  let token = '';
  let profileName = '';
  let profilePicture = '';

  try {
    // Live API code exchange
    switch (platform) {
        case 'facebook': {
          const tokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
            params: {
              client_id: config.oauth.facebook.clientId,
              client_secret: config.oauth.facebook.clientSecret,
              redirect_uri: redirectUri,
              code,
            }
          });
          token = tokenRes.data.access_token;
          
          const profileRes = await axios.get('https://graph.facebook.com/v19.0/me', {
            params: {
              fields: 'name,picture.width(150).height(150)',
              access_token: token
            }
          });
          profileName = profileRes.data.name;
          profilePicture = profileRes.data.picture?.data?.url || '';
          break;
        }
        case 'linkedin': {
          const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: config.oauth.linkedin.clientId,
            client_secret: config.oauth.linkedin.clientSecret,
          });
          
          const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', tokenParams.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
          token = tokenRes.data.access_token;

          const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
          });
          profileName = `${profileRes.data.given_name || ''} ${profileRes.data.family_name || ''}`.trim() || profileRes.data.name;
          profilePicture = profileRes.data.picture || '';
          break;
        }
        case 'youtube': {
          const tokenParams = new URLSearchParams({
            code,
            client_id: config.oauth.youtube.clientId,
            client_secret: config.oauth.youtube.clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
          });

          const tokenRes = await axios.post('https://oauth2.googleapis.com/token', tokenParams.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
          token = tokenRes.data.access_token;

          const profileRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
          });
          profileName = profileRes.data.name;
          profilePicture = profileRes.data.picture || '';
          break;
        }
        case 'tiktok': {
          const tokenParams = new URLSearchParams({
            client_key: config.oauth.tiktok.clientId,
            client_secret: config.oauth.tiktok.clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
          });

          const tokenRes = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', tokenParams.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
          token = tokenRes.data.access_token;

          const profileRes = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
            headers: { Authorization: `Bearer ${token}` },
            params: { fields: 'display_name,avatar_url' }
          });
          profileName = profileRes.data.data?.user?.display_name || 'TikTok User';
          profilePicture = profileRes.data.data?.user?.avatar_url || '';
          break;
        }
      }

    // Save/Update connection in database
    await query(
      `INSERT INTO social_connections (user_id, platform, token, profile_name, profile_picture)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         token = VALUES(token),
         profile_name = VALUES(profile_name),
         profile_picture = VALUES(profile_picture)`,
      [userId, platform, token, profileName, profilePicture]
    );

    // Render close script to trigger UI reload in client
    res.send(`
      <!DOCTYPE html>
      <html>
      <body>
        <p>Connecting profile, please wait...</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'oauth_success',
              platform: '${platform}',
              profileName: '${profileName.replace(/'/g, "\\'")}',
              profilePicture: '${profilePicture}'
            }, window.location.origin);
          }
          window.close();
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error(`[OAuth] Token exchange failed for ${platform}:`, error.response?.data || error.message);
    res.status(500).send(`Failed to exchange code for token: ${error.message}`);
  }
});

// Disconnect a connection
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM social_connections WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Social connection not found' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Delete connection error:', error);
    res.status(500).json({ error: 'Failed to disconnect platform' });
  }
});

export default router;
