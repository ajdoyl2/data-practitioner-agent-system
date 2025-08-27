// Authentication Middleware for Evidence.dev Publications
// Supports basic auth, OAuth, and IP allowlisting

import crypto from 'crypto';

// Basic authentication implementation
export function basicAuth(req, res, next) {
  const auth = { login: process.env.BASIC_AUTH_USERNAME, password: process.env.BASIC_AUTH_PASSWORD };
  
  // Check if basic auth is enabled
  if (!process.env.BASIC_AUTH_ENABLED || process.env.BASIC_AUTH_ENABLED !== 'true') {
    return next();
  }
  
  // Parse login and password from headers
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
  
  // Verify login and password
  if (login && password && login === auth.login && password === auth.password) {
    return next();
  }
  
  // Access denied
  res.set('WWW-Authenticate', 'Basic realm="Evidence.dev Publication"');
  res.status(401).send('Authentication required');
}

// IP allowlisting implementation
export function ipAllowlist(req, res, next) {
  // Check if IP allowlisting is enabled
  if (!process.env.IP_ALLOWLIST_ENABLED || process.env.IP_ALLOWLIST_ENABLED !== 'true') {
    return next();
  }
  
  const allowedIPs = process.env.IP_ALLOWLIST?.split(',') || [];
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Check if client IP is in allowlist
  const isAllowed = allowedIPs.some(allowedIP => {
    if (allowedIP.includes('/')) {
      // CIDR notation - simplified check (would need proper CIDR library in production)
      const [network, mask] = allowedIP.split('/');
      // Simplified check for demo - in production use proper CIDR matching
      return clientIP.startsWith(network.split('.').slice(0, parseInt(mask) / 8).join('.'));
    } else {
      // Exact IP match
      return clientIP === allowedIP.trim();
    }
  });
  
  if (!isAllowed) {
    res.status(403).send('Access denied - IP not allowlisted');
    return;
  }
  
  next();
}

// OAuth implementation (Google OAuth2 example)
export function oauthAuth(req, res, next) {
  // Check if OAuth is enabled
  if (!process.env.OAUTH_ENABLED || process.env.OAUTH_ENABLED !== 'true') {
    return next();
  }
  
  // Check for session or JWT token
  const token = req.headers.authorization?.replace('Bearer ', '') || req.session?.accessToken;
  
  if (!token) {
    // Redirect to OAuth provider
    const authUrl = buildOAuthUrl();
    res.redirect(authUrl);
    return;
  }
  
  // Verify token (simplified - would use proper JWT verification in production)
  verifyToken(token)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(() => {
      res.status(401).send('Invalid token');
    });
}

// Build OAuth authorization URL
function buildOAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.OAUTH_CLIENT_ID,
    redirect_uri: `${process.env.BASE_URL}/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state: crypto.randomBytes(32).toString('hex')
  });
  
  const provider = process.env.OAUTH_PROVIDER || 'google';
  const authUrls = {
    google: 'https://accounts.google.com/o/oauth2/v2/auth',
    github: 'https://github.com/login/oauth/authorize',
    microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
  };
  
  return `${authUrls[provider]}?${params.toString()}`;
}

// Token verification (simplified implementation)
async function verifyToken(token) {
  // In production, this would:
  // 1. Verify JWT signature
  // 2. Check token expiration
  // 3. Validate with OAuth provider
  // 4. Return user information
  
  return new Promise((resolve, reject) => {
    // Simplified verification for demo
    if (token.length > 10) {
      resolve({ id: 'user123', email: 'user@example.com' });
    } else {
      reject(new Error('Invalid token'));
    }
  });
}

// OAuth callback handler
export async function oauthCallback(req, res) {
  const { code, state } = req.query;
  
  if (!code) {
    res.status(400).send('Authorization code missing');
    return;
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    const { access_token } = tokenResponse;
    
    // Get user info
    const userInfo = await getUserInfo(access_token);
    
    // Store token in session or set JWT cookie
    req.session.accessToken = access_token;
    req.session.user = userInfo;
    
    // Redirect to original destination
    res.redirect('/');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Authentication failed');
  }
}

// Exchange authorization code for access token
async function exchangeCodeForToken(code) {
  const provider = process.env.OAUTH_PROVIDER || 'google';
  const tokenUrls = {
    google: 'https://oauth2.googleapis.com/token',
    github: 'https://github.com/login/oauth/access_token',
    microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
  };
  
  const params = {
    client_id: process.env.OAUTH_CLIENT_ID,
    client_secret: process.env.OAUTH_CLIENT_SECRET,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: `${process.env.BASE_URL}/auth/callback`
  };
  
  const response = await fetch(tokenUrls[provider], {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params)
  });
  
  return response.json();
}

// Get user information from OAuth provider
async function getUserInfo(accessToken) {
  const provider = process.env.OAUTH_PROVIDER || 'google';
  const userInfoUrls = {
    google: 'https://www.googleapis.com/oauth2/v2/userinfo',
    github: 'https://api.github.com/user',
    microsoft: 'https://graph.microsoft.com/v1.0/me'
  };
  
  const response = await fetch(userInfoUrls[provider], {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  return response.json();
}

// Combined authentication middleware
export function authenticate(req, res, next) {
  // Apply authentication in order of precedence
  if (process.env.IP_ALLOWLIST_ENABLED === 'true') {
    ipAllowlist(req, res, (err) => {
      if (err) return next(err);
      continueAuth();
    });
  } else {
    continueAuth();
  }
  
  function continueAuth() {
    if (process.env.OAUTH_ENABLED === 'true') {
      oauthAuth(req, res, next);
    } else if (process.env.BASIC_AUTH_ENABLED === 'true') {
      basicAuth(req, res, next);
    } else {
      next();
    }
  }
}