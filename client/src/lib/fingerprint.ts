import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<any> | null = null;

/**
 * Initialize and get the fingerprint agent
 */
async function getFingerprintAgent() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
}

/**
 * Generate a unique device fingerprint
 */
export async function getDeviceFingerprint(): Promise<string> {
  try {
    const fp = await getFingerprintAgent();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    // Fallback to a simple fingerprint based on available data
    return generateFallbackFingerprint();
  }
}

/**
 * Generate a fallback fingerprint if the main library fails
 */
function generateFallbackFingerprint(): string {
  const nav = window.navigator;
  const screen = window.screen;
  
  const components = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    screen.pixelDepth,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency,
    nav.platform,
    nav.vendor,
    'cookieEnabled' in nav ? nav.cookieEnabled : 'unknown',
    'maxTouchPoints' in nav ? nav.maxTouchPoints : 'unknown',
    'webdriver' in nav ? nav.webdriver : 'unknown'
  ];
  
  // Simple hash function
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Collect comprehensive device and browser information
 */
export function collectDeviceInfo() {
  const nav = window.navigator;
  const screen = window.screen;
  
  return {
    userAgent: nav.userAgent,
    language: nav.language,
    languages: nav.languages?.join(',') || nav.language,
    platform: nav.platform,
    vendor: nav.vendor,
    cookieEnabled: nav.cookieEnabled,
    doNotTrack: nav.doNotTrack,
    hardwareConcurrency: nav.hardwareConcurrency,
    maxTouchPoints: nav.maxTouchPoints,
    webdriver: (nav as any).webdriver,
    
    // Screen info
    screenResolution: `${screen.width}x${screen.height}`,
    screenColorDepth: screen.colorDepth,
    screenPixelRatio: window.devicePixelRatio,
    
    // Browser features
    localStorage: typeof Storage !== 'undefined' && window.localStorage !== null,
    sessionStorage: typeof Storage !== 'undefined' && window.sessionStorage !== null,
    indexedDB: !!window.indexedDB,
    
    // Timezone
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    
    // Canvas fingerprint (basic)
    canvasFingerprint: getCanvasFingerprint(),
    
    // WebGL info
    webglVendor: getWebGLVendor(),
    webglRenderer: getWebGLRenderer(),
    
    // Fonts detection (basic)
    fonts: getInstalledFonts(),
    
    // Plugins (deprecated but still useful for fingerprinting)
    plugins: getPlugins()
  };
}

/**
 * Get canvas fingerprint
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'not available';
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Canvas fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas fingerprint', 4, 17);
    
    return canvas.toDataURL().slice(-50);
  } catch (e) {
    return 'not available';
  }
}

/**
 * Get WebGL vendor
 */
function getWebGLVendor(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'not available';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'not available';
    
    return gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
  } catch (e) {
    return 'not available';
  }
}

/**
 * Get WebGL renderer
 */
function getWebGLRenderer(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'not available';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'not available';
    
    return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  } catch (e) {
    return 'not available';
  }
}

/**
 * Basic font detection
 */
function getInstalledFonts(): string {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testFonts = [
    'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New',
    'Georgia', 'Impact', 'Times New Roman', 'Trebuchet MS', 'Verdana'
  ];
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'not available';
  
  const detected: string[] = [];
  
  for (const font of testFonts) {
    let detected = false;
    for (const baseFont of baseFonts) {
      ctx.font = `72px ${baseFont}`;
      const baseWidth = ctx.measureText('mmmmmmmmmmlli').width;
      
      ctx.font = `72px ${font}, ${baseFont}`;
      const testWidth = ctx.measureText('mmmmmmmmmmlli').width;
      
      if (baseWidth !== testWidth) {
        detected = true;
        break;
      }
    }
    if (detected) {
      detected.push(font);
    }
  }
  
  return detected.join(',');
}

/**
 * Get browser plugins
 */
function getPlugins(): string {
  if (!navigator.plugins || navigator.plugins.length === 0) {
    return 'not available';
  }
  
  const plugins: string[] = [];
  for (let i = 0; i < navigator.plugins.length; i++) {
    const plugin = navigator.plugins[i];
    plugins.push(plugin.name);
  }
  
  return plugins.join(',');
}

/**
 * Generate hardware fingerprint (MAC-like identifier)
 */
function generateHardwareFingerprint(): string {
  const components = [
    navigator.hardwareConcurrency,
    navigator.deviceMemory,
    screen.width,
    screen.height,
    screen.colorDepth,
    window.devicePixelRatio,
    new Date().getTimezoneOffset(),
    navigator.platform,
    getWebGLVendor(),
    getWebGLRenderer()
  ];
  
  // Create a stable hash from hardware components
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Format as MAC-like address
  const hex = Math.abs(hash).toString(16).padStart(12, '0');
  return hex.match(/.{2}/g)?.join(':').toUpperCase() || 'unknown';
}

/**
 * Detect WebRTC IP leak (for VPN detection)
 */
async function detectWebRTCLeak(): Promise<any> {
  try {
    const pc = new RTCPeerConnection({
      iceServers: [{urls: 'stun:stun.l.google.com:19302'}]
    });
    
    const ips: string[] = [];
    
    pc.createDataChannel('');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    return new Promise((resolve) => {
      pc.onicecandidate = (event) => {
        if (!event || !event.candidate || !event.candidate.candidate) {
          pc.close();
          resolve({ leaked: ips.length > 0, ips });
          return;
        }
        
        const regex = /([0-9]{1,3}\.){3}[0-9]{1,3}/;
        const match = event.candidate.candidate.match(regex);
        if (match && match[0]) {
          ips.push(match[0]);
        }
      };
      
      // Timeout after 2 seconds
      setTimeout(() => {
        pc.close();
        resolve({ leaked: ips.length > 0, ips });
      }, 2000);
    });
  } catch (e) {
    return { leaked: false, error: 'WebRTC not available' };
  }
}

/**
 * Enhanced device info collection with VPN/proxy detection
 */
export async function collectEnhancedDeviceInfo() {
  const basicInfo = collectDeviceInfo();
  
  // Detect WebRTC leak
  const webRTCInfo = await detectWebRTCLeak();
  
  // Hardware fingerprint (MAC-like)
  const hardwareMAC = generateHardwareFingerprint();
  
  // Network connection details
  const connection = (navigator as any).connection;
  const networkInfo = connection ? {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    downlinkMax: connection.downlinkMax,
    rtt: connection.rtt,
    saveData: connection.saveData,
    type: connection.type
  } : null;
  
  // Battery info (can help identify device)
  let batteryInfo = null;
  try {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      batteryInfo = {
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };
    }
  } catch (e) {
    // Battery API might be restricted
  }
  
  return {
    ...basicInfo,
    hardwareMAC,
    webRTCInfo,
    networkInfo,
    batteryInfo,
    
    // VPN detection hints
    vpnDetection: {
      timezoneMatchesLocale: checkTimezoneLocaleMatch(),
      webRTCLeaked: webRTCInfo.leaked,
      proxyHeaders: detectProxyHeaders(),
      dnsLeaks: checkDNSLeaks()
    },
    
    // Enhanced fingerprinting
    audioContext: getAudioFingerprint(),
    webglHash: getWebGLHash(),
    fontHash: getFontHash(),
    
    // Timestamp with high precision
    timestamp: new Date().toISOString(),
    timestampPrecise: performance.now()
  };
}

/**
 * Check if timezone matches locale (VPN detection)
 */
function checkTimezoneLocaleMatch(): boolean {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = navigator.language;
  
  // Simple check - can be enhanced
  const timezoneCountry = timezone.split('/')[0].toLowerCase();
  const localeCountry = locale.split('-')[1]?.toLowerCase();
  
  return !localeCountry || timezoneCountry.includes(localeCountry);
}

/**
 * Detect proxy headers (limited in browser)
 */
function detectProxyHeaders(): any {
  return {
    doNotTrack: navigator.doNotTrack,
    plugins: navigator.plugins.length,
    mimeTypes: navigator.mimeTypes.length
  };
}

/**
 * Check for DNS leaks (limited in browser)
 */
function checkDNSLeaks(): boolean {
  // In browser context, we can only check for certain patterns
  const suspiciousTimezone = new Date().getTimezoneOffset() === 0; // UTC timezone often used by VPNs
  const suspiciousLanguage = !navigator.language.includes('-'); // Generic language without region
  
  return suspiciousTimezone || suspiciousLanguage;
}

/**
 * Get audio fingerprint
 */
function getAudioFingerprint(): string {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return 'not available';
    
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gain = context.createGain();
    const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
    
    gain.gain.value = 0; // Mute
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gain);
    gain.connect(context.destination);
    
    oscillator.start(0);
    
    let fingerprint = '';
    scriptProcessor.onaudioprocess = function(event) {
      const output = event.outputBuffer.getChannelData(0);
      fingerprint = output.slice(0, 30).toString();
      
      oscillator.disconnect();
      analyser.disconnect();
      scriptProcessor.disconnect();
      gain.disconnect();
      
      // Clean up
      context.close();
    };
    
    return fingerprint.slice(0, 30);
  } catch (e) {
    return 'not available';
  }
}

/**
 * Get WebGL hash
 */
function getWebGLHash(): string {
  const vendor = getWebGLVendor();
  const renderer = getWebGLRenderer();
  
  if (vendor === 'not available' || renderer === 'not available') {
    return 'not available';
  }
  
  // Simple hash of vendor + renderer
  let hash = 0;
  const str = vendor + renderer;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Get font hash
 */
function getFontHash(): string {
  const fonts = getInstalledFonts();
  
  if (fonts === 'not available') {
    return 'not available';
  }
  
  // Simple hash of installed fonts
  let hash = 0;
  for (let i = 0; i < fonts.length; i++) {
    const char = fonts.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}