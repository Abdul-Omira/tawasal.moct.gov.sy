import { useEffect, useState } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RTLProvider } from '@/contexts/RTLContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n';
import Home from '@/pages/Home';
import Admin from '@/pages/Admin';
import FormBuilder from '@/pages/FormBuilder';
import Confirmation from '@/pages/Confirmation';
import AuthPage from '@/pages/AuthPage';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfUse from '@/pages/TermsOfUse';
import NotFound from '@/pages/not-found';
import { ProtectedRoute } from '@/lib/protected-route';
import WelcomeScreen from '@/components/animation/WelcomeScreen';
import { pageMetadata, setPageTitle, updateMetaTags } from '@/lib/seo';

function Router() {
  const [location] = useLocation();
  
  // Update SEO metadata when location changes
  useEffect(() => {
    // Find which page metadata to use based on the current path
    let currentPage: keyof typeof pageMetadata = 'home';
    
    if (location === '/') {
      currentPage = 'home';
    } else if (location === '/mgt-system-2025') {
      currentPage = 'admin';
    } else if (location === '/auth') {
      currentPage = 'auth';
    } else if (location === '/confirmation') {
      currentPage = 'confirmation';
    } else if (location === '/privacy-policy') {
      currentPage = 'privacyPolicy';
    } else if (location === '/terms-of-use') {
      currentPage = 'termsOfUse';
    } else {
      currentPage = 'notFound';
    }
    
    // Get the metadata for the current page
    const metadata = pageMetadata[currentPage];
    
    // Update title and meta tags
    setPageTitle(metadata.title);
    updateMetaTags(metadata);
  }, [location]);
  
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <ProtectedRoute path="/mgt-system-2025" component={Admin} adminOnly={true} />
      <ProtectedRoute path="/form-builder" component={FormBuilder} adminOnly={true} />
      <Route path="/confirmation" component={Confirmation}/>
      <Route path="/auth" component={AuthPage}/>
      <Route path="/privacy-policy" component={PrivacyPolicy}/>
      <Route path="/terms-of-use" component={TermsOfUse}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // State to control showing the welcome screen
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  
  useEffect(() => {
    // Check if we should skip the welcome screen (for development purposes)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('skipWelcome') === 'true') {
      setShowWelcomeScreen(false);
    }
  }, []);

  // Handle when the welcome screen animation completes
  const handleWelcomeComplete = () => {
    setShowWelcomeScreen(false);
  };

  return (
    <I18nextProvider i18n={i18n}>
      <RTLProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            {showWelcomeScreen ? (
              <WelcomeScreen 
                onComplete={handleWelcomeComplete} 
                duration={5} // Set welcome screen duration to 5 seconds
              />
            ) : null}
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </RTLProvider>
    </I18nextProvider>
  );
}

export default App;