import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TourStep {
  title: string;
  description: string;
  targetElement?: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  userRole: 'customer' | 'admin';
}

export function OnboardingTour({ 
  steps, 
  isOpen, 
  onComplete,
  userRole 
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const positionDialog = () => {
    const step = steps[currentStep];
    if (!step.targetElement) return;

    const element = document.querySelector(step.targetElement);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const dialogContent = document.querySelector('.tour-dialog');
    if (!dialogContent) return;

    const dialogRect = dialogContent.getBoundingClientRect();

    let newPos = { top: 0, left: 0 };

    switch (step.position) {
      case 'top':
        newPos = {
          top: rect.top - dialogRect.height - 10,
          left: rect.left + rect.width / 2 - dialogRect.width / 2
        };
        break;
      case 'right':
        newPos = {
          top: rect.top + rect.height / 2 - dialogRect.height / 2,
          left: rect.right + 10
        };
        break;
      case 'bottom':
        newPos = {
          top: rect.bottom + 10,
          left: rect.left + rect.width / 2 - dialogRect.width / 2
        };
        break;
      case 'left':
        newPos = {
          top: rect.top + rect.height / 2 - dialogRect.height / 2,
          left: rect.left - dialogRect.width - 10
        };
        break;
      default:
        newPos = {
          top: rect.bottom + 10,
          left: rect.left
        };
    }

    // Make sure dialog stays in viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (newPos.left < 10) newPos.left = 10;
    if (newPos.left + dialogRect.width > viewportWidth - 10) {
      newPos.left = viewportWidth - dialogRect.width - 10;
    }

    if (newPos.top < 10) newPos.top = 10;
    if (newPos.top + dialogRect.height > viewportHeight - 10) {
      newPos.top = viewportHeight - dialogRect.height - 10;
    }

    setPosition(newPos);
  };

  useEffect(() => {
    if (isOpen) {
      positionDialog();
      
      // Add highlight effect to target element
      const step = steps[currentStep];
      if (step.targetElement) {
        const element = document.querySelector(step.targetElement);
        if (element) {
          element.classList.add('ring-2', 'ring-primary-500', 'ring-offset-2');
        }
      }
      
      return () => {
        // Remove highlight from previous element
        const step = steps[currentStep];
        if (step.targetElement) {
          const element = document.querySelector(step.targetElement);
          if (element) {
            element.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2');
          }
        }
      };
    }
  }, [currentStep, isOpen, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Remove highlight from current element
      const currentStepData = steps[currentStep];
      if (currentStepData.targetElement) {
        const element = document.querySelector(currentStepData.targetElement);
        if (element) {
          element.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2');
        }
      }
      
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      // Remove highlight from current element
      const currentStepData = steps[currentStep];
      if (currentStepData.targetElement) {
        const element = document.querySelector(currentStepData.targetElement);
        if (element) {
          element.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2');
        }
      }
      
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Remove highlight from current element
    const currentStepData = steps[currentStep];
    if (currentStepData.targetElement) {
      const element = document.querySelector(currentStepData.targetElement);
      if (element) {
        element.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2');
      }
    }
    
    // Reset step index for next time
    setCurrentStep(0);
    onComplete();
    
    // Save to localStorage that the tour has been completed
    localStorage.setItem(`onboarding-tour-completed-${userRole}`, 'true');
  };

  const currentStepData = steps[currentStep];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleComplete()}>
      <DialogContent 
        className="tour-dialog w-[350px] absolute p-4 shadow-lg"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'none'
        }}
      >
        <DialogHeader className="pb-2">
          <DialogTitle>{currentStepData.title}</DialogTitle>
          <DialogDescription>
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrevious}
              >
                Previous
              </Button>
            )}
            <Button 
              variant={currentStep < steps.length - 1 ? "default" : "success"} 
              size="sm" 
              onClick={handleNext}
            >
              {currentStep < steps.length - 1 ? "Next" : "Finish"}
            </Button>
          </div>
          
          <div className="text-xs text-gray-500">
            {currentStep + 1} of {steps.length}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Predefined tour steps for different user roles
export const customerTourSteps: TourStep[] = [
  {
    title: "Welcome to your Dashboard",
    description: "This is your main workspace where you can manage projects and interact with our team.",
    targetElement: "#customer-dashboard-welcome",
    position: "bottom"
  },
  {
    title: "Project Management",
    description: "Here you can see all your active and completed projects. Click 'New Project' to submit a request.",
    targetElement: "#projects-section",
    position: "top"
  },
  {
    title: "Chat & Communication",
    description: "Use this section to communicate with our team in real-time and receive updates on your projects.",
    targetElement: "#messages-section",
    position: "left"
  },
  {
    title: "File Management",
    description: "Upload and manage files related to your projects with easy drag-and-drop functionality.",
    targetElement: "#file-upload-section",
    position: "right"
  },
  {
    title: "Your Account",
    description: "Manage your profile, settings, and logout from here.",
    targetElement: "#user-account-section",
    position: "top"
  }
];

export const adminTourSteps: TourStep[] = [
  {
    title: "Admin Dashboard",
    description: "Monitor all projects, customers, and system activities from this central hub.",
    targetElement: "#admin-dashboard-welcome",
    position: "bottom"
  },
  {
    title: "Project Requests",
    description: "Review, approve, edit or reject project requests from customers here.",
    targetElement: "#project-requests-section",
    position: "top"
  },
  {
    title: "Customer Management",
    description: "View and manage all registered customers and their activities.",
    targetElement: "#customers-section",
    position: "left"
  },
  {
    title: "Message Center",
    description: "Respond to customer inquiries and manage all communications in one place.",
    targetElement: "#admin-messages-section",
    position: "right"
  },
  {
    title: "Analytics Overview",
    description: "Track key metrics and statistics to monitor platform performance.",
    targetElement: "#analytics-section",
    position: "bottom"
  }
];
