import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface CalligraphyAnimationProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

/**
 * Optimized calligraphy animation for mobile performance
 */
export const OptimizedCalligraphyAnimation: React.FC<CalligraphyAnimationProps> = ({
  text,
  className = '',
  delay = 0,
  duration = 0.05
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  // Detect mobile for performance optimization
  const isMobile = useMemo(() => {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth < 768;
  }, []);

  // Split the text into words instead of characters for better Arabic support
  const words = text.split(' ').filter(word => word.trim() !== '');
  
  // Simplified container variant for better performance
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: prefersReducedMotion ? duration : duration * 2,
        delayChildren: delay,
        ease: "easeOut"
      }
    }
  };
  
  // Optimized word variants - simplified for mobile
  const wordVariant = {
    hidden: {
      opacity: 0,
      y: isMobile ? 5 : 10, // Reduced movement on mobile
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: prefersReducedMotion ? "tween" : "spring",
        damping: 15,
        stiffness: 150,
        duration: prefersReducedMotion ? 0.2 : undefined
      }
    }
  };
  
  return (
    <motion.div
      className={`inline-block ${className}`}
      dir="rtl"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          className="inline-block"
          variants={wordVariant}
          style={{ 
            display: 'inline-block',
            marginLeft: '0.25em',
            marginRight: '0.25em'
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};

/**
 * Optimized fancy calligraphy animation with reduced complexity for mobile
 */
export const OptimizedFancyCalligraphyAnimation: React.FC<CalligraphyAnimationProps & {
  as?: 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}> = ({
  text,
  className = '',
  delay = 0,
  duration = 0.05,
  as = 'div'
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  // Detect mobile for performance optimization
  const isMobile = useMemo(() => {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth < 768;
  }, []);

  // Split the text into words to maintain Arabic letter connections
  const words = text.split(' ').filter(word => word.trim() !== '');
  
  // Simplified container variant
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: prefersReducedMotion ? duration : duration * 2,
        delayChildren: delay,
        ease: "easeOut"
      }
    }
  };
  
  // Optimized word variants
  const wordVariant = {
    hidden: {
      opacity: 0,
      y: isMobile ? 5 : 15,
      scale: isMobile ? 0.98 : 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: prefersReducedMotion ? "tween" : "spring",
        damping: 18,
        stiffness: 180,
        duration: prefersReducedMotion ? 0.25 : undefined
      }
    }
  };
  
  // Simplified line variants - only show on desktop for performance
  const lineVariants = {
    hidden: { width: "0%" },
    visible: { 
      width: "100%", 
      transition: { 
        delay: delay + (words.length * duration * 2) + 0.2, 
        duration: prefersReducedMotion ? 0.3 : 0.5,
        ease: "easeOut"
      }
    }
  };
  
  // Dynamically render the component based on the 'as' prop
  const Container = as;
  
  return (
    <Container className={`relative ${className}`}>
      <motion.span
        className="inline-block"
        dir="rtl"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {words.map((word, index) => (
          <motion.span
            key={index}
            className="inline-block"
            variants={wordVariant}
            style={{ 
              display: 'inline-block',
              marginLeft: '0.25em',
              marginRight: '0.25em'
            }}
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
      
      {/* Decorative line - only on desktop for performance */}
      {!isMobile && (
        <motion.div
          className="h-0.5 bg-primary/50 mt-1 mx-auto rounded-full"
          variants={lineVariants}
          initial="hidden"
          animate="visible"
        />
      )}
    </Container>
  );
};

export default OptimizedCalligraphyAnimation; 