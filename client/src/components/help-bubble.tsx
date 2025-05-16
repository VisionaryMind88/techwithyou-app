import { useState, useEffect, useRef } from "react";
import { HelpCircle, X, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";

interface HelpBubbleProps {
  contextId: string;  // Unique identifier for the context/page where this help is shown
  placement?: "top" | "bottom" | "left" | "right";
  children?: React.ReactNode;
  customTrigger?: React.ReactNode;
  showInitial?: boolean;  // Whether to show the help bubble initially
  delay?: number;  // Delay in ms before showing the initial help bubble
}

export function HelpBubble({
  contextId,
  placement = "bottom",
  children,
  customTrigger,
  showInitial = false,
  delay = 3000
}: HelpBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAIBubble, setShowAIBubble] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [helpQuestionId, setHelpQuestionId] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{question: string, answer: string}>>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Show help bubble initially after delay if showInitial is true
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showInitial) {
      timer = setTimeout(() => {
        setIsOpen(true);
      }, delay);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showInitial, delay]);
  
  // Get contextual help based on page/component context
  const getContextualHelp = async () => {
    if (!contextId) return;
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest(
        "POST", 
        "/api/help/contextual", 
        { contextId }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAiResponse(data.message || t('help.defaultHelp'));
      } else {
        // Fallback to pre-defined help text for this context
        setAiResponse(getLocalHelpText(contextId));
      }
    } catch (error) {
      console.error("Error fetching contextual help:", error);
      setAiResponse(getLocalHelpText(contextId));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Ask AI a specific question
  const askQuestion = async () => {
    if (!userQuestion.trim()) {
      toast({
        title: t('help.emptyQuestion'),
        description: t('help.typeQuestion'),
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    const question = userQuestion.trim();
    
    try {
      const response = await apiRequest(
        "POST", 
        "/api/help/ask", 
        { 
          question,
          contextId 
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const answer = data.answer || t('help.noAnswer');
        
        // Update chat history
        setChatHistory(prev => [...prev, { question, answer }]);
        
        // Set response and clear user input
        setAiResponse(answer);
        setUserQuestion("");
        
        // Store the question ID for feedback
        if (data.questionId) {
          setHelpQuestionId(data.questionId);
          setShowFeedback(true);
        }
        
        // Scroll to bottom
        setTimeout(() => {
          if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
          }
        }, 100);
      } else {
        // Fallback to static answer if AI is not available
        setAiResponse(t('help.aiUnavailable'));
      }
    } catch (error) {
      console.error("Error asking question:", error);
      setAiResponse(t('help.errorAskingQuestion'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Submit feedback about AI response
  const submitFeedback = async (rating: number) => {
    if (!helpQuestionId) return;
    
    try {
      await apiRequest(
        "POST",
        "/api/help/feedback",
        {
          helpId: helpQuestionId,
          rating,
          comment: "" // Optional comment field could be added later
        }
      );
      
      toast({
        title: t('help.feedbackReceived'),
        description: t('help.thankYouFeedback'),
      });
      
      // Hide feedback UI after submission
      setShowFeedback(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: t('help.feedbackError'),
        description: t('help.tryAgainLater'),
        variant: "destructive"
      });
    }
  };
  
  // Get local help text based on contextId when API is not available
  const getLocalHelpText = (contextId: string) => {
    // Predefined help messages for common contexts
    const helpMap: Record<string, string> = {
      "dashboard": t('help.dashboardHelp'),
      "projects": t('help.projectsHelp'),
      "messages": t('help.messagesHelp'),
      "settings": t('help.settingsHelp'),
      "tracking": t('help.trackingHelp'),
      "files": t('help.filesHelp'),
      "profile": t('help.profileHelp')
    };
    
    return helpMap[contextId] || t('help.generalHelp');
  };
  
  const handleOpen = () => {
    setIsOpen(true);
    if (!aiResponse) {
      getContextualHelp();
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {customTrigger ? (
          <span onClick={handleOpen}>
            {customTrigger}
          </span>
        ) : (
          <motion.button
            className="p-2 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 focus:outline-none"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleOpen}
          >
            <HelpCircle className="h-5 w-5" />
          </motion.button>
        )}
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0 border-blue-200 bg-blue-50 shadow-xl rounded-xl overflow-hidden" 
        side={placement}
        sideOffset={10}
      >
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center bg-blue-500 text-white p-3">
              <h3 className="text-sm font-medium">
                {t('help.title')}
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-blue-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-4">
              {children ? (
                <div className="mb-4">{children}</div>
              ) : (
                <div className="mb-4 max-h-60 overflow-y-auto" ref={chatRef}>
                  {chatHistory.length > 0 ? (
                    <div className="space-y-3">
                      {chatHistory.map((chat, index) => (
                        <div key={index} className="space-y-2">
                          <div className="bg-blue-100 p-2 rounded-md text-xs text-gray-800">
                            <span className="font-medium">{t('help.userQuestion')}:</span> {chat.question}
                          </div>
                          <div className="bg-white p-2 rounded-md text-xs text-gray-700 border border-blue-200">
                            <span className="font-medium">{t('help.aiResponse')}:</span> {chat.answer}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {isLoading ? (
                        <div className="flex justify-center items-center py-4">
                          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700">{aiResponse || t('help.loading')}</p>
                      )}
                    </>
                  )}
                  
                  {/* Feedback UI */}
                  {showFeedback && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-md">
                      <p className="text-xs text-gray-600 mb-1">{t('help.wasHelpful')}</p>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => submitFeedback(1)}
                          className="flex items-center p-1 text-xs text-green-600 hover:bg-green-50 rounded"
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          {t('help.yes')}
                        </button>
                        <button 
                          onClick={() => submitFeedback(0)}
                          className="flex items-center p-1 text-xs text-red-600 hover:bg-red-50 rounded"
                        >
                          <ThumbsDown className="w-3 h-3 mr-1" />
                          {t('help.no')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* AI Chat Interface */}
              <div className="mt-4">
                <button
                  onClick={() => setShowAIBubble(!showAIBubble)}
                  className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {showAIBubble ? t('help.hideAI') : t('help.askAI')}
                </button>
                
                {showAIBubble && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    <div className="flex">
                      <input
                        type="text"
                        value={userQuestion}
                        onChange={(e) => setUserQuestion(e.target.value)}
                        placeholder={t('help.askPlaceholder')}
                        className="w-full p-2 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            askQuestion();
                          }
                        }}
                      />
                      <button
                        onClick={askQuestion}
                        disabled={isLoading}
                        className="px-3 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 disabled:bg-blue-300"
                      >
                        {isLoading ? "..." : "→"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
}