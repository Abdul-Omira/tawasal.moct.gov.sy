/**
 * Syrian Ministry of Communication - Citizen Engagement Platform
 * Simple, reliable metadata capture for submission tracking
 * 
 * @author Abdulwahab Omira <abdul@omiratech.com>
 * @version 1.0.0
 * @license MIT
 */

export function captureBasicMetadata() {
  const metadata = {
    pageUrl: window.location.href,
    referrerUrl: document.referrer || '',
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    javascriptEnabled: true,
    cookiesEnabled: navigator.cookieEnabled,
    touchSupport: 'ontouchstart' in window,
    pageLoadTime: Math.round(performance.now()),
    timestamp: new Date().toISOString()
  };
  
  return metadata;
}