import { useState } from "react";
import { Message, User } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Paperclip, X } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface MessageDetailDialogProps {
  message: (Message & { sender: User }) | null;
  isOpen: boolean;
  onClose: () => void;
  onReply?: () => void;
}

export function MessageDetailDialog({ 
  message, 
  isOpen, 
  onClose, 
  onReply 
}: MessageDetailDialogProps) {
  const { t } = useLanguage();
  
  if (!message) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{t("messages.message") || "Message"}</span>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {message.sender.firstName?.[0] || message.sender.email?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="ml-3 flex-1">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-900">
                  {message.sender.firstName} {message.sender.lastName}
                  {message.sender.role === "admin" && " (Admin)"}
                </p>
                <p className="text-xs text-gray-500">
                  {message.createdAt && format(new Date(message.createdAt), 'PPpp')}
                </p>
              </div>
              
              <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200 text-gray-700">
                {message.content}
              </div>
              
              {message.attachments && (
                <div className="mt-3 flex items-center">
                  <Paperclip className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm text-blue-600">
                    {t("messages.attachment") || "Attachment"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {onReply && (
          <DialogFooter>
            <Button onClick={onReply} className="w-full sm:w-auto">
              {t("messages.reply") || "Reply"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}