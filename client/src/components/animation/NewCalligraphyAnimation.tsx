import React from 'react';
import { motion } from 'framer-motion';

export interface CalligraphyAnimationProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

/**
 * A component that animates Arabic text with a calligraphic effect
 * by revealing each WORD sequentially to maintain Arabic letter connections.
 */
export const CalligraphyAnimation: React.FC<CalligraphyAnimationProps> = ({
  text,
  className = '',
  delay = 0,
  duration = 0.05
}) => {
  // Split the text into an array of words instead of characters
  // This preserves proper Arabic letter connections
  const words = text.split(' ').filter(word => word.trim() !== '');
  
  // Create a variant for the container
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { 
        staggerChildren: duration * 3, // Slower stagger for words
        delayChildren: delay * i,
        ease: "easeInOut"
      }
    })
  };
  
  // Create variants for each word - removed blur to prevent negative values
  const wordVariant = {
    hidden: {
      opacity: 0,
      y: 15,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200
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
 * A more elaborate calligraphy animation with decorative elements
 */
export const FancyCalligraphyAnimation: React.FC<CalligraphyAnimationProps & {
  as?: 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}> = ({
  text,
  className = '',
  delay = 0,
  duration = 0.05,
  as = 'div'
}) => {
  // Split the text into words to maintain Arabic letter connections
  const words = text.split(' ').filter(word => word.trim() !== '');
  
  // Create a variant for the container
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { 
        staggerChildren: duration * 3,
        delayChildren: delay * i,
        ease: "easeInOut"
      }
    })
  };
  
  // Create variants for each word - removed blur to prevent negative values
  const wordVariant = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 200
      }
    }
  };
  
  // Create variants for the decorative line
  const lineVariants = {
    hidden: { width: "0%" },
    visible: { 
      width: "100%", 
      transition: { 
        delay: delay + (words.length * duration * 3) + 0.3, 
        duration: 0.6,
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
      
      {/* Decorative line beneath the text */}
      <motion.div
        className="h-0.5 bg-primary/50 mt-1 mx-auto rounded-full"
        variants={lineVariants}
        initial="hidden"
        animate="visible"
      />
    </Container>
  );
};

export default CalligraphyAnimation;