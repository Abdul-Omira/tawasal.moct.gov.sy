import React from 'react';
import { Link, useRoute } from 'wouter';

interface FastLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A faster link component for the Syrian Ministry website that
 * avoids unnecessary transitions and renders faster
 */
const FastLink: React.FC<FastLinkProps> = ({ 
  href, 
  children, 
  className = '',
  style = {}
}) => {
  const [isActive] = useRoute(href);
  
  return (
    <Link 
      href={href}
      className={`${className} ${isActive ? 'font-bold' : ''}`}
      style={{
        textDecoration: 'none',
        ...style
      }}
    >
      {children}
    </Link>
  );
};

export default FastLink;