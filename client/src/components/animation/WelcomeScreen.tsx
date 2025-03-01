import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FancyCalligraphyAnimation } from './NewCalligraphyAnimation';

interface WelcomeScreenProps {
  onComplete?: () => void;
  duration?: number; // Duration in seconds
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onComplete,
  duration = 4 // Default duration: 4 seconds
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

  // Variants for the container animation
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: 0.8,
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    },
    exit: { 
      opacity: 0,
      transition: { 
        duration: 0.5,
        when: "afterChildren",
        staggerChildren: 0.1,
        staggerDirection: -1
      }
    }
  };

  // Variants for the Syrian emblem animation - Enhanced
  const emblemVariants = {
    initial: { scale: 0.3, opacity: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      opacity: 1, 
      rotate: 0,
      transition: { 
        duration: 1.5,
        type: "spring",
        stiffness: 120,
        damping: 12,
        bounce: 0.6
      }
    },
    exit: { 
      scale: 0.5, 
      opacity: 0,
      rotate: 90,
      transition: { duration: 0.4 }
    }
  };

  // Variants for the calligraphy text animation
  const textVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        duration: 0.8,
        type: "spring",
        damping: 15
      }
    },
    exit: { 
      y: -10, 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  // Variants for the decorative elements
  const decorVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 0.7, 
      transition: { 
        duration: 1,
        delay: 0.5
      }
    },
    exit: { 
      scale: 1.2, 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

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
          {/* Syrian Emblem with enhanced effects */}
          <motion.div
            className="mb-8 relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Enhanced glow effect behind logo using Syrian colors */}
            <motion.div
              className="absolute inset-0 blur-3xl rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(217, 200, 158, 0.4) 0%, rgba(173, 158, 110, 0.2) 50%, transparent 100%)'
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute inset-0 blur-2xl rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(0, 89, 79, 0.3) 0%, rgba(0, 77, 66, 0.15) 50%, transparent 100%)'
              }}
              animate={{
                scale: [1.2, 0.8, 1.2],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            {/* Animated Syrian Logo with built-in star animations */}
            <motion.svg
              width="480"
              height="480"
              viewBox="0 0 512 512"
              className="relative z-10 drop-shadow-2xl"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <style>
                  {`.cls-1 {
                    fill: #d9c89e;
                  }`}
                </style>
              </defs>
              {/* Main eagle body */}
              <motion.path 
                className="cls-1" 
                d="M367.37,231.53c-.83.8-1.68,1.58-2.54,2.33l40.64,60.72-15.45-2.06c-5-.67-9.4-3.63-11.91-8.01l-24.25-42.36c-.96.62-1.94,1.23-2.93,1.8l38.89,70.8-15.46-3.12c-5.06-1.02-9.34-4.4-11.5-9.09l-24.25-52.5c-1.06.44-2.14.85-3.22,1.24l25.42,57.62-11.8-2.38c-5.56-1.12-10.12-5.06-12.04-10.4l-14.82-41.17c-1.12.22-2.26.42-3.39.6l16.4,48.19-8.82-1.78c-6.05-1.22-10.88-5.78-12.46-11.75l-8.44-31.96h-.01c-1.08.3-2.16.62-3.22.97l9.78,39.85-6.32-1.27c-6.56-1.32-11.63-6.54-12.77-13.14l-3.5-20.25-6.04,14.02c-.67,1.56-.51,3.35.43,4.77l18.61,28.08c.26.39.41.83.44,1.3l.36,5.31,11.73,11.74h27.59v12.06l-5.87-5.89h-6.47l6.15,6.17-6.7,6.71v-6.71l-6.16-6.17h-5.93l-6.16,6.17v5.31l-7.16-7.18,6.22-6.07-10.96-10.97-3.94.44c-.62.07-1.25-.08-1.77-.43l-23.02-15.33,16.55,22.38,26.35,35.64h-11.12c-6.3,0-12.03-3.66-14.69-9.38l-9.66-20.81c-.91.42-1.84.82-2.77,1.19l15.51,39.15h-5.35c-7.82,0-14.53-5.6-15.94-13.31l-4.19-22.98c-.91.16-1.83.31-2.76.42l3.5,27.44c.67,5.28-1.28,10.55-5.23,14.11l-4.95,4.46-4.95-4.46c-3.95-3.56-5.9-8.83-5.22-14.11l3.5-27.45c-.93-.11-1.85-.26-2.76-.42l-4.19,22.98c-1.4,7.71-8.11,13.31-15.94,13.31h-5.35l15.51-39.15c-.93-.36-1.86-.76-2.77-1.19l-9.66,20.81c-2.66,5.72-8.39,9.38-14.69,9.38h-11.12l26.35-35.64,16.55-22.37-23.02,15.32c-.52.35-1.15.5-1.77.43l-3.94-.44-10.96,10.97,6.22,6.07-7.16,7.18v-5.31l-6.16-6.17h-5.93l-6.16,6.17v6.71l-6.7-6.71,6.15-6.17h-6.47l-5.87,5.89v-12.06h27.59l11.73-11.74.37-5.31c.03-.46.18-.91.44-1.29l18.61-28.08c.94-1.42,1.1-3.21.43-4.77l-6.05-14.03h-.01l-3.5,20.26c-1.14,6.6-6.21,11.82-12.77,13.14l-6.31,1.27,9.78-39.86c-1.06-.35-2.15-.67-3.23-.97l-8.44,31.97c-1.58,5.98-6.41,10.54-12.47,11.76l-8.82,1.78,16.41-48.2c-1.13-.17-2.27-.37-3.39-.59l-14.82,41.18c-1.92,5.34-6.49,9.29-12.05,10.4l-11.8,2.38,25.4-57.64c-1.08-.38-2.15-.79-3.21-1.23l-24.25,52.5c-2.17,4.69-6.44,8.07-11.51,9.09l-15.47,3.12,38.91-70.8c-.99-.57-1.97-1.18-2.93-1.81l-24.26,42.37c-2.51,4.38-6.91,7.34-11.91,8.01l-15.45,2.06,40.64-60.73c-.86-.75-1.72-1.54-2.55-2.33l-22.88,32.94c-2.81,4.05-7.32,6.6-12.23,6.92l-15.19,1,41.05-51.07c-.71-.9-1.4-1.83-2.08-2.76l-22.78,27.35c-3.08,3.7-7.64,5.83-12.44,5.83h-15.11l72.75-75.91c3.92-4.09,9.33-6.4,14.99-6.4h16.23c4.34,0,7.86,3.52,7.86,7.87v9.17c0,7.39,2.47,14.21,6.61,19.67,5.93,7.83,15.32,12.87,25.89,12.87,2.35,0,4.65-.25,6.86-.73,1.76-.38,3.19-1.68,3.67-3.42l5.76-20.88c.08-.37.09-.76.03-1.15-.39-2.53-3.81-4.11-7.66-3.52-3.07.46-5.47,2.18-6.11,4.14,0,0-1.71-3.32-1.75-5.8-.05-3.2,1.32-4.97,4.41-6.53l5.37-2.52c3.38-3.1,8.89-5.12,15.13-5.12,9.6,0,17.51,4.78,18.52,10.95l.1.75,3.88,29.3c.28,2.09,1.89,3.76,3.97,4.1,1.7.28,3.45.42,5.24.42,10.57,0,19.96-5.04,25.89-12.87,4.14-5.47,6.61-12.28,6.61-19.67v-9.17c0-4.34,3.52-7.87,7.86-7.87h16.23c5.66,0,11.07,2.31,14.99,6.4l72.75,75.91h-15.1c-4.8,0-9.36-2.14-12.44-5.83l-22.79-27.35c-.66.93-1.35,1.86-2.07,2.76l41.04,51.07-15.2-1c-4.92-.32-9.42-2.87-12.23-6.92l-22.88-32.94Z"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
              />
              
              {/* Center Star - Main star animation */}
              <motion.polygon 
                className="cls-1" 
                points="246.39 155.65 256 148.64 265.62 155.65 261.95 144.32 271.56 137.31 259.68 137.31 256 125.98 252.33 137.31 240.44 137.31 250.06 144.32 246.39 155.65"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  opacity: [0, 1, 1]
                }}
                transition={{ 
                  duration: 1.5,
                  delay: 1,
                  repeat: Infinity,
                  repeatType: "reverse",
                  repeatDelay: 3
                }}
              />
              
              {/* Right Star - Delayed animation */}
              <motion.polygon 
                className="cls-1" 
                points="294.44 155.93 300.6 166.12 301.59 154.25 313.16 151.51 302.21 146.91 303.2 135.03 295.44 144.06 284.47 139.45 290.63 149.64 282.87 158.66 294.44 155.93"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  opacity: [0, 1, 1]
                }}
                transition={{ 
                  duration: 1.5,
                  delay: 1.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  repeatDelay: 3
                }}
              />
              
              {/* Left Star - Further delayed animation */}
              <motion.polygon 
                className="cls-1" 
                points="210.42 154.26 211.3 166.14 217.55 156.01 229.1 158.86 221.42 149.76 227.68 139.63 216.68 144.13 209 135.03 209.87 146.91 198.87 151.42 210.42 154.26"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  opacity: [0, 1, 1]
                }}
                transition={{ 
                  duration: 1.5,
                  delay: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  repeatDelay: 3
                }}
              />
            </motion.svg>
          </motion.div>

          {/* Decorative Pattern Top */}
          <motion.div
            variants={decorVariants}
            className="absolute top-16 left-1/2 transform -translate-x-1/2 w-72 h-8 opacity-50"
          >
            <svg viewBox="0 0 800 100" className="w-full h-full">
              <path
                d="M0,50 C100,30 150,70 200,50 C250,30 300,70 350,50 C400,30 450,70 500,50 C550,30 600,70 650,50 C700,30 750,70 800,50"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
              />
              <path
                d="M0,60 C100,40 150,80 200,60 C250,40 300,80 350,60 C400,40 450,80 500,60 C550,40 600,80 650,60 C700,40 750,80 800,60"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
              />
              {/* Arabic-inspired decorative elements */}
              <circle cx="400" cy="55" r="5" fill="#fff" opacity="0.7" />
              <circle cx="200" cy="55" r="3" fill="#fff" opacity="0.5" />
              <circle cx="600" cy="55" r="3" fill="#fff" opacity="0.5" />
              <polygon points="400,30 410,45 390,45" fill="#fff" opacity="0.3" />
            </svg>
          </motion.div>
          
          {/* Side Decorative Elements */}
          <motion.div
            variants={decorVariants}
            className="absolute left-8 top-1/2 transform -translate-y-1/2 h-64 w-10 opacity-30"
          >
            <svg viewBox="0 0 50 300" className="w-full h-full">
              <path
                d="M25,0 Q40,75 25,150 Q10,225 25,300"
                fill="none"
                stroke="#fff"
                strokeWidth="1"
              />
              <path
                d="M25,0 Q10,75 25,150 Q40,225 25,300"
                fill="none"
                stroke="#fff"
                strokeWidth="1"
              />
            </svg>
          </motion.div>
          
          <motion.div
            variants={decorVariants}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 h-64 w-10 opacity-30"
          >
            <svg viewBox="0 0 50 300" className="w-full h-full">
              <path
                d="M25,0 Q40,75 25,150 Q10,225 25,300"
                fill="none"
                stroke="#fff"
                strokeWidth="1"
              />
              <path
                d="M25,0 Q10,75 25,150 Q40,225 25,300"
                fill="none"
                stroke="#fff"
                strokeWidth="1"
              />
            </svg>
          </motion.div>

          {/* Main Calligraphy Text */}
          <motion.div variants={textVariants} className="text-center px-4">
            <h1 className="font-ibm text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-4 sm:mb-6 leading-tight">
              <FancyCalligraphyAnimation 
                text="وزارة الاتصالات" 
                delay={0.8}
                duration={0.08}
                className="block"
              />
              <FancyCalligraphyAnimation 
                text="وتقانة المعلومات" 
                delay={1.6}
                duration={0.1}
                className="block mt-1 sm:mt-2"
              />
            </h1>
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 font-light mt-4 sm:mt-6">
              <FancyCalligraphyAnimation 
                text="منصة التواصل المباشر مع الوزير" 
                delay={2.4}
                duration={0.04}
                as="span"
              />
            </div>
          </motion.div>

          {/* Decorative Pattern Bottom */}
          <motion.div
            variants={decorVariants}
            className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-72 h-8 opacity-50"
          >
            <svg viewBox="0 0 800 100" className="w-full h-full">
              <path
                d="M0,50 C100,30 150,70 200,50 C250,30 300,70 350,50 C400,30 450,70 500,50 C550,30 600,70 650,50 C700,30 750,70 800,50"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
              />
              <path
                d="M0,60 C100,40 150,80 200,60 C250,40 300,80 350,60 C400,40 450,80 500,60 C550,40 600,80 650,60 C700,40 750,80 800,60"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
              />
            </svg>
          </motion.div>

          {/* Enhanced Loading Indicator */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ 
              width: "300px", 
              opacity: 1,
              transition: { 
                width: { duration: duration - 0.5, ease: "linear" },
                opacity: { duration: 0.5 }
              } 
            }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 h-3 bg-white/30 rounded-full overflow-hidden mt-8 backdrop-blur-sm"
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ 
                x: "0%",
                transition: { duration: duration - 0.5, ease: "easeOut" }
              }}
              className="h-full w-full rounded-full shadow-xl"
              style={{
                background: 'linear-gradient(to right, #d9c89e 0%, #ad9e6e 50%, #d9c89e 100%)'
              }}
            />
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              animate={{
                x: ["-100%", "200%"]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeScreen;