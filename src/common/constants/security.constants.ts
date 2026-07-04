// Security Constants

// File Upload Limits (in bytes)
export const FILE_UPLOAD_LIMITS = {
  VIDEO: 500 * 1024 * 1024, // 500 MB for videos
  IMAGE: 10 * 1024 * 1024, // 10 MB for images
};

// Allowed MIME types (Video)
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/x-m4v',
  'video/mov',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
];

// Allowed MIME types (Image)
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Allowed MIME types (Content)
export const ALLOWED_CONTENT_TYPES = [
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_IMAGE_TYPES,
];

// Rate Limiting
export const RATE_LIMITS = {
  LOGIN: {
    LIMIT: 5,
    TTL: 60000, // 1 minute
  },
  SIGNUP: {
    LIMIT: 3,
    TTL: 60000, // 1 minute
  },
  API_DEFAULT: {
    SHORT: { limit: 10, ttl: 1000 }, // 10 req/sec
    MEDIUM: { limit: 60, ttl: 60000 }, // 60 req/min
    LONG: { limit: 100, ttl: 900000 }, // 100 req/15min
  },
};

// Password Requirements
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
};

// JWT Configuration
export const JWT_CONFIG = {
  EXPIRATION: '7d',
  REFRESH_EXPIRATION: '30d',
};

// CORS Configuration
export const CORS_CONFIG = {
  ALLOWED_METHODS: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  CREDENTIALS: true,
  MAX_AGE: 86400, // 24 hours
};
