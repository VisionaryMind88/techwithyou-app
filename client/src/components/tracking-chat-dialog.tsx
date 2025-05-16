import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

interface TrackingChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trackingItemId: number;
  trackingItemName: string;
}

export function TrackingChatDialog({ 
  isOpen, 
  onClose, 
  trackingItemId, 
  trackingItemName 
}: TrackingChatDialogProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  // Focus the input field when the dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/messages", {
        content: message,
        subject: `Tracking item ${trackingItemName} feedback`,
        referenceId: trackingItemId,
        referenceType: "tracking_item"
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      toast({
        title: t("messages.sentSuccessfully") || "Message sent successfully",
        description: t("messages.adminNotified") || "An administrator will respond to your message soon.",
      });
      
      setMessage("");
      onClose();
      
      // Create an activity for this message
      await apiRequest("POST", "/api/activities", {
        type: "message_sent",
        description: `Message sent about tracking item: ${trackingItemName}`,
        referenceId: trackingItemId,
        referenceType: "tracking_item"
      });
      
      // Invalidate queries to update any related UI
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("messages.error") || "Error",
        description: t("messages.sendError") || "Failed to send message. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t("messages.newMessage") || "New Message"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 bg-gray-100 rounded-md">
          <p className="text-sm font-medium">{t("messages.about") || "About"}: {trackingItemName}</p>
          <p className="text-sm text-gray-500">
            {t("messages.toAdmin") || "Your message will be sent to the admin team"}
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col space-y-4">
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("messages.typeMessage") || "Type your message here..."}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                {t("action.cancel") || "Cancel"}
              </Button>
              <Button type="submit" disabled={!message.trim() || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("messages.sending") || "Sending..."}
                  </>
                ) : (
                  <>
                    <SendIcon className="mr-2 h-4 w-4" />
                    {t("messages.send") || "Send Message"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}