import React from 'react';
import { motion } from 'framer-motion';
import syrianLogoSvg from '../../assets/syrian-logo-gold.svg';
import FastLink from '../navigation/FastLink';

const SimpleFooter: React.FC = () => {
  // Get the current year for the copyright
  const currentYear = new Date().getFullYear();
  
  return (
    <motion.footer 
      className="bg-primary text-white py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Copyright - Left side on desktop */}
          <motion.p 
            className="text-sm md:text-base text-center md:text-right order-2 md:order-1"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            © {currentYear} وزارة الاتصالات وتقانة المعلومات.
            <span className="hidden sm:inline"> جميع الحقوق محفوظة.</span>
          </motion.p>
          
          {/* Syrian Emblem in the exact middle */}
          <motion.div 
            className="flex justify-center order-1 md:order-2"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="animate-smooth h-20 md:h-24 flex items-center justify-center">
              <img 
                src={syrianLogoSvg} 
                alt="وزارة الاتصالات وتقانة المعلومات - الجمهورية العربية السورية" 
                className="h-24 md:h-28 w-auto"
              />
            </div>
          </motion.div>
          
          {/* Footer links - Right side on desktop */}
          <motion.div 
            className="flex justify-center md:justify-left space-x-6 space-x-reverse order-3"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <FastLink href="/privacy-policy" style={{ transition: 'none' }} className="text-white hover:text-gray-200 text-sm md:text-base">سياسة الخصوصية</FastLink>
            <FastLink href="/terms-of-use" style={{ transition: 'none' }} className="text-white hover:text-gray-200 text-sm md:text-base">شروط الاستخدام</FastLink>
          </motion.div>
        </div>
      </div>
    </motion.footer>
  );
};

export default SimpleFooter;