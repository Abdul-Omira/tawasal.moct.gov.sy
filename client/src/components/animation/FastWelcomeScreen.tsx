import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeScreenProps {
  onComplete?: () => void;
  duration?: number; // Duration in seconds
}

export const FastWelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onComplete,
  duration = 3 // Reduced duration for faster loading
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Set a timeout to hide the welcome screen after the specified duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, duration * 1000);

    // Clean up the timer on component unmount
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex flex-col items-center justify-center z-50 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Ultra-simplified Syrian Emblem */}
          <motion.div
            className="mb-8 relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Static SVG - no animations for maximum performance */}
            <svg
              width="240"
              height="240"
              viewBox="0 0 512 512"
              className="relative z-10 drop-shadow-lg"
              xmlns="http://www.w3.org/2000/svg"
            >
              <style>
                {`.cls-1 { fill: #d9c89e; }`}
              </style>
              
              {/* Main eagle body - simplified path */}
              <circle cx="256" cy="256" r="120" className="cls-1" />
              
              {/* Simplified stars */}
              <polygon 
                className="cls-1" 
                points="256,200 266,220 246,220"
              />
              <polygon 
                className="cls-1" 
                points="300,230 310,250 290,250"
              />
              <polygon 
                className="cls-1" 
                points="212,230 222,250 202,250"
              />
            </svg>
          </motion.div>

          {/* Static Text - no animations */}
          <div className="text-center px-4">
            <motion.h1 
              className="font-ibm text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-4 sm:mb-6 leading-tight"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="block">وزارة الاتصالات</div>
              <div className="block mt-1 sm:mt-2">وتقانة المعلومات</div>
            </motion.h1>
            <motion.div 
              className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 font-light mt-4 sm:mt-6"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              منصة التواصل المباشر مع الوزير
            </motion.div>
          </div>

          {/* Simple Loading Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(to right, #d9c89e 0%, #ad9e6e 50%, #d9c89e 100%)'
                }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: duration - 0.5, ease: "linear" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FastWelcomeScreen; 