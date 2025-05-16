import { useState, useEffect } from 'react';

interface SkipToContentProps {
  mainContentId?: string;
  label?: string;
}

/**
 * SkipToContent component - Allows keyboard users to skip navigation
 * and go directly to the main content of the page.
 * 
 * This component should be placed at the very beginning of your page layout.
 * Make sure the mainContentId matches an id on your main content container.
 */
export function SkipToContent({ 
  mainContentId = 'main-content',
  label = 'Skip to main content'
}: SkipToContentProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Handle keyboard focus
  const handleFocus = () => setIsVisible(true);
  const handleBlur = () => setIsVisible(false);
  
  // Handle click - focus the main content
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const mainContent = document.getElementById(mainContentId);
    if (mainContent) {
      // Set tabIndex temporarily if not focusable
      const needsTabIndex = mainContent.tabIndex < 0;
      
      if (needsTabIndex) {
        mainContent.tabIndex = -1;
      }
      
      // Focus the element
      mainContent.focus();
      
      // Scroll into view if needed
      mainContent.scrollIntoView({ behavior: 'smooth' });
      
      // Remove temporary tabIndex
      if (needsTabIndex) {
        // Small delay to ensure focus happens before removing tabIndex
        setTimeout(() => {
          mainContent.removeAttribute('tabindex');
        }, 100);
      }
    }
  };
  
  // Add keyboard event listener to handle showing the link on Tab press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey && document.activeElement === document.body) {
        // User is tabbing from the browser UI into the page
        setIsVisible(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <a
      href={`#${mainContentId}`}
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2 z-50
        bg-primary-600 text-white px-4 py-3 rounded-md
        focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600
        transition-opacity duration-200
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      aria-label={label}
      tabIndex={0}
    >
      {label}
    </a>
  );
}