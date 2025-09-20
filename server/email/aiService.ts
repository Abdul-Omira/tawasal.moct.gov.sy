/**
 * 🤖 Syrian Ministry AI Service
 * Local AI Integration with Llama 3.1/3.2 Models
 */

import { Ollama } from 'ollama';
import type { CitizenCommunication } from '@shared/schema';

// AI Configuration
const AI_CONFIG = {
  OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://localhost:11434',
  PRIMARY_MODEL: process.env.AI_MODEL || 'llama3.2:latest',
  FALLBACK_MODEL: process.env.AI_FALLBACK_MODEL || 'llama3.1:8b',
  MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS || '2048'),
  TEMPERATURE: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  TIMEOUT: parseInt(process.env.AI_TIMEOUT || '30000'),
};

// Initialize Ollama client
let ollama: Ollama;
let isInitialized = false;

// AI Response Types
export interface AIResponse {
  success: boolean;
  response?: string;
  model?: string;
  tokens?: number;
  processingTime?: number;
  error?: string;
}

export interface AIAnalysis {
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  recommendations: string[];
  confidence: number;
}

// Initialize AI Service
export const initializeAIService = async (): Promise<boolean> => {
  try {
    console.log('🤖 [AI-INIT] Initializing Syrian Ministry AI Service...');
    console.log(`🤖 [AI-INIT] Ollama Host: ${AI_CONFIG.OLLAMA_HOST}`);

    ollama = new Ollama({ 
      host: AI_CONFIG.OLLAMA_HOST,
    });

    // Test connection
    const models = await ollama.list();
    console.log(`🤖 [AI-INIT] Available models: ${models.models.map(m => m.name).join(', ')}`);

    // Check if primary model exists
    const primaryModelExists = models.models.some(m => m.name === AI_CONFIG.PRIMARY_MODEL);
    if (!primaryModelExists) {
      console.warn(`⚠️ [AI-INIT] Primary model ${AI_CONFIG.PRIMARY_MODEL} not found`);
      const fallbackModelExists = models.models.some(m => m.name === AI_CONFIG.FALLBACK_MODEL);
      if (fallbackModelExists) {
        console.log(`🤖 [AI-INIT] Using fallback model: ${AI_CONFIG.FALLBACK_MODEL}`);
        AI_CONFIG.PRIMARY_MODEL = AI_CONFIG.FALLBACK_MODEL;
      } else {
        console.error('❌ [AI-INIT] No suitable AI models found');
        return false;
      }
    }

    // Test model response
    const testResponse = await ollama.generate({
      model: AI_CONFIG.PRIMARY_MODEL,
      prompt: 'مرحبا، أنا نظام ذكي للوزارة السورية. قل مرحبا فقط.',
      options: { temperature: 0.1 }
    });

    if (testResponse.response) {
      console.log('✅ [AI-INIT] AI model test successful');
      isInitialized = true;
      return true;
    } else {
      console.error('❌ [AI-INIT] AI model test failed');
      return false;
    }

  } catch (error) {
    console.error('❌ [AI-INIT] Failed to initialize AI service:', error);
    return false;
  }
};

// Analyze citizen communication
export const analyzeCommunication = async (communication: CitizenCommunication): Promise<AIAnalysis | null> => {
  if (!isInitialized) {
    console.warn('⚠️ [AI-ANALYZE] AI service not initialized');
    return null;
  }

  try {
    console.log(`🤖 [AI-ANALYZE] Analyzing communication #${communication.id}`);
    
    const analysisPrompt = `
أنت محلل ذكي للرسائل الحكومية في وزارة الاتصالات السورية. قم بتحليل الرسالة التالية:

الموضوع: ${communication.subject}
الرسالة: ${communication.message}
نوع التواصل: ${communication.communicationType}

قم بتقديم تحليل يتضمن:
1. ملخص مختصر
2. تقييم المشاعر (positive/negative/neutral)
3. مستوى الأولوية (low/medium/high/critical)
4. التصنيف
5. توصيات للرد
6. مستوى الثقة (0-100%)

قدم الإجابة بصيغة JSON:
{
  "summary": "الملخص هنا",
  "sentiment": "positive/negative/neutral",
  "urgency": "low/medium/high/critical",
  "category": "التصنيف هنا",
  "recommendations": ["توصية 1", "توصية 2", "توصية 3"],
  "confidence": 85
}
`;

    const response = await ollama.generate({
      model: AI_CONFIG.PRIMARY_MODEL,
      prompt: analysisPrompt,
      options: {
        temperature: AI_CONFIG.TEMPERATURE,
        num_predict: AI_CONFIG.MAX_TOKENS,
      }
    });

    try {
      const cleanResponse = response.response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const analysis = JSON.parse(cleanResponse);
      
      return {
        summary: analysis.summary || 'تحليل غير متوفر',
        sentiment: ['positive', 'negative', 'neutral'].includes(analysis.sentiment) 
          ? analysis.sentiment : 'neutral',
        urgency: ['low', 'medium', 'high', 'critical'].includes(analysis.urgency) 
          ? analysis.urgency : 'medium',
        category: analysis.category || 'استفسار عام',
        recommendations: Array.isArray(analysis.recommendations) 
          ? analysis.recommendations.slice(0, 5) : ['مراجعة الطلب', 'التواصل مع المواطن', 'توثيق الرد'],
        confidence: Math.min(100, Math.max(0, analysis.confidence || 70))
      };

    } catch (parseError) {
      console.warn('⚠️ [AI-ANALYZE] Failed to parse JSON, using fallback');
      const response_text = response.response.toLowerCase();
      
      return {
        summary: response.response.substring(0, 200) + '...',
        sentiment: response_text.includes('سلبي') || response_text.includes('شكوى') ? 'negative' :
                  response_text.includes('إيجابي') || response_text.includes('شكر') ? 'positive' : 'neutral',
        urgency: response_text.includes('عاجل') || response_text.includes('عالي') ? 'high' :
                response_text.includes('منخفض') ? 'low' : 'medium',
        category: communication.communicationType || 'استفسار عام',
        recommendations: ['مراجعة دقيقة للطلب', 'التواصل مع المواطن', 'توثيق الرد المناسب'],
        confidence: 60
      };
    }

  } catch (error) {
    console.error('❌ [AI-ANALYZE] Analysis failed:', error);
    return null;
  }
};

// Generate response suggestions
export const generateResponseSuggestions = async (
  communication: CitizenCommunication,
  context?: string
): Promise<string[]> => {
  if (!isInitialized) {
    return ['عذراً، النظام الذكي غير متوفر حالياً. سيتم الرد على استفساركم قريباً.'];
  }

  try {
    const suggestionPrompt = `
أنت موظف خدمة عملاء محترف في وزارة الاتصالات السورية.

رسالة المواطن:
الموضوع: ${communication.subject}
المحتوى: ${communication.message}

اكتب 3 اقتراحات للرد بلهجة رسمية ومهذبة:

1. رد مختصر ومباشر
2. رد تفصيلي مع شرح  
3. رد يطلب معلومات إضافية

كل رد يجب أن يبدأ بتحية وينتهي بتوقيع رسمي.
قدم كل اقتراح في سطر منفصل مع رقمه.
`;

    const response = await ollama.generate({
      model: AI_CONFIG.PRIMARY_MODEL,
      prompt: suggestionPrompt,
      options: {
        temperature: 0.8,
        num_predict: AI_CONFIG.MAX_TOKENS,
      }
    });

    const suggestions = response.response
      .split(/\d+\.\s+/)
      .filter(suggestion => suggestion.trim().length > 50)
      .map(suggestion => suggestion.trim())
      .slice(0, 3);

    if (suggestions.length === 0) {
      return [
        'تحية طيبة، شكراً لتواصلكم مع وزارة الاتصالات. سيتم دراسة طلبكم والرد عليكم قريباً. مع فائق الاحترام، وزارة الاتصالات وتقانة المعلومات.',
        'السلام عليكم، نشكركم على ثقتكم بوزارة الاتصالات. تم استلام رسالتكم وسيتم مراجعتها من الفريق المختص. وتقبلوا فائق الاحترام.',
        'تحية طيبة، تم تسجيل طلبكم وسيتم التواصل معكم لاستكمال البيانات إذا لزم الأمر. شكراً لتعاونكم، وزارة الاتصالات وتقانة المعلومات.'
      ];
    }

    return suggestions;

  } catch (error) {
    console.error('❌ [AI-SUGGEST] Failed to generate suggestions:', error);
    return ['عذراً، حدث خطأ في النظام الذكي. سيتم الرد على استفساركم بواسطة فريق الدعم قريباً.'];
  }
};

// Get AI service status
export const getAIStatus = async () => {
  try {
    const models = ollama ? await ollama.list() : { models: [] };
    
    return {
      initialized: isInitialized,
      model: AI_CONFIG.PRIMARY_MODEL,
      host: AI_CONFIG.OLLAMA_HOST,
      modelsAvailable: models.models.map(m => m.name),
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      initialized: false,
      model: AI_CONFIG.PRIMARY_MODEL,
      host: AI_CONFIG.OLLAMA_HOST,
      modelsAvailable: [],
      lastCheck: new Date().toISOString()
    };
  }
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    if (!isInitialized || !ollama) {
      return false;
    }

    const testResponse = await ollama.generate({
      model: AI_CONFIG.PRIMARY_MODEL,
      prompt: 'اختبار',
      options: { temperature: 0.1, num_predict: 10 }
    });

    return testResponse.response !== undefined;
  } catch (error) {
    console.error('❌ [AI-HEALTH] Health check failed:', error);
    return false;
  }
};

// AI Chat interface
export const aiChat = async (message: string, context?: string): Promise<AIResponse> => {
  if (!isInitialized) {
    return {
      success: false,
      error: 'AI service not initialized'
    };
  }

  try {
    const startTime = Date.now();
    
    const chatPrompt = `
أنت مساعد ذكي لوزارة الاتصالات وتقانة المعلومات السورية.
${context ? `السياق: ${context}` : ''}

المستخدم: ${message}

أجب بطريقة مفيدة ومهنية باللغة العربية:
`;

    const response = await ollama.generate({
      model: AI_CONFIG.PRIMARY_MODEL,
      prompt: chatPrompt,
      options: {
        temperature: AI_CONFIG.TEMPERATURE,
        num_predict: AI_CONFIG.MAX_TOKENS,
      }
    });

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      response: response.response,
      model: AI_CONFIG.PRIMARY_MODEL,
      tokens: response.response.length,
      processingTime
    };

  } catch (error) {
    console.error('❌ [AI-CHAT] Chat failed:', error);
    return {
      success: false,
      error: 'Failed to process AI chat request'
    };
  }
}; 