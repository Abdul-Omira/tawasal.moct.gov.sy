import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

// Define an interface for the component props
interface ClickCaptchaProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

// Define the structure for verification options
interface VerificationOption {
  id: string;
  label: string;
  isHuman: boolean;
  hint?: string;
  style?: React.CSSProperties;
}

// More challenging verification options that require human understanding
const verificationOptions: VerificationOption[] = [
  { 
    id: "math1", 
    label: "٤ + ٣ = ٧", 
    isHuman: true,
    hint: "اختر المعادلة الصحيحة"
  },
  { 
    id: "wrong_math1", 
    label: "٢ × ٣ = ٧", 
    isHuman: false,
    hint: "اختر المعادلة الصحيحة" 
  },
  { 
    id: "color1", 
    label: "اللون الأحمر", 
    style: { color: "red", borderColor: "red" },
    isHuman: true,
    hint: "اختر النص ذو اللون المناسب" 
  },
  { 
    id: "wrong_color1", 
    label: "اللون الأزرق", 
    style: { color: "green", borderColor: "green" },
    isHuman: false,
    hint: "اختر النص ذو اللون المناسب"
  },
  { 
    id: "emoji1", 
    label: "😊 ابتسامة", 
    isHuman: true,
    hint: "اختر الوصف الصحيح للرمز"
  },
  { 
    id: "wrong_emoji1", 
    label: "😊 حزين", 
    isHuman: false,
    hint: "اختر الوصف الصحيح للرمز"
  },
  { 
    id: "proverb1", 
    label: "العقل السليم في الجسم السليم", 
    isHuman: true,
    hint: "اختر المثل الصحيح"
  },
  { 
    id: "wrong_proverb1", 
    label: "العقل السليم في المال الوفير", 
    isHuman: false,
    hint: "اختر المثل الصحيح"
  }
];

/**
 * A more challenging Arabic CAPTCHA component with click verification
 * Uses visual and logical challenges that are harder for bots to solve
 */
export const ClickCaptcha: React.FC<ClickCaptchaProps> = ({
  value,
  onChange,
  error
}) => {
  const [options, setOptions] = useState<VerificationOption[]>([]);
  const [verified, setVerified] = useState(false);
  const [hint, setHint] = useState<string>("");
  const [attempts, setAttempts] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [mouseMovements, setMouseMovements] = useState(0);
  const [behaviorScore, setBehaviorScore] = useState(0);
  
  // Behavioral tracking for bot detection
  useEffect(() => {
    let movementCount = 0;
    const handleMouseMove = () => {
      movementCount++;
      setMouseMovements(movementCount);
    };
    
    // Track human-like behavior
    const interval = setInterval(() => {
      const timeSpent = (Date.now() - startTime) / 1000;
      let score = 0;
      
      // Natural mouse movement (humans move mouse naturally)
      if (movementCount > 3 && timeSpent > 2) score += 30;
      
      // Reasonable time spent (not too fast)
      if (timeSpent > 1.5 && timeSpent < 30) score += 25;
      
      // Multiple attempts suggest human (bots usually get it right first time)
      if (attempts > 0 && attempts < 4) score += 20;
      
      // Page focus (humans typically have page in focus)
      if (!document.hidden) score += 25;
      
      setBehaviorScore(Math.min(100, score));
    }, 1000);
    
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, [startTime, attempts]);
  
  // Generate random options on mount
  useEffect(() => {
    generateOptions();
  }, []);
  
  // Function to generate random challenge with paired options
  const generateOptions = () => {
    // Group options by their hint type to create pairs of correct/incorrect options
    const optionGroups: {[key: string]: VerificationOption[]} = {};
    verificationOptions.forEach(option => {
      if (!optionGroups[option.hint!]) {
        optionGroups[option.hint!] = [];
      }
      optionGroups[option.hint!].push(option);
    });
    
    // Select a random challenge type (hint)
    const challengeTypes = Object.keys(optionGroups);
    const selectedHint = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    setHint(selectedHint);
    
    // Get the options for this challenge type
    const optionsForHint = optionGroups[selectedHint];
    
    // Add at least one correct option and one or two incorrect options
    let selected: VerificationOption[] = [];
    const correctOptions = optionsForHint.filter(o => o.isHuman);
    const incorrectOptions = optionsForHint.filter(o => !o.isHuman);
    
    // Add a correct option
    selected.push(correctOptions[Math.floor(Math.random() * correctOptions.length)]);
    
    // Add an incorrect option
    selected.push(incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)]);
    
    // Optionally add a second incorrect option (33% chance)
    if (Math.random() > 0.33) {
      const remainingIncorrect = incorrectOptions.filter(o => 
        !selected.some(sel => sel.id === o.id)
      );
      if (remainingIncorrect.length > 0) {
        selected.push(remainingIncorrect[Math.floor(Math.random() * remainingIncorrect.length)]);
      }
    }
    
    // Shuffle for final order
    setOptions(selected.sort(() => 0.5 - Math.random()));
  };
  
  // Handle option selection with behavioral validation
  const handleOptionClick = (option: VerificationOption) => {
    const timeSpent = (Date.now() - startTime) / 1000;
    
    // Check for suspicious behavior
    const isSuspicious = timeSpent < 0.8 || // Too fast
                        mouseMovements < 2 || // No mouse movement
                        behaviorScore < 30; // Low behavior score
    
    if (option.isHuman && !isSuspicious) {
      setVerified(true);
      onChange("verified");
    } else {
      setVerified(false);
      onChange("");
      setAttempts(prev => prev + 1);
      
      // If too many attempts or suspicious behavior, make it harder
      if (attempts >= 2 || isSuspicious) {
        // Add delay to slow down bots
        setTimeout(() => {
          generateOptions();
        }, 1500);
      } else {
        generateOptions();
      }
    }
  };
  
  return (
    <div className="mt-4">
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="pt-4">
          <div className="space-y-3">
            <Label className="font-qomra text-gray-700 font-medium">تحقق الأمان</Label>
            <p className="text-sm text-gray-600 font-qomra">
              {hint}:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {options.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionClick(option)}
                  className={`h-14 relative font-qomra font-medium transition-all duration-300 border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground ${
                    verified && option.isHuman 
                      ? 'bg-green-50 border-green-500 text-green-700 shadow-lg' 
                      : 'bg-white border-gray-300 text-gray-800 hover:border-yellow-500 hover:bg-yellow-50 hover:text-yellow-700 hover:shadow-lg active:scale-95 hover:transform hover:-translate-y-1'
                  }`}
                  style={option.style && !verified ? {
                    ...option.style,
                    borderColor: option.style.color,
                    backgroundColor: 'white'
                  } : option.style}
                  disabled={verified}
                >
                  {option.label}
                  {verified && option.isHuman && (
                    <CheckCircle2 className="h-5 w-5 absolute top-2 right-2 text-green-600" />
                  )}
                </Button>
              ))}
            </div>
            
            {verified && (
              <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-lg shadow-md">
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <div className="bg-green-500 rounded-full p-1">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-lg font-bold text-yellow-800 font-qomra">
                    تم التحقق بنجاح!
                  </p>
                </div>
                <p className="text-sm text-yellow-700 font-qomra text-center mt-2">
                  يمكنك الآن المتابعة لإرسال الرسالة
                </p>
              </div>
            )}
            
            {error && <p className="text-sm text-destructive mt-1 font-qomra bg-red-50 p-2 rounded-md">{error}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClickCaptcha;