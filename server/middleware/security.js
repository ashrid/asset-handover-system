import helmet from 'helmet';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Security middleware configuration using Helmet
 * Provides HTTP security headers
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Required for React
      styleSrc: ["'self'", "'unsafe-inline'"], // Required for inline styles
      imgSrc: ["'self'", "data:", "blob:"], // Allow data URIs for signatures
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  } : false, // Disable CSP in development for easier debugging

  // Cross-Origin settings
  crossOriginEmbedderPolicy: false, // Disable for compatibility
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },

  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },

  // Frameguard - prevent clickjacking
  frameguard: { action: "deny" },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // HSTS - Strict Transport Security (production only)
  hsts: isProduction ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false,

  // IE No Open
  ieNoOpen: true,

  // No Sniff - prevent MIME type sniffing
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: { permittedPolicies: "none" },

  // Referrer Policy
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },

  // XSS Filter (legacy browsers)
  xssFilter: true
});

/**
 * Additional security headers not covered by Helmet
 */
export const additionalSecurityHeaders = (req, res, next) => {
  // Permissions Policy (formerly Feature Policy)
  res.setHeader('Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );

  // Cache control for API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

export default securityHeaders;
