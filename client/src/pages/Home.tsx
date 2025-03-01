import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import MinisterCommunicationForm from '../components/form/MinisterCommunicationForm';
import SimpleHeader from '../components/layout/SimpleHeader';
import SimpleFooter from '../components/layout/SimpleFooter';
import PageTransition from '../components/ui/page-transition';
import PageSEO from '../components/seo/PageSEO';
import { FancyCalligraphyAnimation } from '../components/animation/NewCalligraphyAnimation';
import { SyrianLogoAnimation } from '../components/animation/SyrianLogoAnimation';

const Home: React.FC = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Animation variants
  const bannerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.7,
        staggerChildren: 0.2,
        delayChildren: 0.3
      } 
    }
  };

  const formVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.5, 
        delay: 0.4 
      } 
    }
  };

  return (
    <PageTransition className="min-h-screen flex flex-col bg-background">
      {/* Add SEO component with page-specific metadata */}
      <PageSEO 
        pageName="home"
        customDescription="المنصة الرسمية لوزارة الاتصالات وتقانة المعلومات السورية للتواصل مع المواطنين وتلقي أفكارهم ومقترحاتهم وشكاواهم وطلباتهم"
      />
      <SimpleHeader />
      
      <main className="flex-grow">
        {/* Simple Banner Section */}
        <motion.section 
          className="py-2 lg:py-3 font-qomra h-screen flex items-center"
          style={{ 
            background: 'linear-gradient(135deg, #00594f 0%, #004d42 50%, #003d34 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}
          variants={bannerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Animated background elements */}
          <motion.div
            className="absolute inset-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Floating orbs */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-64 h-64 bg-gold-400/20 rounded-full blur-3xl"
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-maroon-400/20 rounded-full blur-3xl"
              animate={{
                x: [0, -150, 0],
                y: [0, 100, 0],
                scale: [1, 0.8, 1]
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 w-80 h-80 bg-green-400/20 rounded-full blur-3xl"
              animate={{
                x: [-100, 100, -100],
                y: [-50, 50, -50],
                scale: [0.9, 1.1, 0.9]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
            <motion.div 
              className="text-center text-white font-qomra max-w-5xl mx-auto"
              variants={textVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Logo and Main Title */}
              <motion.div 
                className="flex flex-col items-center mb-2"
                variants={textVariants}
              >
                {/* Enhanced Syrian Logo Animation */}
                <motion.div
                  className="mb-0 flex justify-center relative"
                  variants={textVariants}
                >
                  {/* Animated glow behind logo */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-gold-400/40 via-gold-500/50 to-gold-400/40 blur-3xl"
                    animate={{
                      scale: [0.8, 1.2, 0.8],
                      opacity: [0.4, 0.7, 0.4]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  {/* Animated Syrian Logo with built-in star animations */}
                  <motion.svg
                    width="320"
                    height="320"
                    viewBox="0 0 512 512"
                    className="drop-shadow-2xl relative z-10"
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
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                    
                    {/* Center Star - Main star with cool twinkle animation */}
                    <motion.polygon 
                      className="cls-1" 
                      points="246.39 155.65 256 148.64 265.62 155.65 261.95 144.32 271.56 137.31 259.68 137.31 256 125.98 252.33 137.31 240.44 137.31 250.06 144.32 246.39 155.65"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1.3, 1, 1.2, 1],
                        opacity: [0, 1, 0.7, 1, 0.8, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        delay: 1,
                        repeat: Infinity,
                        repeatDelay: 4,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {/* Right Star - Cascading twinkle */}
                    <motion.polygon 
                      className="cls-1" 
                      points="294.44 155.93 300.6 166.12 301.59 154.25 313.16 151.51 302.21 146.91 303.2 135.03 295.44 144.06 284.47 139.45 290.63 149.64 282.87 158.66 294.44 155.93"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1.3, 1, 1.2, 1],
                        opacity: [0, 1, 0.7, 1, 0.8, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        delay: 1.8,
                        repeat: Infinity,
                        repeatDelay: 4,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {/* Left Star - Final cascade twinkle */}
                    <motion.polygon 
                      className="cls-1" 
                      points="210.42 154.26 211.3 166.14 217.55 156.01 229.1 158.86 221.42 149.76 227.68 139.63 216.68 144.13 209 135.03 209.87 146.91 198.87 151.42 210.42 154.26"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1.3, 1, 1.2, 1],
                        opacity: [0, 1, 0.7, 1, 0.8, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        delay: 2.5,
                        repeat: Infinity,
                        repeatDelay: 4,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.svg>
                </motion.div>

                {/* Main Title */}
                <motion.div 
                  className="text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold animate-theme font-qomra leading-tight px-2 mb-0"
                  variants={textVariants}
                >
                  <FancyCalligraphyAnimation 
                    text="صفحة التواصل مع وزير الاتصالات وتقانة المعلومات"
                    duration={0.06}
                    delay={0.2}
                    className="inline-block font-qomra font-bold"
                    as="h1"
                  />
                </motion.div>
              </motion.div>

              {/* Minister's Message with enhanced styling */}
              <motion.div 
                className="mb-3 max-w-3xl mx-auto"
                variants={textVariants}
              >
                <div className="bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-2xl relative overflow-hidden">
                  {/* Decorative corner accents */}
                  <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 rounded-tl-2xl" style={{ borderColor: '#ad9e6e' }} />
                  <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 rounded-tr-2xl" style={{ borderColor: '#ad9e6e' }} />
                  <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 rounded-bl-2xl" style={{ borderColor: '#ad9e6e' }} />
                  <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 rounded-br-2xl" style={{ borderColor: '#ad9e6e' }} />
                  <div className="text-white text-right font-qomra">
                    <p className="text-xl mb-3">مرحباً،</p>
                    <p className="text-lg leading-relaxed mb-3">
                      يسرني استقبال رسائلكم عبر هذه الصفحة. نراجع كل رسالة بعناية وجدية، ونحيلها إلى المتابعة المختصة عند الحاجة. 
                      أقدّر تواصلكم واهتمامكم، وأشكركم على مساهمتكم في تطوير قطاع الاتصالات والتكنولوجيا.
                    </p>
                    <div className="text-lg">
                      <p>مع أطيب التمنيات،</p>
                      <p className="mt-3">عبدالسلام هيكل</p>
                      <p>وزير الاتصالات وتقانة المعلومات</p>
                      <p>الجمهورية العربية السورية</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Call to Action */}
              <motion.div 
                className="mt-4 px-4"
                variants={textVariants}
              >
                <button 
                  onClick={() => {
                    const formSection = document.getElementById('form-section');
                    if (formSection) {
                      formSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="text-white font-medium py-4 px-8 rounded-xl transition-all duration-300 font-qomra text-lg shadow-lg hover:shadow-2xl relative overflow-hidden group"
                  style={{
                    background: 'linear-gradient(135deg, #ad9e6e 0%, #8b7c4e 50%, #6d5f3a 100%)'
                  }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full"
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    أرسل رسالتك الآن
                    <span>←</span>
                  </span>
                </button>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Form Section with animation */}
        <motion.section 
          className="py-6 sm:py-8 md:py-10 lg:py-16 font-ibm bg-gray-50 min-h-screen"
          variants={formVariants}
          initial="hidden"
          animate="visible"
          id="form-section"
        >
          <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            {/* Section Header */}
            <motion.div 
              className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12"
              variants={textVariants}
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 font-ibm px-2">
                أرسل رسالتك إلى الوزير
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed font-ibm px-4">
                استخدم النموذج أدناه لإرسال رسالتك مباشرة إلى وزير الاتصالات وتقانة المعلومات
              </p>
            </motion.div>

            {/* Form Container */}
            <motion.div 
              className="max-w-4xl mx-auto"
              variants={formVariants}
            >
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 font-ibm">
                <MinisterCommunicationForm />
              </div>
            </motion.div>
          </div>
        </motion.section>
      </main>

      <SimpleFooter />
    </PageTransition>
  );
};

export default Home;
