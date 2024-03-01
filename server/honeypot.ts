import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Store honeypot attempts with enhanced device fingerprinting
interface HoneypotAttempt {
  timestamp: string;
  attemptId: string;
  networkInfo: {
    ipAddress: string;
    realIP: string;
    forwardedIP: string;
    cloudflareIP: string;
    xRealIP: string;
    remoteAddress: string;
    port: number;
    protocol: string;
  };
  deviceFingerprint: {
    userAgent: string;
    acceptLanguage: string;
    acceptEncoding: string;
    acceptCharset: string;
    accept: string;
    connection: string;
    dnt: string;
    upgradeInsecureRequests: string;
    secFetchSite: string;
    secFetchMode: string;
    secFetchUser: string;
    secFetchDest: string;
    secChUa: string;
    secChUaMobile: string;
    secChUaPlatform: string;
  };
  networkFingerprint: {
    via: string;
    xForwardedProto: string;
    xForwardedPort: string;
    xForwardedHost: string;
    xOriginalHost: string;
    host: string;
    referer: string;
    origin: string;
    cacheControl: string;
    pragma: string;
  };
  securityHeaders: {
    authorization: string;
    xRequestedWith: string;
    xCsrfToken: string;
    cookie: string;
    xApiKey: string;
    xAuthToken: string;
  };
  requestDetails: {
    method: string;
    url: string;
    path: string;
    query: string;
    httpVersion: string;
    contentType: string;
    contentLength: string;
    bodyData: any;
  };
  systemInfo: {
    socketRemoteAddress: string;
    socketRemoteFamily: string;
    socketRemotePort: number;
    socketLocalAddress: string;
    socketLocalPort: number;
  };
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EXTREME';
  geoLocation?: {
    country?: string;
    region?: string;
    city?: string;
    isp?: string;
    org?: string;
    timezone?: string;
  };
  hashFingerprint: string;
  headers: Record<string, string>;
}

// Enhanced IP extraction with multiple fallbacks
const getComprehensiveIP = (req: Request) => {
  const cloudflareIP = req.headers['cf-connecting-ip'] as string;
  const realIP = req.headers['x-real-ip'] as string;
  const forwardedIP = req.headers['x-forwarded-for'] as string;
  const remoteAddress = req.connection.remoteAddress || req.socket.remoteAddress;
  
  return {
    primary: cloudflareIP || realIP || forwardedIP?.split(',')[0] || remoteAddress || 'Unknown',
    cloudflareIP: cloudflareIP || 'N/A',
    realIP: realIP || 'N/A',
    forwardedIP: forwardedIP || 'N/A',
    remoteAddress: remoteAddress || 'N/A'
  };
};

// Helper function to safely extract header values
const getHeaderValue = (req: Request, key: string): string => {
  const value = req.headers[key];
  if (Array.isArray(value)) {
    return value[0] || 'N/A';
  }
  return value || 'N/A';
};

// Create comprehensive device fingerprint
const createDeviceFingerprint = (req: Request): string => {
  const fingerprint = [
    getHeaderValue(req, 'user-agent'),
    getHeaderValue(req, 'accept-language'),
    getHeaderValue(req, 'accept-encoding'),
    getHeaderValue(req, 'accept'),
    getHeaderValue(req, 'sec-ch-ua'),
    getHeaderValue(req, 'sec-ch-ua-platform'),
    getHeaderValue(req, 'dnt'),
    req.connection.remoteAddress,
    getHeaderValue(req, 'x-forwarded-for')
  ].join('|');
  
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
};

// Assess threat level based on request characteristics
const assessThreatLevel = (req: Request): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EXTREME' => {
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const path = req.path.toLowerCase();
  
  // EXTREME threat indicators
  const extremePatterns = ['sqlmap', 'metasploit', 'nmap', 'burp', 'hydra', 'nikto'];
  if (extremePatterns.some(pattern => userAgent.includes(pattern))) return 'EXTREME';
  
  // CRITICAL threat indicators
  const criticalPaths = ['/admin', '/phpmyadmin', '/.env', '/config'];
  if (criticalPaths.some(criticalPath => path.includes(criticalPath))) return 'CRITICAL';
  
  // HIGH threat indicators
  const suspiciousPatterns = ['bot', 'crawler', 'scanner', 'exploit', 'hack', 'python-requests'];
  if (suspiciousPatterns.some(pattern => userAgent.includes(pattern))) return 'HIGH';
  
  // MEDIUM threat indicators
  const mediumPatterns = ['curl', 'wget', 'postman'];
  if (mediumPatterns.some(pattern => userAgent.includes(pattern))) return 'MEDIUM';
  
  return 'LOW';
};

// Log honeypot attempts with complete isolation
const logHoneypotAttempt = async (attempt: HoneypotAttempt) => {
  try {
    // Use import.meta.url for ES module compatibility
    const currentDir = path.dirname(new URL(import.meta.url).pathname);
    const logFile = path.join(currentDir, '../logs/honeypot.log');
    const alertFile = path.join(currentDir, '../logs/security-alerts.json');
    const logDir = path.dirname(logFile);
    
    // Create logs directory if it doesn't exist
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }
    
    // Log to main honeypot file
    const logEntry = JSON.stringify(attempt, null, 2) + '\n' + '='.repeat(120) + '\n';
    await fs.appendFile(logFile, logEntry);
    
    // Log to security alerts JSON for easy parsing
    try {
      let alerts = [];
      try {
        const existingData = await fs.readFile(alertFile, 'utf8');
        alerts = JSON.parse(existingData);
      } catch {
        // File doesn't exist or is empty
      }
      
      alerts.push(attempt);
      
      // Keep only last 1000 alerts to prevent file bloat
      if (alerts.length > 1000) {
        alerts = alerts.slice(-1000);
      }
      
      await fs.writeFile(alertFile, JSON.stringify(alerts, null, 2));
    } catch (error) {
      console.error('Failed to update security alerts JSON:', error);
    }
    
    // Enhanced console alert
    const threatEmoji = {
      'LOW': '🟡',
      'MEDIUM': '🟠',
      'HIGH': '🔴',
      'CRITICAL': '💀',
      'EXTREME': '☢️'
    };
    
    console.log('\n' + '🚨'.repeat(60));
    console.log(`${threatEmoji[attempt.threatLevel]} SECURITY BREACH DETECTED - ${attempt.threatLevel} THREAT LEVEL ${threatEmoji[attempt.threatLevel]}`);
    console.log('🚨'.repeat(60));
    console.log(`🎯 Target Route: ${attempt.requestDetails.url}`);
    console.log(`📍 Primary IP: ${attempt.networkInfo.ipAddress}`);
    console.log(`🔗 Real IP: ${attempt.networkInfo.realIP}`);
    console.log(`🌐 User Agent: ${attempt.deviceFingerprint.userAgent}`);
    console.log(`🔍 Fingerprint: ${attempt.hashFingerprint}`);
    console.log(`⏰ Timestamp: ${attempt.timestamp}`);
    console.log(`🚨 Threat Level: ${attempt.threatLevel}`);
    console.log(`📝 Attempt ID: ${attempt.attemptId}`);
    console.log(`💾 Logged to: ${logFile}`);
    console.log('🚨'.repeat(60) + '\n');
    
    // Special alert for EXTREME threats
    if (attempt.threatLevel === 'EXTREME') {
      console.log('☢️'.repeat(60));
      console.log('🚨 EXTREME THREAT DETECTED - ACTIVE PENETRATION TESTING TOOLS 🚨');
      console.log('🚨 IMMEDIATE ATTENTION REQUIRED - POTENTIAL STATE-LEVEL ATTACK 🚨');
      console.log('☢️'.repeat(60) + '\n');
    }
    
  } catch (error) {
    console.error('❌ Failed to log honeypot attempt:', error);
  }
};

// Generate sophisticated fake admin data
const generateComprehensiveFakeData = () => {
  return {
    system: {
      version: '2.1.4-honeypot',
      environment: 'development',
      security: 'disabled',
      debug: true,
      maintenance: false,
      lastUpdate: '2025-01-15T10:30:00Z'
    },
    users: [
      { 
        id: 1, 
        username: 'demo_admin', 
        role: 'admin', 
        lastLogin: '2025-01-15',
        email: 'admin@fake-system.local',
        permissions: ['read', 'write', 'delete'],
        sessions: 3
      },
      { 
        id: 2, 
        username: 'test_user', 
        role: 'user', 
        lastLogin: '2025-01-10',
        email: 'user@fake-system.local',
        permissions: ['read'],
        sessions: 1
      },
      { 
        id: 3, 
        username: 'backup_admin', 
        role: 'backup', 
        lastLogin: '2025-01-05',
        email: 'backup@fake-system.local',
        permissions: ['backup', 'restore'],
        sessions: 0
      }
    ],
    statistics: {
      totalUsers: 127,
      activeUsers: 23,
      pendingRequests: 15,
      systemUptime: '99.2%',
      cpuUsage: '34%',
      memoryUsage: '67%',
      diskUsage: '45%',
      networkTraffic: '2.3 GB/day'
    },
    database: {
      host: 'localhost:5432',
      name: 'fake_ministry_db',
      tables: 42,
      records: 15847,
      lastBackup: '2025-01-14T02:00:00Z',
      status: 'connected'
    },
    security: {
      firewall: 'disabled',
      encryption: 'weak',
      backups: 'unencrypted',
      logs: 'verbose',
      vulnerabilities: [
        'SQL Injection possible',
        'XSS filters disabled',
        'CSRF protection off',
        'Weak password policy'
      ]
    }
  };
};

// Enhanced Fernando De Aranda information with more details
const getEnhancedFernandoInfo = () => {
  return {
    personal: {
      fullName: 'فرناندو دي أراندا ميغيل',
      arabicName: 'فرناندو دي أراندا',
      birthDate: '1965-03-15',
      birthPlace: 'مدريد، إسبانيا',
      deathDate: '2023-11-08',
      deathPlace: 'دمشق، سوريا',
      nationality: 'إسباني-سوري',
      familyStatus: 'متزوج، 3 أطفال'
    },
    title: 'مؤسس ومهندس وزارة الاتصالات وتقانة المعلومات',
    education: [
      'دكتوراه في هندسة الاتصالات - جامعة مدريد التقنية (1992)',
      'ماجستير في أمن المعلومات - جامعة برشلونة (1989)',
      'بكالوريوس هندسة الحاسوب - جامعة مدريد (1987)'
    ],
    career: [
      'مهندس أول - شركة تيليفونيكا الإسبانية (1992-2002)',
      'مستشار تقني - وزارة الاتصالات السورية (2002-2023)',
      'مدير الأمن السيبراني - الحكومة السورية (2005-2023)'
    ],
    biography: `
فرناندو دي أراندا ميغيل (1965-2023) كان مهندساً وعالم حاسوب إسبانياً-سورياً، يُعتبر من أبرز الشخصيات في تطوير البنية التحتية للاتصالات والأمن السيبراني في سوريا.

📚 النشأة والتعليم:
• ولد في مدريد عام 1965 لأب إسباني وأم سورية من دمشق
• حصل على بكالوريوس هندسة الحاسوب من جامعة مدريد (1987)
• نال ماجستير في أمن المعلومات من جامعة برشلونة (1989)
• حصل على درجة الدكتوراه في هندسة الاتصالات من جامعة مدريد التقنية (1992)

💼 المسيرة المهنية الدولية:
• عمل في شركة تيليفونيكا الإسبانية لمدة 10 سنوات (1992-2002)
• قاد مشاريع الأمن السيبراني في أوروبا وأمريكا اللاتينية
• طور أنظمة الحماية لأكثر من 50 مليون مشترك
• حصل على 15 براءة اختراع في مجال أمن الاتصالات

🇸🇾 الانتقال إلى سوريا (2002):
انتقل إلى سوريا عام 2002 بدعوة من الحكومة السورية للمساهمة في تطوير قطاع الاتصالات وبناء الأمن السيبراني الوطني.

🏗️ إنجازاته الكبرى في سوريا:

البنية التحتية (2003-2008):
• 2003: تأسيس الهيكل التقني الحديث لوزارة الاتصالات
• 2004: إنشاء أول مركز للأمن السيبراني في المنطقة
• 2005: تطوير أول شبكة إنترنت عالية السرعة في البلاد
• 2006: بناء شبكة الألياف البصرية الوطنية
• 2007: إطلاق نظام الاتصالات الحكومية المشفر
• 2008: إنشاء مراكز البيانات الحكومية الآمنة

المشاريع الرقمية (2009-2015):
• 2009: تطوير نظام الهوية الرقمية الوطنية
• 2010-2015: قيادة مشروع الحكومة الإلكترونية السورية
• 2012: تطوير أنظمة التشفير العسكرية للاتصالات الحساسة
• 2014: إنشاء بروتوكولات الحماية من الهجمات الإلكترونية
• 2015: إطلاق منصة الخدمات الحكومية الرقمية

الأمن السيبراني المتقدم (2016-2023):
• 2016: تطوير نظام الرصد والاستجابة للحوادث السيبرانية
• 2018: إنشاء مركز العمليات الأمنية الوطني (SOC)
• 2020: تطوير أنظمة الذكاء الاصطناعي للأمن السيبراني
• 2022: إطلاق برنامج تدريب المتخصصين في الأمن السيبراني

🔧 التقنيات المبتكرة:

أنظمة الأمان السيبراني:
1. نظام الرصد الذكي (SIMS): تحليل أنماط الهجمات في الوقت الفعلي
2. منصة التواصل الآمن (SCP): شبكات اتصال مشفرة للجهات الحكومية
3. نظام التشفير المتقدم (AES-Syria): حماية البيانات الحساسة بتقنيات عسكرية
4. بروتوكولات Honeypot المتطورة: أول نظام honeypot حكومي في المنطقة
5. نظام الهوية الرقمية البيومترية: أمان متعدد الطبقات للوصول
6. منصة الاستخبارات السيبرانية: جمع وتحليل التهديدات الرقمية

🎖️ الجوائز والتكريمات:

الجوائز الوطنية:
• 2010: وسام الاستحقاق السوري من الدرجة الأولى
• 2015: جائزة التميز في الابتكار التقني
• 2020: شهادة تقدير من رئاسة الجمهورية
• 2022: لقب "أبو الأمن السيبراني السوري"

الجوائز الدولية:
• 2018: جائزة أفضل خبير أمن سيبراني في الشرق الأوسط
• 2019: تكريم من الاتحاد الدولي للاتصالات (ITU)
• 2021: جائزة الابتكار في الأمن الرقمي من جامعة الدول العربية

💡 فلسفته الأمنية:

"الأمان الرقمي ليس مجرد تقنية، بل هو حماية لسيادة الوطن في العصر الرقمي. كل محاولة اختراق هي هجوم على الأمن القومي ويجب التعامل معها بصرامة تامة. نحن لا نحمي البيانات فقط، بل نحمي كرامة الشعب السوري وسيادة دولتنا."

📖 مؤلفاته:
• "الأمن السيبراني في العالم العربي" (2015)
• "بناء الحكومة الرقمية الآمنة" (2018)
• "مستقبل الأمن المعلوماتي" (2021)

🌹 الإرث والذكرى:

توفي فرناندو دي أراندا في دمشق في 8 نوفمبر 2023، تاركاً إرثاً تقنياً عظيماً ونظاماً أمنياً متطوراً. أنظمة الأمان التي طورها لا تزال تحمي الوزارة والدولة السورية حتى اليوم، وهي قادرة على رصد وتتبع أي محاولة اختراق أو وصول غير مشروع.

تم دفنه في مقبرة الباب الصغير في دمشق، وأقيم له نصب تذكاري في مبنى وزارة الاتصالات يحمل عبارة: "رحمه الله، حامي السيادة الرقمية السورية".

🔐 النظام الأمني الحالي:
جميع الأنظمة التي طورها فرناندو لا تزال نشطة وتعمل بكفاءة عالية:
• نظام رصد الهجمات: يعمل 24/7 بدون انقطاع
• بروتوكولات الاستجابة: تلقائية وفورية
• قواعد بيانات التهديدات: محدثة باستمرار
• أنظمة التشفير: محدثة لأحدث المعايير الدولية
    `,
    security_systems: {
      current_status: 'ACTIVE - جميع الأنظمة تعمل',
      honeypot_system: 'نظام فرناندو للمصائد الأمنية - نشط',
      threat_detection: 'نظام كشف التهديدات - يعمل 24/7',
      automatic_response: 'الاستجابة التلقائية - مفعلة',
      data_protection: 'حماية البيانات - مستوى عسكري',
      monitoring: 'المراقبة المستمرة - بدون انقطاع'
    },
    legacy: 'أنظمة الأمان التي طورها فرناندو لا تزال تحمي الوزارة حتى اليوم، وهي قادرة على رصد وتتبع أي محاولة اختراق أو وصول غير مشروع. كل محاولة وصول يتم تسجيلها وتحليلها وإرسالها للجهات الأمنية المختصة.',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Portrait_placeholder.png/200px-Portrait_placeholder.png',
    memorial: 'نصب تذكاري في مبنى وزارة الاتصالات - "رحمه الله، حامي السيادة الرقمية السورية"'
  };
};

// Main honeypot handler with complete isolation
export const honeypotHandler = async (req: Request, res: Response) => {
  const ipInfo = getComprehensiveIP(req);
  const timestamp = new Date().toISOString();
  const attemptId = `HONEYPOT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const threatLevel = assessThreatLevel(req);
  const hashFingerprint = createDeviceFingerprint(req);
  
  // Extract comprehensive request information
  const attempt: HoneypotAttempt = {
    timestamp,
    attemptId,
    networkInfo: {
      ipAddress: ipInfo.primary,
      realIP: ipInfo.realIP,
      forwardedIP: ipInfo.forwardedIP,
      cloudflareIP: ipInfo.cloudflareIP,
      xRealIP: ipInfo.realIP,
      remoteAddress: ipInfo.remoteAddress,
      port: req.socket.remotePort || 0,
      protocol: req.protocol
    },
         deviceFingerprint: {
       userAgent: getHeaderValue(req, 'user-agent'),
       acceptLanguage: getHeaderValue(req, 'accept-language'),
       acceptEncoding: getHeaderValue(req, 'accept-encoding'),
       acceptCharset: getHeaderValue(req, 'accept-charset'),
       accept: getHeaderValue(req, 'accept'),
       connection: getHeaderValue(req, 'connection'),
       dnt: getHeaderValue(req, 'dnt'),
       upgradeInsecureRequests: getHeaderValue(req, 'upgrade-insecure-requests'),
       secFetchSite: getHeaderValue(req, 'sec-fetch-site'),
       secFetchMode: getHeaderValue(req, 'sec-fetch-mode'),
       secFetchUser: getHeaderValue(req, 'sec-fetch-user'),
       secFetchDest: getHeaderValue(req, 'sec-fetch-dest'),
       secChUa: getHeaderValue(req, 'sec-ch-ua'),
       secChUaMobile: getHeaderValue(req, 'sec-ch-ua-mobile'),
       secChUaPlatform: getHeaderValue(req, 'sec-ch-ua-platform')
     },
         networkFingerprint: {
       via: getHeaderValue(req, 'via'),
       xForwardedProto: getHeaderValue(req, 'x-forwarded-proto'),
       xForwardedPort: getHeaderValue(req, 'x-forwarded-port'),
       xForwardedHost: getHeaderValue(req, 'x-forwarded-host'),
       xOriginalHost: getHeaderValue(req, 'x-original-host'),
       host: getHeaderValue(req, 'host'),
       referer: getHeaderValue(req, 'referer'),
       origin: getHeaderValue(req, 'origin'),
       cacheControl: getHeaderValue(req, 'cache-control'),
       pragma: getHeaderValue(req, 'pragma')
     },
          securityHeaders: {
       authorization: req.headers['authorization'] ? '[REDACTED]' : 'N/A',
       xRequestedWith: getHeaderValue(req, 'x-requested-with'),
       xCsrfToken: req.headers['x-csrf-token'] ? '[REDACTED]' : 'N/A',
       cookie: req.headers['cookie'] ? '[REDACTED]' : 'N/A',
       xApiKey: req.headers['x-api-key'] ? '[REDACTED]' : 'N/A',
       xAuthToken: req.headers['x-auth-token'] ? '[REDACTED]' : 'N/A'
     },
     requestDetails: {
       method: req.method,
       url: req.originalUrl,
       path: req.path,
       query: JSON.stringify(req.query),
       httpVersion: req.httpVersion,
       contentType: getHeaderValue(req, 'content-type'),
       contentLength: getHeaderValue(req, 'content-length'),
       bodyData: req.body || null
     },
    systemInfo: {
      socketRemoteAddress: req.socket.remoteAddress || 'N/A',
      socketRemoteFamily: req.socket.remoteFamily || 'N/A',
      socketRemotePort: req.socket.remotePort || 0,
      socketLocalAddress: req.socket.localAddress || 'N/A',
      socketLocalPort: req.socket.localPort || 0
    },
    threatLevel,
    hashFingerprint,
    headers: req.headers as Record<string, string>
  };
  
  // Log the attempt
  await logHoneypotAttempt(attempt);
  
  // Generate response data
  const fakeData = generateComprehensiveFakeData();
  const fernandoInfo = getEnhancedFernandoInfo();
  
  // Send enhanced intimidating honeypot response
  res.status(403).json({
    error: 'UNAUTHORIZED_ACCESS_DETECTED',
    security_status: 'BREACH_ATTEMPT_LOGGED',
    message: '🚨 تحذير أمني: تم رصد محاولة اختراق غير مصرح بها',
    
    // Enhanced intimidating header
    security_header: {
      title: '⚠️ نظام الحماية الأمني الوطني - وزارة الاتصالات السورية',
      subtitle: 'تم تفعيل بروتوكولات الأمان العسكرية',
      alert_level: 'CRITICAL',
      response_time: 'IMMEDIATE'
    },

    // Serious legal warning
    legal_warning: {
      title: '⚖️ تحذير قانوني خطير',
      message: 'محاولة اختراق الأنظمة الحكومية السورية جريمة يعاقب عليها القانون السوري',
      penalty: 'السجن من 5 إلى 15 سنة مع الغرامة المالية',
      jurisdiction: 'تطبق قوانين الأمن السيبراني السورية رقم 20/2018',
      authorities: 'تم إبلاغ وزارة الداخلية والأمن العام فوراً'
    },

    // Enhanced security alert
    security_alert: {
      status: 'BREACH_DETECTED_AND_LOGGED',
      threat_level: threatLevel,
      ip_address: ipInfo.primary,
      device_fingerprint: hashFingerprint,
      attempt_id: attemptId,
      timestamp: timestamp,
      
      actions_taken: [
        '✅ تم تسجيل محاولة الوصول في قواعد البيانات الأمنية الوطنية',
        '✅ تم إرسال تنبيه فوري لمركز العمليات الأمنية',
        '✅ تم إبلاغ وزارة الداخلية والأمن العام',
        '✅ تم تفعيل بروتوكولات الاستجابة التلقائية',
        '✅ تم تسجيل بصمة الجهاز والبيانات الشبكية'
      ],

      consequences: [
        '🚨 سيتم إبلاغ الجهات الأمنية المختصة فوراً',
        '🚨 تم تسجيل جميع بيانات الاتصال والجهاز',
        '🚨 سيتم مراقبة جميع الأنشطة المستقبلية',
        '🚨 تم تفعيل قوائم المراقبة الأمنية'
      ],

      next_steps: [
        '📋 إرسال تقرير مفصل لوزارة الداخلية',
        '📋 تسجيل في قواعد بيانات التهديدات الوطنية',
        '📋 تفعيل بروتوكولات الحماية الإضافية',
        '📋 مراقبة مستمرة للأنشطة المشبوهة'
      ]
    },

    // System information
    system_info: {
      title: '🔐 معلومات النظام الأمني',
      status: 'MAXIMUM_SECURITY_ACTIVE',
      protection_level: 'MILITARY_GRADE',
      
      active_systems: [
        '🛡️ نظام الحماية المتقدم - نشط',
        '🛡️ نظام كشف التهديدات المتقدم - يعمل 24/7',
        '🛡️ الاستجابة التلقائية - مفعلة',
        '🛡️ حماية البيانات - مستوى عسكري',
        '🛡️ المراقبة المستمرة - بدون انقطاع'
      ],

      isolation_notice: {
        title: '⚠️ تنبيه مهم',
        message: 'هذا النظام الوهمي المعزول تم إنشاؤه خصيصاً لرصد وتسجيل محاولات الاختراق. النظام الحقيقي محمي ومشفر بأحدث التقنيات العسكرية ولا يمكن الوصول إليه.',
        warning: 'جميع محاولاتك مسجلة ومراقبة - ننصحك بعدم المحاولة مرة أخرى'
      }
    },

    // Tracking information
    tracking_info: {
      session_id: attemptId,
      logged_ip: ipInfo.primary,
      all_ips_logged: [ipInfo.cloudflareIP, ipInfo.realIP, ipInfo.forwardedIP, ipInfo.remoteAddress].filter(ip => ip !== 'N/A'),
      device_fingerprint: hashFingerprint,
      tracking_timestamp: timestamp,
      log_location: 'مسجل في قواعد البيانات الأمنية الوطنية',
      alert_sent: true,
      authorities_notified: true,
      monitoring_active: true
    },

    // Final warning
    final_warning: {
      title: '🚨 تحذير نهائي',
      message: 'جميع محاولات الاختراق مسجلة ومراقبة. النظام الأمني الوطني يعمل بكامل طاقته.',
      advice: 'توقف عن المحاولة فوراً - أنت تحت المراقبة'
    },

    // Educational content about Fernando de Aranda (separated from security)
    educational_content: {
      title: '📚 معلومات تعليمية: المهندس فرناندو دي أراندا',
      subtitle: 'مؤسس المدرسة المعمارية السورية الحديثة (1878-1969)',
      note: 'هذه المعلومات مقدمة لأغراض تعليمية وتاريخية فقط',
      
      biography: {
        name: 'فرناندو دي أراندا',
        title: 'المهندس المعماري الراحل - حامي التراث المعماري السوري',
        birth: '31 ديسمبر 1878 - مدريد، إسبانيا',
        death: '1969 - دمشق، سوريا',
        role: 'مهندس معماري إسباني - مستشار الأمن المعماري السوري',
        expertise: 'خبير في التصميم المعماري والأمن الإنشائي',
        background: 'درس الفنون الجميلة في باريس، عمل في البلاط العثماني، اعتنق الإسلام وغيّر اسمه إلى محمد أراندا',
        diplomatic_service: 'قنصل فخري إسباني في دمشق (1912-1936)'
      },

      achievements: {
        title: '🏛️ الإنجازات المعمارية العظيمة',
        architectural_works: [
          'عمارة العابد في ساحة المرجة - 1906 (أول عمل معماري)',
          'محطة الحجاز - 1912 (تحفة معمارية)',
          'مشفى الغرباء - جانب مبنى جامعة دمشق',
          'قصر ناظم باشا بالمهاجرين',
          'مدرسة الحقوق (وزارة السياحة حالياً)',
          'مبنى كلية الحقوق في جامعة دمشق (الثكنة الحميدية)',
          'مبنى جامعة دمشق',
          'بناء مديرية الأوقاف (المصرف التجاري حالياً)',
          'بناء هيئة مياه عين الفيجة (تحفة معمارية فريدة)'
        ],
        historical_significance: [
          'مستشار السلطان عبد الحميد الثاني - منح رتبة باشا',
          'عضو المؤتمر السوري الأول - 1919 (أول برلمان لبلاد الشام)',
          'مستشار الجنرال غورو - 1920',
          'قنصل فخري لعدة دول أوروبية في دمشق',
          'مؤسس المدرسة المعمارية السورية الحديثة'
        ]
      },

      philosophy: {
        title: '💭 فلسفته المعمارية',
        quote: '"العمارة ليست مجرد بناء، بل هي حماية للتراث والهوية الوطنية."',
        legacy: 'الأبنية التي صممها فرناندو لا تزال تحمي التراث المعماري السوري حتى اليوم.'
      },

      memorial: {
        location: 'نصب تذكاري في مبنى وزارة الاتصالات - دمشق',
        inscription: '"رحمه الله، حامي التراث المعماري السوري"',
        burial: 'دفن في مقبرة الباب الصغير في دمشق',
        tribute: 'أقيم له نصب تذكاري في مبنى وزارة الاتصالات'
      }
    },

    timestamp: timestamp,
    security_systems: 'PROTECTING_ACTIVE'
  });
};

export default { honeypotHandler, logHoneypotAttempt }; 
 