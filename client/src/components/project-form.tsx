import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { insertProjectSchema } from "@shared/schema";
import { useAuth } from "@/context/auth-context";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Extend the project schema with validation
const projectFormSchema = insertProjectSchema.extend({
  type: z.string().min(1, "Project type is required"),
  name: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().min(10, "Please provide a detailed description"),
  budget: z.string().min(1, "Budget range is required"),
  targetDate: z.string().min(1, "Target completion date is required"),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectForm({ isOpen, onClose }: ProjectFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { user } = useAuth();
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      type: "",
      name: "",
      description: "",
      budget: "",
      targetDate: "",
      userId: user?.id
    },
  });

  const onSubmit = async (values: ProjectFormValues) => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please login to submit projects",
        variant: "destructive",
      });
      return;
    }

    try {
      // Submit project with userId from user context
      const projectResponse = await apiRequest('POST', '/api/projects', {
        ...values,
        // No need to set userId here as it's already included in values
      });
      
      const newProject = await projectResponse.json();
      
      // Upload files if any
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('files', file));
        formData.append('projectId', newProject.id.toString());
        
        try {
          const fileResponse = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });
          
          if (!fileResponse.ok) {
            throw new Error(`File upload failed: ${fileResponse.statusText}`);
          }
        } catch (fileError) {
          console.error("Error uploading files:", fileError);
          toast({
            title: "File upload issue",
            description: "Project was created but there was an issue uploading files",
            variant: "destructive",
          });
        }
      }
      
      // Success message
      toast({
        title: "Project submitted",
        description: "Your project request has been submitted successfully",
      });
      
      // Reset form and close dialog
      form.reset();
      setSelectedFiles([]);
      
      // Invalidate all project-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/projects/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/admin'] });
      
      onClose();
    } catch (error) {
      console.error("Error submitting project:", error);
      toast({
        title: "Submission failed",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleFilesAdded = (files: File[]) => {
    setSelectedFiles(files);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Create New Project</DialogTitle>
          <DialogDescription>
            Fill out the form below to request a new project.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Project Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="website">Website Design</SelectItem>
                      <SelectItem value="mobile_app">Mobile App Development</SelectItem>
                      <SelectItem value="ecommerce">E-commerce Solution</SelectItem>
                      <SelectItem value="seo">SEO Optimization</SelectItem>
                      <SelectItem value="custom_software">Custom Software</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Project Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Project Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please describe your project requirements in detail"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Budget Range */}
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Range</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Less than $1,000">Less than $1,000</SelectItem>
                      <SelectItem value="$1,000 - $5,000">$1,000 - $5,000</SelectItem>
                      <SelectItem value="$5,000 - $10,000">$5,000 - $10,000</SelectItem>
                      <SelectItem value="$10,000 - $25,000">$10,000 - $25,000</SelectItem>
                      <SelectItem value="$25,000+">$25,000+</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Target Completion Date */}
            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Completion Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* File Upload */}
            <div>
              <FormLabel>Attachments</FormLabel>
              <FileUpload
                onFilesAdded={handleFilesAdded}
                maxSize={2 * 1024 * 1024 * 1024} // 2GB
              />
            </div>
            
            {/* Form Actions */}
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Submitting..." : "Submit Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
