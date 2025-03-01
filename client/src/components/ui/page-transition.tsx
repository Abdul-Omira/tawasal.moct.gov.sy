import React, { ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);
  
  const variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      exit="hidden"
      variants={variants}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;