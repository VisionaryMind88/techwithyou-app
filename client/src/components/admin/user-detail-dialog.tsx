import { User } from "@shared/schema";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, AtSign, MapPin, Phone, User as UserIcon } from "lucide-react";

interface UserDetailDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailDialog({ user, isOpen, onClose }: UserDetailDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gebruiker Details</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          <Avatar className="h-24 w-24 mb-4">
            {user.profilePicture ? (
              <AvatarImage src={user.profilePicture} alt={user.firstName || user.email} />
            ) : null}
            <AvatarFallback className="text-2xl bg-primary text-white">
              {(user.firstName?.[0] || '') + (user.lastName?.[0] || '') || user.email?.[0]}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-xl font-semibold">
            {user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : 'Naamloos'}
          </h2>
          
          <span className="text-gray-600 mt-1">{user.email}</span>
          
          <Badge 
            className={`mt-3 ${
              user.role === 'admin' 
                ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' 
                : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
            }`}
          >
            {user.role === 'admin' ? 'Administrator' : 'Klant'}
          </Badge>
        </div>
        
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Aangemaakt op</p>
                <p className="text-sm text-gray-500">
                  {user.createdAt 
                    ? format(new Date(user.createdAt), 'dd MMM yyyy') 
                    : 'Onbekend'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <AtSign className="h-4 w-4 mr-2 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Authenticatie</p>
                <p className="text-sm text-gray-500">
                  {user.provider || 'Lokaal account'}
                </p>
              </div>
            </div>
          </div>
          
          {user.provider && user.providerId && (
            <div className="flex items-center mt-2">
              <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Provider ID</p>
                <p className="text-sm text-gray-500 font-mono">{user.providerId}</p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Sluiten</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}