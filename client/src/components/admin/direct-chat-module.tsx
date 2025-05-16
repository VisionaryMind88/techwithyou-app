import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Paperclip, Send, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Message, User, InsertMessage } from "@shared/schema";
import { useAuth } from "@/context/auth-context";
import { chatWebSocket } from "@/lib/websocket";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface DirectChatMessageProps {
  message: Message & { sender: User };
  currentUserId: number;
}

function DirectChatMessage({ message, currentUserId }: DirectChatMessageProps) {
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
        </div>
        
        <span className={`text-xs text-gray-500 mt-1 ${
          isCurrentUser ? "text-right block" : ""
        }`}>
          {isCurrentUser ? "You" : `${message.sender.firstName || message.sender.email}`} • {timestamp}
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

interface DirectChatModuleProps {
  targetUser: User;
  isOpen: boolean;
  onClose: () => void;
}

export function DirectChatModule({
  targetUser,
  isOpen,
  onClose
}: DirectChatModuleProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  // Fetch direct messages between users
  const { data: messages = [], refetch: refetchMessages } = useQuery<Array<Message & { sender: User }>>({
    queryKey: ['/api/messages/direct', targetUser.id],
    enabled: isOpen && !!user?.id,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/messages/direct/${targetUser.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch direct messages');
      }
      return response.json();
    }
  });
  
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
    if (!isOpen || !user?.id) return;
    
    const unsubscribe = chatWebSocket.onMessage((message) => {
      if (
        (message.senderId === user.id && message.recipientId === targetUser.id) ||
        (message.senderId === targetUser.id && message.recipientId === user.id)
      ) {
        // Refresh messages
        refetchMessages();
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [isOpen, user?.id, targetUser.id, refetchMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;
    
    setIsSubmitting(true);
    
    try {
      const messageData: InsertMessage = {
        content: newMessage.trim(),
        projectId: 0, // No project for direct messages
        senderId: user.id,
        recipientId: targetUser.id, // Add recipient for direct messages
        attachments: null
      };
      
      // Send via API
      const response = await apiRequest('POST', '/api/messages/direct', messageData);
      
      if (!response.ok) {
        throw new Error('Failed to send direct message');
      }
      
      // Refresh messages
      refetchMessages();
      
      // Also send via WebSocket for real-time updates
      chatWebSocket.sendMessage({
        ...await response.json(),
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

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 h-[80vh] max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-primary-600 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarFallback>
                {targetUser.firstName?.[0] || targetUser.email?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg leading-6 font-medium text-white">
                {targetUser.firstName ? `${targetUser.firstName} ${targetUser.lastName || ''}` : targetUser.email}
              </h3>
              <p className="text-sm text-primary-100">{targetUser.role}</p>
            </div>
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
                <DirectChatMessage 
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