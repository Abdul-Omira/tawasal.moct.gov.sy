import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { OptimizedFancyCalligraphyAnimation } from './OptimizedCalligraphyAnimation';

interface WelcomeScreenProps {
  onComplete?: () => void;
  duration?: number; // Duration in seconds
}

export const WelcomeScreenOptimized: React.FC<WelcomeScreenProps> = ({ 
  onComplete,
  duration = 4 // Default duration: 4 seconds
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  
  // Detect mobile devices for performance optimization
  const isMobile = useMemo(() => {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth < 768;
  }, []);

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

  // Simplified variants for mobile performance
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: prefersReducedMotion ? 0.3 : 0.8,
        when: "beforeChildren",
        staggerChildren: prefersReducedMotion ? 0.1 : 0.2
      }
    },
    exit: { 
      opacity: 0,
      transition: { 
        duration: 0.3,
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  // Optimized emblem variants - reduced complexity for mobile
  const emblemVariants = {
    initial: { scale: 0.5, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: prefersReducedMotion ? 0.5 : 1,
        type: prefersReducedMotion ? "tween" : "spring",
        stiffness: 100,
        damping: 15
      }
    },
    exit: { 
      scale: 0.8, 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  // Simplified text variants
  const textVariants = {
    initial: { y: 10, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        duration: prefersReducedMotion ? 0.3 : 0.6,
        type: prefersReducedMotion ? "tween" : "spring",
        damping: 20
      }
    },
    exit: { 
      y: -5, 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  // Simplified decorative variants
  const decorVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: isMobile ? 0.4 : 0.7, // Reduce opacity on mobile for better performance
      transition: { 
        duration: prefersReducedMotion ? 0.3 : 0.8,
        delay: prefersReducedMotion ? 0.1 : 0.3
      }
    },
    exit: { 
      scale: 1.1, 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  // Optimized SVG component with reduced animations for mobile
  const OptimizedSyrianLogo = useMemo(() => (
    <motion.svg
      width={isMobile ? "320" : "480"}
      height={isMobile ? "320" : "480"}
      viewBox="0 0 512 512"
      className="relative z-10 drop-shadow-lg"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>
          {`.cls-1 {
            fill: #d9c89e;
          }`}
        </style>
      </defs>
      {/* Main eagle body - static for better performance */}
      <path 
        className="cls-1" 
        d="M256,178.59c-103.32,0-187.22,83.9-187.22,187.22S152.68,553,256,553s187.22-83.9,187.22-187.22S359.32,178.59,256,178.59Z"
      />
      
      {/* Stars with simplified animations - only animate on desktop */}
      <motion.polygon 
        className="cls-1" 
        points="246.39 155.65 256 148.64 265.62 155.65 261.95 144.32 271.56 137.31 259.68 137.31 256 125.98 252.33 137.31 240.44 137.31 250.06 144.32 246.39 155.65"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1,
          opacity: 1
        }}
        transition={{ 
          duration: prefersReducedMotion ? 0.3 : 1,
          delay: prefersReducedMotion ? 0.1 : 0.8
        }}
      />
      
      <motion.polygon 
        className="cls-1" 
        points="294.44 155.93 300.6 166.12 301.59 154.25 313.16 151.51 302.21 146.91 303.2 135.03 295.44 144.06 284.47 139.45 290.63 149.64 282.87 158.66 294.44 155.93"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1,
          opacity: 1
        }}
        transition={{ 
          duration: prefersReducedMotion ? 0.3 : 1,
          delay: prefersReducedMotion ? 0.15 : 1
        }}
      />
      
      <motion.polygon 
        className="cls-1" 
        points="210.42 154.26 211.3 166.14 217.55 156.01 229.1 158.86 221.42 149.76 227.68 139.63 216.68 144.13 209 135.03 209.87 146.91 198.87 151.42 210.42 154.26"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1,
          opacity: 1
        }}
        transition={{ 
          duration: prefersReducedMotion ? 0.3 : 1,
          delay: prefersReducedMotion ? 0.2 : 1.2
        }}
      />
    </motion.svg>
  ), [isMobile, prefersReducedMotion]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex flex-col items-center justify-center z-50 overflow-hidden"
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {/* Optimized Syrian Emblem */}
          <motion.div
            className="mb-8 relative"
            variants={emblemVariants}
          >
            {/* Simplified glow effects - only on desktop for performance */}
            {!isMobile && !prefersReducedMotion && (
              <>
                <motion.div
                  className="absolute inset-0 blur-2xl rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(217, 200, 158, 0.3) 0%, rgba(173, 158, 110, 0.15) 50%, transparent 100%)'
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="absolute inset-0 blur-xl rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(0, 89, 79, 0.2) 0%, rgba(0, 77, 66, 0.1) 50%, transparent 100%)'
                  }}
                  animate={{
                    scale: [1.1, 0.9, 1.1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </>
            )}
            
            {OptimizedSyrianLogo}
          </motion.div>

          {/* Simplified decorative patterns - mobile-optimized */}
          {!isMobile && (
            <>
              <motion.div
                variants={decorVariants}
                className="absolute top-16 left-1/2 transform -translate-x-1/2 w-48 md:w-72 h-6 md:h-8 opacity-40"
              >
                <svg viewBox="0 0 400 50" className="w-full h-full">
                  <path
                    d="M0,25 Q100,15 200,25 Q300,35 400,25"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <circle cx="200" cy="25" r="3" fill="#fff" opacity="0.7" />
                </svg>
              </motion.div>
              
              <motion.div
                variants={decorVariants}
                className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-48 md:w-72 h-6 md:h-8 opacity-40"
              >
                <svg viewBox="0 0 400 50" className="w-full h-full">
                  <path
                    d="M0,25 Q100,15 200,25 Q300,35 400,25"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                </svg>
              </motion.div>
            </>
          )}

          {/* Main Calligraphy Text - optimized */}
          <motion.div variants={textVariants} className="text-center px-4">
            <h1 className="font-ibm text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-4 sm:mb-6 leading-tight">
              <OptimizedFancyCalligraphyAnimation 
                text="وزارة الاتصالات" 
                delay={prefersReducedMotion ? 0.1 : 0.8}
                duration={prefersReducedMotion ? 0.02 : 0.08}
                className="block"
              />
              <OptimizedFancyCalligraphyAnimation 
                text="وتقانة المعلومات" 
                delay={prefersReducedMotion ? 0.2 : 1.6}
                duration={prefersReducedMotion ? 0.02 : 0.1}
                className="block mt-1 sm:mt-2"
              />
            </h1>
            <div className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 font-light mt-4 sm:mt-6">
              <OptimizedFancyCalligraphyAnimation 
                text="منصة التواصل المباشر مع الوزير" 
                delay={prefersReducedMotion ? 0.3 : 2.4}
                duration={prefersReducedMotion ? 0.01 : 0.04}
                as="span"
              />
            </div>
          </motion.div>

          {/* Optimized Loading Indicator */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ 
              width: isMobile ? "250px" : "300px", 
              opacity: 1,
              transition: { 
                width: { duration: duration - 0.5, ease: "linear" },
                opacity: { duration: 0.3 }
              } 
            }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 h-2 md:h-3 bg-white/20 rounded-full overflow-hidden mt-8"
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ 
                x: "0%",
                transition: { duration: duration - 0.5, ease: "easeOut" }
              }}
              className="h-full w-full rounded-full"
              style={{
                background: 'linear-gradient(to right, #d9c89e 0%, #ad9e6e 50%, #d9c89e 100%)'
              }}
            />
            {/* Simplified shimmer effect - only on desktop */}
            {!isMobile && !prefersReducedMotion && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ["-100%", "200%"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeScreenOptimized; 