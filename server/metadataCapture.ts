import { Request } from 'express';

/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * Metadata capture and validation for submission tracking
 * 
 * @author Abdulwahab Omira <abdul@omiratech.com>
 * @version 1.0.0
 * @license MIT
 */

/**
 * Metadata interface for submission tracking
 */
export interface SubmissionMetadata {
  // Network & Location Metadata
  ipAddress?: string;
  geolocation?: {
    city?: string;
    region?: string;
    country?: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
  };
  ispInfo?: {
    isp?: string;
    asn?: string;
    org?: string;
  };
  vpnDetection?: {
    isVpn?: boolean;
    isProxy?: boolean;
    riskScore?: number;
  };
  hostingProvider?: string;

  // Device & Browser Metadata
  userAgent?: string;
  browserInfo?: {
    name?: string;
    version?: string;
    os?: string;
    osVersion?: string;
    engine?: string;
  };
  deviceType?: string;
  language?: string;
  screenResolution?: string;
  timezone?: string;
  touchSupport?: boolean;
  batteryStatus?: {
    charging?: boolean;
    level?: number;
  };
  installedFonts?: string[];

  // Browser Environment Metadata
  referrerUrl?: string;
  pageUrl?: string;
  pageLoadTime?: number;
  javascriptEnabled?: boolean;
  cookiesEnabled?: boolean;
  doNotTrack?: boolean;
  browserPlugins?: string[];
  webglFingerprint?: string;
}

/**
 * Extract IP address from request headers with fallback options
 */
function extractIpAddress(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  
  if (typeof realIp === 'string') {
    return realIp;
  }
  
  if (typeof cfConnectingIp === 'string') {
    return cfConnectingIp;
  }
  
  return req.connection.remoteAddress || req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Parse User-Agent string into structured browser information
 */
function parseUserAgent(userAgent: string): SubmissionMetadata['browserInfo'] {
  if (!userAgent) return {};

  const browserInfo: SubmissionMetadata['browserInfo'] = {};

  // Browser detection
  if (userAgent.includes('Chrome/')) {
    browserInfo.name = 'Chrome';
    const chromeMatch = userAgent.match(/Chrome\/([0-9.]+)/);
    if (chromeMatch) browserInfo.version = chromeMatch[1];
  } else if (userAgent.includes('Firefox/')) {
    browserInfo.name = 'Firefox';
    const firefoxMatch = userAgent.match(/Firefox\/([0-9.]+)/);
    if (firefoxMatch) browserInfo.version = firefoxMatch[1];
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
    browserInfo.name = 'Safari';
    const safariMatch = userAgent.match(/Version\/([0-9.]+)/);
    if (safariMatch) browserInfo.version = safariMatch[1];
  } else if (userAgent.includes('Edge/')) {
    browserInfo.name = 'Edge';
    const edgeMatch = userAgent.match(/Edge\/([0-9.]+)/);
    if (edgeMatch) browserInfo.version = edgeMatch[1];
  }

  // OS detection
  if (userAgent.includes('Windows NT')) {
    browserInfo.os = 'Windows';
    const windowsMatch = userAgent.match(/Windows NT ([0-9.]+)/);
    if (windowsMatch) browserInfo.osVersion = windowsMatch[1];
  } else if (userAgent.includes('Mac OS X')) {
    browserInfo.os = 'macOS';
    const macMatch = userAgent.match(/Mac OS X ([0-9_]+)/);
    if (macMatch) browserInfo.osVersion = macMatch[1].replace(/_/g, '.');
  } else if (userAgent.includes('Linux')) {
    browserInfo.os = 'Linux';
  } else if (userAgent.includes('Android')) {
    browserInfo.os = 'Android';
    const androidMatch = userAgent.match(/Android ([0-9.]+)/);
    if (androidMatch) browserInfo.osVersion = androidMatch[1];
  } else if (userAgent.includes('iPhone OS') || userAgent.includes('iOS')) {
    browserInfo.os = 'iOS';
    const iosMatch = userAgent.match(/OS ([0-9_]+)/);
    if (iosMatch) browserInfo.osVersion = iosMatch[1].replace(/_/g, '.');
  }

  // Engine detection
  if (userAgent.includes('Webkit')) browserInfo.engine = 'WebKit';
  if (userAgent.includes('Gecko')) browserInfo.engine = 'Gecko';
  if (userAgent.includes('Trident')) browserInfo.engine = 'Trident';

  return browserInfo;
}

/**
 * Determine device type from User-Agent
 */
function detectDeviceType(userAgent: string): string {
  if (!userAgent) return 'unknown';

  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    return 'mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

/**
 * Extract metadata from HTTP request
 */
export function extractRequestMetadata(req: Request): Partial<SubmissionMetadata> {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = Array.isArray(req.headers['accept-language']) 
    ? req.headers['accept-language'][0] 
    : req.headers['accept-language'] || '';
  const referer = (Array.isArray(req.headers['referer']) ? req.headers['referer'][0] : req.headers['referer']) || 
                  (Array.isArray(req.headers['referrer']) ? req.headers['referrer'][0] : req.headers['referrer']) || '';

  return {
    ipAddress: extractIpAddress(req),
    userAgent,
    browserInfo: parseUserAgent(userAgent),
    deviceType: detectDeviceType(userAgent),
    language: acceptLanguage.split(',')[0]?.split('-')[0] || '',
    referrerUrl: referer,
  };
}

/**
 * Merge client-side metadata with server-side metadata
 */
export function mergeMetadata(
  serverMetadata: Partial<SubmissionMetadata>,
  clientMetadata: Partial<SubmissionMetadata>
): SubmissionMetadata {
  return {
    ...serverMetadata,
    ...clientMetadata,
    // Prefer server-side IP address for security
    ipAddress: serverMetadata.ipAddress,
    userAgent: serverMetadata.userAgent,
  };
}

/**
 * Validate and sanitize metadata to prevent injection attacks
 */
export function sanitizeMetadata(metadata: Partial<SubmissionMetadata>): SubmissionMetadata {
  const sanitized: SubmissionMetadata = {};

  // Sanitize strings
  if (metadata.ipAddress) sanitized.ipAddress = metadata.ipAddress.slice(0, 45); // IPv6 max length
  if (metadata.userAgent) sanitized.userAgent = metadata.userAgent.slice(0, 500);
  if (metadata.deviceType) sanitized.deviceType = metadata.deviceType.slice(0, 20);
  if (metadata.language) sanitized.language = metadata.language.slice(0, 10);
  if (metadata.screenResolution) sanitized.screenResolution = metadata.screenResolution.slice(0, 20);
  if (metadata.timezone) sanitized.timezone = metadata.timezone.slice(0, 50);
  if (metadata.referrerUrl) sanitized.referrerUrl = metadata.referrerUrl.slice(0, 500);
  if (metadata.pageUrl) sanitized.pageUrl = metadata.pageUrl.slice(0, 500);
  if (metadata.hostingProvider) sanitized.hostingProvider = metadata.hostingProvider.slice(0, 100);
  if (metadata.webglFingerprint) sanitized.webglFingerprint = metadata.webglFingerprint.slice(0, 100);

  // Sanitize numbers
  if (typeof metadata.pageLoadTime === 'number' && metadata.pageLoadTime >= 0) {
    sanitized.pageLoadTime = Math.min(metadata.pageLoadTime, 300000); // Max 5 minutes
  }

  // Sanitize booleans
  if (typeof metadata.touchSupport === 'boolean') sanitized.touchSupport = metadata.touchSupport;
  if (typeof metadata.javascriptEnabled === 'boolean') sanitized.javascriptEnabled = metadata.javascriptEnabled;
  if (typeof metadata.cookiesEnabled === 'boolean') sanitized.cookiesEnabled = metadata.cookiesEnabled;
  if (typeof metadata.doNotTrack === 'boolean') sanitized.doNotTrack = metadata.doNotTrack;

  // Sanitize arrays
  if (Array.isArray(metadata.installedFonts)) {
    sanitized.installedFonts = metadata.installedFonts
      .filter(font => typeof font === 'string')
      .map(font => font.slice(0, 50))
      .slice(0, 50); // Max 50 fonts
  }

  if (Array.isArray(metadata.browserPlugins)) {
    sanitized.browserPlugins = metadata.browserPlugins
      .filter(plugin => typeof plugin === 'string')
      .map(plugin => plugin.slice(0, 100))
      .slice(0, 20); // Max 20 plugins
  }

  // Sanitize objects
  if (metadata.geolocation && typeof metadata.geolocation === 'object') {
    sanitized.geolocation = {};
    if (metadata.geolocation.city) sanitized.geolocation.city = metadata.geolocation.city.slice(0, 50);
    if (metadata.geolocation.region) sanitized.geolocation.region = metadata.geolocation.region.slice(0, 50);
    if (metadata.geolocation.country) sanitized.geolocation.country = metadata.geolocation.country.slice(0, 50);
    if (metadata.geolocation.timezone) sanitized.geolocation.timezone = metadata.geolocation.timezone.slice(0, 50);
    if (typeof metadata.geolocation.latitude === 'number') sanitized.geolocation.latitude = metadata.geolocation.latitude;
    if (typeof metadata.geolocation.longitude === 'number') sanitized.geolocation.longitude = metadata.geolocation.longitude;
  }

  if (metadata.ispInfo && typeof metadata.ispInfo === 'object') {
    sanitized.ispInfo = {};
    if (metadata.ispInfo.isp) sanitized.ispInfo.isp = metadata.ispInfo.isp.slice(0, 100);
    if (metadata.ispInfo.asn) sanitized.ispInfo.asn = metadata.ispInfo.asn.slice(0, 20);
    if (metadata.ispInfo.org) sanitized.ispInfo.org = metadata.ispInfo.org.slice(0, 100);
  }

  if (metadata.vpnDetection && typeof metadata.vpnDetection === 'object') {
    sanitized.vpnDetection = {};
    if (typeof metadata.vpnDetection.isVpn === 'boolean') sanitized.vpnDetection.isVpn = metadata.vpnDetection.isVpn;
    if (typeof metadata.vpnDetection.isProxy === 'boolean') sanitized.vpnDetection.isProxy = metadata.vpnDetection.isProxy;
    if (typeof metadata.vpnDetection.riskScore === 'number') sanitized.vpnDetection.riskScore = Math.max(0, Math.min(100, metadata.vpnDetection.riskScore));
  }

  if (metadata.browserInfo && typeof metadata.browserInfo === 'object') {
    sanitized.browserInfo = {};
    if (metadata.browserInfo.name) sanitized.browserInfo.name = metadata.browserInfo.name.slice(0, 50);
    if (metadata.browserInfo.version) sanitized.browserInfo.version = metadata.browserInfo.version.slice(0, 20);
    if (metadata.browserInfo.os) sanitized.browserInfo.os = metadata.browserInfo.os.slice(0, 50);
    if (metadata.browserInfo.osVersion) sanitized.browserInfo.osVersion = metadata.browserInfo.osVersion.slice(0, 20);
    if (metadata.browserInfo.engine) sanitized.browserInfo.engine = metadata.browserInfo.engine.slice(0, 20);
  }

  if (metadata.batteryStatus && typeof metadata.batteryStatus === 'object') {
    sanitized.batteryStatus = {};
    if (typeof metadata.batteryStatus.charging === 'boolean') sanitized.batteryStatus.charging = metadata.batteryStatus.charging;
    if (typeof metadata.batteryStatus.level === 'number') sanitized.batteryStatus.level = Math.max(0, Math.min(1, metadata.batteryStatus.level));
  }

  return sanitized;
}