import React from 'react';
import { motion } from 'framer-motion';

type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

export const pageTransitionVariants = {
  initial: { 
    opacity: 0,
    y: 10,
  },
  animate: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4, 
      ease: "easeInOut",
      when: "beforeChildren",
      staggerChildren: 0.1,
    }
  },
  exit: { 
    opacity: 0,
    y: -10,
    transition: { 
      duration: 0.3,
      ease: "easeInOut" 
    }
  }
};

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}