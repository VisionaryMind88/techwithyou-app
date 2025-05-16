import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { buttonHover, fadeIn, slideIn, slideUp, scaleIn } from "@/lib/animation";
import { cn } from "@/lib/utils";

// Animated Button
type AnimatedButtonProps = HTMLMotionProps<"button"> & {
  variant?: "default" | "primary" | "secondary" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
};

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className,
  variant = "default",
  size = "default",
  whileHover = buttonHover,
  initial = "hidden",
  animate = "visible",
  exit = "exit",
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50";
  
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground"
  };
  
  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8"
  };
  
  return (
    <motion.button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      whileHover={whileHover}
      whileTap={{ scale: 0.97 }}
      initial={initial}
      animate={animate}
      exit={exit}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// Animated Card
type AnimatedCardProps = HTMLMotionProps<"div"> & {
  variant?: "default" | "bordered";
};

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  variant = "default",
  initial = "hidden",
  animate = "visible",
  exit = "exit",
  variants = scaleIn,
  ...props
}) => {
  const baseClasses = "rounded-lg p-4 shadow-sm transition-all";
  
  const variantClasses = {
    default: "bg-white",
    bordered: "bg-white border border-gray-200"
  };
  
  return (
    <motion.div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      initial={initial}
      animate={animate}
      exit={exit}
      variants={variants}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Animated List
type AnimatedListProps = HTMLMotionProps<"ul"> & {
  variant?: "default" | "divided";
  delay?: number;
};

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  className,
  variant = "default",
  delay = 0.1,
  ...props
}) => {
  const baseClasses = "space-y-2";
  
  const variantClasses = {
    default: "",
    divided: "divide-y divide-gray-100"
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
        delayChildren: 0.1
      }
    }
  };
  
  return (
    <motion.ul
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            variants: {
              hidden: { opacity: 0, y: 10 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                  delay: index * delay
                }
              }
            },
            // @ts-ignore
            key: child.key || index,
          });
        }
        return child;
      })}
    </motion.ul>
  );
};

// Animated Text (for headings, paragraphs, etc.)
type AnimatedTextProps = HTMLMotionProps<"div"> & {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  variant?: "default" | "gradient";
};

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  children,
  className,
  as = "p",
  variant = "default",
  initial = "hidden",
  animate = "visible",
  exit = "exit",
  variants = fadeIn,
  ...props
}) => {
  const Component = motion[as];
  
  const variantClasses = {
    default: "",
    gradient: "bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400"
  };
  
  return (
    <Component
      className={cn(
        variantClasses[variant],
        className
      )}
      initial={initial}
      animate={animate}
      exit={exit}
      variants={variants}
      {...props}
    >
      {children}
    </Component>
  );
};

// Animated Icon Container
type AnimatedIconProps = HTMLMotionProps<"div"> & {
  size?: "sm" | "md" | "lg";
};

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  children,
  className,
  size = "md",
  whileHover = { scale: 1.1, rotate: 5 },
  ...props
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };
  
  return (
    <motion.div
      className={cn(
        "inline-flex",
        sizeClasses[size],
        className
      )}
      whileHover={whileHover}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Page transition wrapper
export const PageTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// Fade In effect
export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}> = ({ 
  children, 
  delay = 0, 
  duration = 0.5,
  className
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration, 
        delay,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
};

// Pulsing notification dot
export const PulsingDot: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <motion.div
      className={cn(
        "h-2 w-2 rounded-full bg-red-500",
        className
      )}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
      }}
    />
  );
};