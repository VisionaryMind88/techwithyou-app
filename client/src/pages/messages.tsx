import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Message, User } from "@shared/schema";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search,
  MessageSquare, 
  SendIcon
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function MessagesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();

  // Fetch recent messages
  // Force authenticate before rendering
  useEffect(() => {
    if (!user) {
      // This will redirect to auth page via the Router component's logic
      return;
    }
  }, [user]);

  const { 
    data: messagesData = [], 
    isLoading: isLoadingMessages,
    refetch: refetchMessages
  } = useQuery<Array<Message & { sender: User }>>({
    queryKey: ['/api/messages/recent'],
    enabled: !!user?.id,
  });
  
  // Handle chat selection and mark messages as read
  const handleSelectChat = async (projectId: number) => {
    setSelectedChat(projectId);
    
    try {
      // Find unread messages for this project that weren't sent by the current user
      const unreadMessages = messagesByProject[projectId]?.filter(
        msg => !msg.isRead && msg.senderId !== user?.id
      ) || [];
      
      // Mark each unread message as read
      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map(async (message) => {
            await apiRequest('PATCH', `/api/messages/${message.id}/read`);
          })
        );
        
        // Refresh messages after marking as read
        refetchMessages();
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Group messages by project
  const messagesByProject = messagesData.reduce<Record<number, Array<Message & { sender: User }>>>((acc, message) => {
    if (!acc[message.projectId]) {
      acc[message.projectId] = [];
    }
    acc[message.projectId].push(message);
    return acc;
  }, {});

  const projectChats = Object.entries(messagesByProject).map(([projectId, messages]) => {
    const latestMessage = messages[messages.length - 1];
    const unreadCount = messages.filter(m => !m.isRead && m.senderId !== user?.id).length;
    
    return {
      projectId: Number(projectId),
      projectName: `Project ${projectId}`, // Simplified as we don't have project name in the Message type
      latestMessage: latestMessage.content,
      timestamp: latestMessage.createdAt,
      unreadCount
    };
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user?.id) return;
    
    try {
      const messageData = {
        content: newMessage.trim(),
        projectId: selectedChat,
        senderId: user.id, // This will be overridden by the server
        isRead: false
      };
      
      // Send a ping to keep the session alive
      try {
        await fetch('/api/health', { 
          credentials: 'include',
          method: 'GET',
          headers: {
            'X-Session-Keep-Alive': 'true'
          }
        });
      } catch (pingError) {
        console.log("Session ping failed, continuing anyway:", pingError);
      }
      
      // Send the message directly without the pre-check
      const messageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-By': 'message-form', // Custom header to identify the request
          'X-Preserve-Session': 'true'       // Signal to the server to preserve the session
        },
        body: JSON.stringify(messageData),
        credentials: 'include',
        cache: 'no-cache',
        mode: 'same-origin' // Enforce same-origin to ensure cookies are sent
      });
      
      // Clear the input field immediately on successful send
      if (messageResponse.ok) {
        setNewMessage("");
        
        // Invalidate queries to refresh the messages
        queryClient.invalidateQueries({ queryKey: ['/api/messages/recent'] });
        return;
      }
      
      // Handle errors
      if (messageResponse.status === 401) {
        console.log("Authentication failed when sending message");
        
        // Try to refresh the auth state before giving up
        try {
          // Try to re-authenticate silently
          const refreshResult = await fetch('/api/auth/user', {
            credentials: 'include',
            cache: 'no-cache',
            headers: {
              'X-Auth-Refresh': 'true'
            }
          });
          
          if (refreshResult.ok) {
            // Auth refreshed, try to send the message again
            toast({
              title: "Retrying",
              description: "Reconnecting to your session...",
            });
            
            setTimeout(() => {
              handleSendMessage(); // Try again
            }, 500);
            return;
          }
        } catch (refreshError) {
          console.error("Auth refresh error:", refreshError);
        }
        
        // If we get here, the refresh failed
        toast({
          title: "Session expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive"
        });
        
        // Short delay before reload to allow toast to be seen
        setTimeout(() => window.location.href = '/auth', 1500);
        return;
      }
      
      throw new Error(`Error sending message: ${messageResponse.statusText}`);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          </div>
        </header>
        
        {/* Messages Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r bg-white flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {isLoadingMessages ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : projectChats.length > 0 ? (
                <div>
                  {projectChats.map((chat) => (
                    <button
                      key={chat.projectId}
                      className={`w-full text-left p-4 border-b hover:bg-gray-50 flex items-start space-x-3 ${
                        selectedChat === chat.projectId ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleSelectChat(chat.projectId)}
                    >
                      <Avatar>
                        <AvatarFallback className="bg-primary-100 text-primary-700">
                          {chat.projectName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="font-medium truncate">{chat.projectName}</p>
                          <span className="text-xs text-gray-500">
                            {format(new Date(chat.timestamp || Date.now()), 'MMM d')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{chat.latestMessage}</p>
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="bg-primary text-white text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center">
                          {chat.unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-gray-900 font-medium mb-1">No messages yet</h3>
                  <p className="text-gray-500 mb-4 max-w-xs">
                    You don't have any active conversations. Messages related to your projects will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="bg-white p-4 border-b flex items-center">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="bg-primary-100 text-primary-700">
                      {projectChats.find(c => c.projectId === selectedChat)?.projectName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-medium">
                      {projectChats.find(c => c.projectId === selectedChat)?.projectName}
                    </h2>
                  </div>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  {messagesByProject[selectedChat]?.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex mb-4 ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.senderId !== user?.id && (
                        <Avatar className="h-8 w-8 mr-2 mt-1">
                          <AvatarFallback>
                            {message.sender.firstName?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        {message.senderId !== user?.id && (
                          <p className="text-xs text-gray-500 mb-1">
                            {message.sender.firstName} {message.sender.lastName}
                          </p>
                        )}
                        <div 
                          className={`p-3 rounded-lg max-w-md ${
                            message.senderId === user?.id 
                              ? 'bg-primary text-white rounded-tr-none' 
                              : 'bg-white border rounded-tl-none'
                          }`}
                        >
                          <p>{message.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(message.createdAt || Date.now()), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Message Input */}
                <div className="bg-white p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!newMessage.trim()}
                    >
                      <SendIcon className="h-4 w-4" />
                      <span className="sr-only">Send</span>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">Select a conversation</h3>
                <p className="text-gray-500 max-w-sm text-center">
                  Choose a conversation from the list to view messages and respond.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}