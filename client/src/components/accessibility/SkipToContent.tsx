import React from 'react';
import { useLocation } from 'wouter';

export default function SkipToContent() {
  const [location] = useLocation();
  
  // Identify potential skip targets based on current page
  const getSkipTargets = () => {
    if (location.includes('/projects/')) {
      return [
        { id: 'main-content', label: 'Skip to main content' },
        { id: 'project-details', label: 'Skip to project details' },
        { id: 'file-section', label: 'Skip to files' },
        { id: 'message-section', label: 'Skip to messages' }
      ];
    } else if (location.includes('/dashboard') || location === '/') {
      return [
        { id: 'main-content', label: 'Skip to main content' },
        { id: 'stats-section', label: 'Skip to statistics' },
        { id: 'projects-table', label: 'Skip to projects' },
        { id: 'activity-section', label: 'Skip to activities' }
      ];
    }
    
    // Default skip target
    return [{ id: 'main-content', label: 'Skip to main content' }];
  };
  
  const skipTargets = getSkipTargets();
  
  return (
    <div className="skip-links" aria-label="Skip navigation links">
      {skipTargets.map((target) => (
        <a 
          key={target.id}
          href={`#${target.id}`} 
          className="skip-to-content focus-visible-ring"
          data-testid={`skip-to-${target.id}`}
        >
          {target.label}
        </a>
      ))}
    </div>
  );
}