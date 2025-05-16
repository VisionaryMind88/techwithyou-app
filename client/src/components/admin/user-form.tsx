import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { enhancedUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Definieer de basis schema
const baseUserSchema = z.object({
  email: z.string().email("Voer een geldig e-mailadres in"),
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().optional(),
  role: z.enum(["admin", "customer"]),
  password: z.string().optional(),
});

// Type voor de formulierwaarden
type UserFormValues = z.infer<typeof baseUserSchema>;

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any; // Gebruik any om typeproblemen te voorkomen
}

export function UserForm({ isOpen, onClose, user }: UserFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!user;

  // Schema voor nieuw gebruiker (wachtwoord verplicht)
  const newUserSchema = baseUserSchema.extend({
    password: z.string().min(1, "Wachtwoord is verplicht"),
  });

  // Schema voor het bewerken van een gebruiker (wachtwoord optioneel)
  const editUserSchema = baseUserSchema;

  // Kies het juiste schema op basis van de modus
  const schema = isEditMode ? editUserSchema : newUserSchema;

  // Initialiseer het formulier
  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "customer",
    },
  });

  // Update defaultValues wanneer de user prop verandert
  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email || "",
        password: "", // Wachtwoord altijd leeg bij bewerken
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        role: user.role || "customer",
      });
    } else {
      form.reset({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "customer",
      });
    }
  }, [user, form]);

  const onSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true);
    try {
      let response;
      
      if (isEditMode && user) {
        // Update bestaande gebruiker
        // Verwijder leeg wachtwoord veld indien niet ingevuld
        const updateData = {...values};
        if (!updateData.password) {
          delete updateData.password;
        }
        
        response = await apiRequest("PATCH", `/api/users/${user.id}`, updateData);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Fout bij bijwerken gebruiker");
        }
        
        toast({
          title: "Gebruiker bijgewerkt",
          description: "De gebruiker is succesvol bijgewerkt",
        });
      } else {
        // Maak nieuwe gebruiker aan
        response = await apiRequest("POST", "/api/auth/register", values);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Fout bij aanmaken gebruiker");
        }
        
        toast({
          title: "Gebruiker aangemaakt",
          description: "De gebruiker is succesvol aangemaakt",
        });
      }

      // Invalideer queries om gegevens te vernieuwen
      queryClient.invalidateQueries({ queryKey: ["/api/users/admin"] });
      
      // Reset formulier en sluit dialog
      form.reset();
      onClose();
    } catch (error: any) {
      console.error(`Fout bij ${isEditMode ? "bijwerken" : "aanmaken"} gebruiker:`, error);
      toast({
        title: "Fout",
        description: error.message || `Er is een fout opgetreden bij het ${isEditMode ? "bijwerken" : "aanmaken"} van de gebruiker`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Gebruiker bewerken" : "Nieuwe gebruiker toevoegen"}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Werk de gebruikersinformatie hieronder bij." 
              : "Maak een nieuw gebruikersaccount aan. Vul de informatie hieronder in."
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="gebruiker@voorbeeld.com" 
                      type="email" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEditMode ? "Wachtwoord (optioneel)" : "Wachtwoord"}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={isEditMode ? "Laat leeg om ongewijzigd te laten" : "Voer wachtwoord in"} 
                      type="password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voornaam</FormLabel>
                    <FormControl>
                      <Input placeholder="Jan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Achternaam</FormLabel>
                    <FormControl>
                      <Input placeholder="Jansen" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gebruikersrol</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Beheerder</SelectItem>
                      <SelectItem value="customer">Klant</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuleren
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Gebruiker bijwerken" : "Gebruiker aanmaken"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}