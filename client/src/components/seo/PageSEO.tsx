import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { setPageTitle, pageMetadata, updateMetaTags } from '@/lib/seo';

interface PageSEOProps {
  pageName?: keyof typeof pageMetadata;
  customTitle?: string;
  customDescription?: string;
}

/**
 * Component to handle SEO metadata for each page
 * Use this at the top of page components to set the appropriate
 * title, description, and other metadata
 */
const PageSEO: React.FC<PageSEOProps> = ({ 
  pageName = 'home', 
  customTitle, 
  customDescription 
}) => {
  const [location] = useLocation();
  
  useEffect(() => {
    // Get metadata for the current page
    const metadata = pageMetadata[pageName] || pageMetadata.home;
    
    // Set the page title
    const title = customTitle || metadata.title;
    setPageTitle(title);
    
    // Create custom metadata based on props or defaults
    const customMetadata = {
      ...metadata,
      title: customTitle || metadata.title,
      description: customDescription || metadata.description,
      path: location
    };
    
    // Update meta tags
    updateMetaTags(customMetadata);
    
    // Clean up when component unmounts
    return () => {
      // No cleanup needed as we want to keep the title and meta tags
    };
  }, [pageName, customTitle, customDescription, location]);
  
  return null; // This component doesn't render anything
};

export default PageSEO;