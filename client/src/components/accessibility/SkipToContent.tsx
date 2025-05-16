import React from 'react';

export default function SkipToContent() {
  return (
    <a 
      href="#main-content" 
      className="skip-to-content"
      data-testid="skip-to-content"
    >
      Skip to content
    </a>
  );
}