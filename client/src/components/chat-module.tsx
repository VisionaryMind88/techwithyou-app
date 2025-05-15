import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Paperclip, Send, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Message, User, Project, InsertMessage } from "@shared/schema";
import { useAuth } from "@/context/auth-context";
import { chatWebSocket } from "@/lib/websocket";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessageProps {
  message: Message & { sender: User };
  currentUserId: number;
}

function ChatMessage({ message, currentUserId }: ChatMessageProps) {
  const isCurrentUser = message.senderId === currentUserId;
  const timestamp = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });

  return (
    <div className={`flex items-start mb-4 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {message.sender.firstName?.[0] || message.sender.email?.[0] || '?'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`${isCurrentUser ? "mr-3" : "ml-3"} max-w-[80%]`}>
        <div className={`p-3 rounded-lg ${
          isCurrentUser ? "bg-primary-600" : "bg-gray-100"
        }`}>
          <p className={`text-sm ${
            isCurrentUser ? "text-white" : "text-gray-800"
          }`}>
            {message.content}
          </p>
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2">
              {message.attachments.map((file: any, index: number) => (
                <div 
                  key={index} 
                  className={`flex items-center mt-1 ${
                    isCurrentUser ? "text-white" : "text-gray-800"
                  }`}
                >
                  <svg 
                    className={`h-4 w-4 mr-1 ${
                      isCurrentUser ? "text-primary-200" : "text-gray-600"
                    }`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                  <div>
                    <p className="text-sm">{file.name}</p>
                    <p className={`text-xs ${
                      isCurrentUser ? "text-primary-200" : "text-gray-600"
                    }`}>
                      {file.size}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <span className={`text-xs text-gray-500 mt-1 ${
          isCurrentUser ? "text-right block" : ""
        }`}>
          {isCurrentUser ? "You" : `${message.sender.firstName}`} • {timestamp}
        </span>
      </div>
    </div>
  );
}

interface TimestampDividerProps {
  date: Date;
}

function TimestampDivider({ date }: TimestampDividerProps) {
  const isToday = date.toDateString() === new Date().toDateString();
  const isYesterday = new Date(date.getTime() - 86400000).toDateString() === new Date().toDateString();
  
  let label = date.toLocaleDateString();
  if (isToday) label = "Today";
  if (isYesterday) label = "Yesterday";

  return (
    <div className="flex items-center py-2">
      <Separator className="flex-grow" />
      <span className="flex-shrink mx-4 text-xs text-gray-400">{label}</span>
      <Separator className="flex-grow" />
    </div>
  );
}

interface ChatModuleProps {
  projectId: number;
  projectName: string;
  messages: Array<Message & { sender: User }>;
  isLoading?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatModule({
  projectId,
  projectName,
  messages: initialMessages,
  isLoading = false,
  isOpen,
  onClose
}: ChatModuleProps) {
  const [messages, setMessages] = useState<Array<Message & { sender: User }>>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  // Group messages by date
  const messagesByDate = messages.reduce<Record<string, Array<Message & { sender: User }>>>((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Setup WebSocket listener
  useEffect(() => {
    if (!projectId) return;
    
    const unsubscribe = chatWebSocket.onMessage((message) => {
      if (message.projectId === projectId) {
        // Add the new message to the list if not already present
        setMessages(prev => {
          const exists = prev.some(m => m.id === message.id);
          if (!exists && message.sender) {
            return [...prev, message as Message & { sender: User }];
          }
          return prev;
        });
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [projectId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !projectId) return;
    
    setIsSubmitting(true);
    
    try {
      const messageData: InsertMessage = {
        content: newMessage.trim(),
        projectId,
        senderId: user.id,
        attachments: null
      };
      
      // Send via API
      const response = await apiRequest('POST', '/api/messages', messageData);
      const createdMessage = await response.json();
      
      // Update local state
      setMessages(prev => [...prev, {
        ...createdMessage,
        sender: user
      }]);
      
      // Also send via WebSocket for real-time updates
      chatWebSocket.sendMessage({
        ...createdMessage,
        sender: user
      });
      
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Project Chat</DialogTitle>
            <DialogDescription>Loading messages...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 h-[80vh] max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-primary-600 px-4 py-3 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-white">Project Chat</h3>
            <p className="text-sm text-primary-100">{projectName}</p>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-white hover:text-gray-200 p-1 h-auto"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Chat Messages */}
        <div className="p-4 overflow-y-auto flex-1">
          {Object.entries(messagesByDate).map(([date, dateMessages]) => (
            <div key={date}>
              <TimestampDivider date={new Date(date)} />
              {dateMessages.map(message => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                  currentUserId={user?.id || 0} 
                />
              ))}
            </div>
          ))}
          
          {messages.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 hover:text-gray-700 p-1 h-auto"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 mx-2"
            />
            
            <Button 
              size="sm" 
              onClick={handleSendMessage}
              disabled={isSubmitting || !newMessage.trim()}
              className="p-2 h-auto"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
