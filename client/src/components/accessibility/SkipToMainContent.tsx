import React from 'react';

/**
 * SkipToMainContent component - allows keyboard users to skip repetitive navigation
 * and jump directly to the main content of the page
 */
export const SkipToMainContent = () => {
  return (
    <a 
      href="#main-content" 
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-white focus:text-primary focus:border focus:border-primary focus:rounded focus-visible-ring"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
};

export default SkipToMainContent;