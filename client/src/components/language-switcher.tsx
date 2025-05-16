import React, { useState } from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerItem } from '@/lib/animation';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setOpen(false);
  };

  // Animation variants
  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      y: -5,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.2, 
        ease: "easeOut" 
      }
    },
    exit: { 
      opacity: 0, 
      y: -5, 
      scale: 0.95,
      transition: { 
        duration: 0.15, 
        ease: "easeIn" 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.25
      }
    }),
    hover: { 
      backgroundColor: "rgba(59, 130, 246, 0.2)",
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1 px-2 rounded-full ${className}`}
            aria-label={t('language.switcher')}
          >
            <motion.div
              animate={{ rotate: open ? 360 : 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Globe className="h-4 w-4" />
            </motion.div>
            
            <AnimatePresence mode="wait">
              <motion.span 
                key={language}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="font-medium uppercase"
              >
                {language}
              </motion.span>
            </AnimatePresence>
          </Button>
        </motion.div>
      </DropdownMenuTrigger>

      <AnimatePresence>
        {open && (
          <DropdownMenuContent align="end" className="w-40" forceMount asChild>
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-md shadow-md p-1 z-50"
            >
              <motion.div
                custom={0}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
                onClick={() => handleLanguageChange('nl')}
                className={`px-2 py-1.5 rounded-sm cursor-pointer flex items-center gap-2 ${language === 'nl' ? 'bg-primary/10' : ''}`}
              >
                <span className={`w-6 text-center ${language === 'nl' ? 'font-bold' : ''}`}>NL</span>
                <span>{t('language.nl')}</span>
              </motion.div>
              
              <motion.div
                custom={1}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
                onClick={() => handleLanguageChange('en')}
                className={`px-2 py-1.5 rounded-sm cursor-pointer flex items-center gap-2 ${language === 'en' ? 'bg-primary/10' : ''}`}
              >
                <span className={`w-6 text-center ${language === 'en' ? 'font-bold' : ''}`}>EN</span>
                <span>{t('language.en')}</span>
              </motion.div>
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
}