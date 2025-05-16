import { useState } from "react";
import { 
  Plus, X, FileText, MessageSquare, 
  Upload, Settings, Send, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingActionItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionMenuProps {
  items: FloatingActionItem[];
  position?: "bottom-right" | "bottom-left";
  userRole?: "customer" | "admin";
}

export function FloatingActionMenu({
  items,
  position = "bottom-right",
  userRole = "customer"
}: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Position classes
  const positionClasses = {
    "bottom-right": "right-4 bottom-20",
    "bottom-left": "left-4 bottom-20"
  };

  // Animation variants with enhanced bounce effect
  const containerVariants = {
    open: { 
      transition: { 
        staggerChildren: 0.08,
        delayChildren: 0.1
      } 
    },
    closed: { 
      transition: { 
        staggerChildren: 0.05, 
        staggerDirection: -1 
      } 
    }
  };

  const itemVariants = {
    open: { 
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 15,
        mass: 1.2,  // Slightly increased mass for more bounce
        velocity: 2 // Initial velocity for extra bounce
      }
    },
    closed: { 
      y: 50,
      opacity: 0,
      scale: 0.3,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  const buttonVariants = {
    hover: { 
      scale: 1.1,
      rotate: isOpen ? 0 : 45,
      transition: {
        type: "spring",
        stiffness: 500,  // Increased stiffness
        damping: 10,
        mass: 1.2,      // Added mass for more bounce
        velocity: 2     // Initial velocity
      }
    },
    tap: { 
      scale: 0.9,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    initial: {
      rotate: isOpen ? 0 : 45
    },
    bounce: {
      y: [0, -10, 0],  // Bounce up and down
      transition: {
        duration: 0.5,
        times: [0, 0.5, 1],
        repeat: 3,
        repeatType: "loop" as const,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className={cn("fixed z-50", positionClasses[position])}>
      {/* Main Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="flex flex-col-reverse items-center gap-3 mb-4"
            initial="closed"
            animate="open"
            exit="closed"
            variants={containerVariants}
          >
            {items.map((item, index) => (
              <motion.div
                key={index}
                className="relative"
                variants={itemVariants}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-center rounded-full w-12 h-12 shadow-lg focus:outline-none",
                    item.color || "bg-blue-500 text-white"
                  )}
                >
                  {item.icon}
                </button>
                <span className="absolute left-full ml-2 py-1 px-2 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button with bounce animation effect */}
      <motion.button
        className={cn(
          "flex items-center justify-center rounded-full w-14 h-14 shadow-lg focus:outline-none",
          isOpen ? "bg-red-500" : userRole === "admin" ? "bg-purple-600" : "bg-blue-500",
          "text-white"
        )}
        onClick={toggleMenu}
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        animate={isOpen ? { rotate: 0 } : "bounce"}
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </motion.button>
    </div>
  );
}