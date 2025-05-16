// Animation utilities for UI transitions and micro-interactions

// Transition variants (for Framer Motion)
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

export const slideIn = {
  hidden: { x: 20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3 } },
  exit: { x: -20, opacity: 0, transition: { duration: 0.3 } }
};

export const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
  exit: { y: -20, opacity: 0, transition: { duration: 0.3 } }
};

export const scaleIn = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
  exit: { scale: 0.9, opacity: 0, transition: { duration: 0.3 } }
};

// Button hover animation
export const buttonHover = {
  scale: 1.03,
  transition: { duration: 0.2 }
};

// Staggered children animations
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItem = {
  hidden: { y: 10, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 24 
    }
  }
};

// Pulse animation for notifications
export const pulse = {
  scale: [1, 1.05, 1],
  transition: { 
    duration: 0.5, 
    repeat: 1, 
    repeatType: "reverse" as const 
  }
};

// Subtle wiggle animation
export const wiggle = {
  rotate: [0, -2, 0, 2, 0],
  transition: { 
    duration: 0.5, 
    repeat: 1, 
    repeatType: "reverse" as const 
  }
};

// Breathe animation for elements that need attention
export const breathe = {
  scale: [1, 1.03, 1],
  transition: { 
    duration: 2, 
    repeat: Infinity, 
    repeatType: "reverse" as const,
    ease: "easeInOut"
  }
};

// Transitions durations to use consistently across components
export const transitions = {
  fast: 0.15,
  default: 0.3,
  slow: 0.5
};