import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Shield, AlertTriangle } from 'lucide-react';
import ClickCaptcha from './click-captcha';

// Define an interface for the component props
interface AdaptiveCaptchaProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/**
 * An adaptive CAPTCHA component that uses heuristics to detect potential bot behavior
 * and adjusts difficulty accordingly.
 * 
 * This simulates ML-based detection by using client-side heuristics:
 * - Mouse movement patterns
 * - Input timing
 * - Browser fingerprinting signals
 */
export const AdaptiveCaptcha: React.FC<AdaptiveCaptchaProps> = ({
  value,
  onChange,
  error
}) => {
  const [riskScore, setRiskScore] = useState<number>(0);
  const [mouseMovements, setMouseMovements] = useState<number>(0);
  const [entryTime, setEntryTime] = useState<number>(Date.now());
  const [captchaMode, setCaptchaMode] = useState<'normal' | 'enhanced'>('normal');
  const [captchaShown, setCaptchaShown] = useState(false);
  
  // Track suspicious patterns
  useEffect(() => {
    // Start tracking when component mounts
    const startTime = Date.now();
    setEntryTime(startTime);
    let movementCount = 0;
    
    // Track mouse movements
    const handleMouseMove = () => {
      movementCount++;
      setMouseMovements(movementCount);
    };
    
    // Detect if touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Check for automation red flags
    const automationFlags = [
      // Check for headless browsers or chrome
      !(window as any).chrome,
      // Check for navigator inconsistencies 
      navigator.webdriver,
      // Check for plugins length (often zero in headless browsers)
      navigator.plugins.length === 0,
      // Check for suspicious languages
      navigator.languages && navigator.languages.length === 0,
    ].filter(Boolean).length;
    
    // Device info signals
    const deviceSignals = [
      // Suspicious if screen size is unusual or perfect dimensions
      (window.screen.width === 1920 && window.screen.height === 1080),
      // Suspicious if too few hardware concurrency
      navigator.hardwareConcurrency < 2,
      // Suspicious if no device memory info
      // @ts-ignore - deviceMemory is not in all browsers typings
      navigator.deviceMemory === undefined,
      // Touch support claims but no touch events
      isTouchDevice && movementCount > 30
    ].filter(Boolean).length;
    
    // Update risk score based on signals
    const updateRiskScore = () => {
      // Calculate time on page
      const timeOnPage = (Date.now() - startTime) / 1000; // in seconds
      
      // Behavior signals - too quick to interact is suspicious
      const behaviorSignals = [
        // Too few mouse movements
        movementCount < 2 && timeOnPage > 3,
        // Too quick to fill form (less than 2 seconds)
        timeOnPage < 2 && value.length > 0,
      ].filter(Boolean).length;
      
      // Calculate total risk score (0-100)
      const newRiskScore = Math.min(100, 
        (automationFlags * 25) + 
        (deviceSignals * 15) + 
        (behaviorSignals * 20)
      );
      
      setRiskScore(newRiskScore);
      
      // Set CAPTCHA mode based on risk score
      if (newRiskScore > 70) {
        setCaptchaMode('enhanced');
      } else {
        setCaptchaMode('normal');
      }
      
      // Show CAPTCHA if risk is moderate or high
      if (newRiskScore > 30 && !captchaShown) {
        setCaptchaShown(true);
      }
      
      // Auto-verify if risk score is low (user appears human)
      if (newRiskScore <= 30 && timeOnPage > 3 && movementCount > 5 && value !== 'verified') {
        onChange('verified');
      }
    };
    
    // Listen for mouse movement
    window.addEventListener('mousemove', handleMouseMove);
    
    // Update risk assessment every 2 seconds
    const interval = setInterval(updateRiskScore, 2000);
    
    // Initial assessment
    updateRiskScore();
    
    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, [value, captchaShown]);

  // Always show CAPTCHA regardless of risk score
  useEffect(() => {
    if (!captchaShown) {
      setCaptchaShown(true);
    }
  }, []);
  
  return (
    <div className="mt-4">
      <Card className={`${captchaMode === 'enhanced' ? 'border-yellow-400' : 'border-gray-300'} bg-white`}>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center">
                <Shield className="ml-2 h-4 w-4" />
                التحقق الأمني
              </Label>
              
              {captchaMode === 'enhanced' && (
                <div className="flex items-center text-yellow-600 text-xs font-medium">
                  <AlertTriangle className="ml-1 h-4 w-4" />
                  مستوى تحقق متقدم
                </div>
              )}
            </div>
            
            <ClickCaptcha 
              value={value}
              onChange={onChange}
              error={error}
            />
            
            {/* Debug info - remove in production */}
            {/* <div className="mt-2 text-xs text-gray-500">
              <div>Risk Score: {riskScore}/100</div>
              <div>Mouse Movements: {mouseMovements}</div>
              <div>Mode: {captchaMode}</div>
            </div> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdaptiveCaptcha;