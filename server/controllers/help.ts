import { Request, Response, Express } from "express";
import { AuthRequest } from "../middleware/auth";
import { storage } from "../storage";

// Define the contextual help data structure
interface ContextualHelp {
  contextId: string;
  language: string;
  title: string;
  content: string;
}

// Store pre-defined contextual help messages
const helpMessages: Record<string, Record<string, ContextualHelp>> = {
  nl: {
    dashboard: {
      contextId: "dashboard",
      language: "nl",
      title: "Dashboard Hulp",
      content: "Welkom bij je dashboard. Hier kun je een overzicht zien van al je projecten, recent activiteit, en berichten. Gebruik de zijbalk om naar verschillende delen van de applicatie te navigeren."
    },
    projects: {
      contextId: "projects",
      language: "nl",
      title: "Projecten Hulp",
      content: "Op deze pagina kun je al je projecten bekijken en beheren. Klik op een project om details te zien, of maak een nieuw project aan met de knop 'Nieuw Project'."
    },
    messages: {
      contextId: "messages",
      language: "nl",
      title: "Berichten Hulp",
      content: "Hier kun je communiceren met het projectteam. Alle berichten worden opgeslagen en zijn altijd terug te vinden per project."
    },
    files: {
      contextId: "files",
      language: "nl",
      title: "Bestanden Hulp",
      content: "Upload en beheer bestanden voor je projecten. Je kunt meerdere versies van bestanden bijhouden en bekijken wie welke wijzigingen heeft aangebracht."
    },
    tracking: {
      contextId: "tracking",
      language: "nl",
      title: "Tracking Hulp",
      content: "Live tracking geeft je realtime inzicht in de voortgang van je projecten. Schakel items in of uit om bij te houden waar je aan werkt."
    },
    settings: {
      contextId: "settings",
      language: "nl",
      title: "Instellingen Hulp",
      content: "Pas je accountinstellingen aan, wijzig je wachtwoord, en beheer je gebruikersprofiel vanuit dit scherm."
    },
    profile: {
      contextId: "profile",
      language: "nl",
      title: "Profiel Hulp",
      content: "Beheer je persoonlijke informatie en profielfoto. Deze informatie is zichtbaar voor teamleden."
    }
  },
  en: {
    dashboard: {
      contextId: "dashboard",
      language: "en",
      title: "Dashboard Help",
      content: "Welcome to your dashboard. Here you can see an overview of all your projects, recent activity, and messages. Use the sidebar to navigate to different parts of the application."
    },
    projects: {
      contextId: "projects",
      language: "en",
      title: "Projects Help",
      content: "On this page you can view and manage all your projects. Click on a project to see details, or create a new project using the 'New Project' button."
    },
    messages: {
      contextId: "messages",
      language: "en",
      title: "Messages Help",
      content: "Here you can communicate with the project team. All messages are stored and can always be found per project."
    },
    files: {
      contextId: "files",
      language: "en",
      title: "Files Help",
      content: "Upload and manage files for your projects. You can keep track of multiple versions of files and see who made which changes."
    },
    tracking: {
      contextId: "tracking",
      language: "en",
      title: "Tracking Help",
      content: "Live tracking gives you real-time insight into the progress of your projects. Toggle items on or off to keep track of what you're working on."
    },
    settings: {
      contextId: "settings",
      language: "en",
      title: "Settings Help",
      content: "Adjust your account settings, change your password, and manage your user profile from this screen."
    },
    profile: {
      contextId: "profile",
      language: "en",
      title: "Profile Help",
      content: "Manage your personal information and profile picture. This information is visible to team members."
    }
  }
};

// Common questions and answers
const faqData: Record<string, Record<string, { question: string; answer: string }>> = {
  nl: {
    projectCreate: {
      question: "Hoe maak ik een nieuw project aan?",
      answer: "Ga naar de 'Projecten' pagina en klik op de 'Nieuw Project' knop. Vul de projectgegevens in en klik op 'Aanmaken'."
    },
    fileUpload: {
      question: "Hoe kan ik bestanden uploaden?",
      answer: "Open een project, ga naar het 'Bestanden' tabblad, en klik op 'Bestand uploaden'. Kies een bestand van je computer en klik op 'Uploaden'."
    },
    messageAdmin: {
      question: "Hoe kan ik contact opnemen met een beheerder?",
      answer: "Open het berichtenscherm via de zijbalk of binnen een project. Klik op 'Nieuw Bericht' en selecteer een ontvanger."
    },
    passwordChange: {
      question: "Hoe wijzig ik mijn wachtwoord?",
      answer: "Ga naar 'Instellingen' in de zijbalk, klik op het tabblad 'Wachtwoord', vul je huidige en nieuwe wachtwoord in, en klik op 'Opslaan'."
    },
    trackingUse: {
      question: "Hoe gebruik ik de tracking functie?",
      answer: "Ga naar de 'Tracking' pagina via de zijbalk. Klik op een item om het te activeren of deactiveren. Je kunt ook nieuwe tracking items aanmaken."
    }
  },
  en: {
    projectCreate: {
      question: "How do I create a new project?",
      answer: "Go to the 'Projects' page and click the 'New Project' button. Fill in the project details and click 'Create'."
    },
    fileUpload: {
      question: "How can I upload files?",
      answer: "Open a project, go to the 'Files' tab, and click 'Upload File'. Choose a file from your computer and click 'Upload'."
    },
    messageAdmin: {
      question: "How can I contact an administrator?",
      answer: "Open the messaging screen via the sidebar or within a project. Click 'New Message' and select a recipient."
    },
    passwordChange: {
      question: "How do I change my password?",
      answer: "Go to 'Settings' in the sidebar, click on the 'Password' tab, fill in your current and new password, and click 'Save'."
    },
    trackingUse: {
      question: "How do I use the tracking feature?",
      answer: "Go to the 'Tracking' page via the sidebar. Click on an item to activate or deactivate it. You can also create new tracking items."
    }
  }
};

export function registerHelpRoutes(app: Express) {
  // Get contextual help based on context ID
  app.post("/api/help/contextual", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { contextId } = req.body;
      if (!contextId) {
        return res.status(400).json({ message: "Context ID is required" });
      }

      // Get user's preferred language
      const userLang = req.user.language || "nl"; // Default to Dutch
      const lang = userLang === "en" ? "en" : "nl";

      // First try to get contextual help from the database
      // This could be extended in the future to store dynamic help content
      
      // For now, use pre-defined help messages
      const helpContent = helpMessages[lang][contextId];
      
      if (helpContent) {
        return res.status(200).json({
          message: helpContent.content,
          title: helpContent.title
        });
      } else {
        // Fallback to general help if specific context not found
        return res.status(200).json({
          message: lang === "en" 
            ? "Help information for this section is not available yet." 
            : "Hulpinformatie voor dit gedeelte is nog niet beschikbaar.",
          title: lang === "en" ? "Help" : "Hulp"
        });
      }
    } catch (error) {
      console.error("Error fetching contextual help:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ask an AI-powered question
  app.post("/api/help/ask", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { question, contextId } = req.body;
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }

      // Get user's preferred language
      const userLang = req.user.language || "nl"; // Default to Dutch
      const lang = userLang === "en" ? "en" : "nl";
      
      // Check if we have a pre-defined answer for this question
      // This is a simple implementation. In a real-world scenario,
      // we would use an actual AI service like Perplexity, OpenAI, etc.
      
      const lowerQuestion = question.toLowerCase();
      let answer = "";
      
      // Simple pattern matching for common questions
      if (lowerQuestion.includes("project") && 
          (lowerQuestion.includes("create") || lowerQuestion.includes("new") || 
           lowerQuestion.includes("maken") || lowerQuestion.includes("nieuw"))) {
        answer = faqData[lang].projectCreate.answer;
      } 
      else if (lowerQuestion.includes("file") || lowerQuestion.includes("upload") || 
               lowerQuestion.includes("bestand") || lowerQuestion.includes("uploaden")) {
        answer = faqData[lang].fileUpload.answer;
      }
      else if ((lowerQuestion.includes("message") || lowerQuestion.includes("bericht")) && 
               (lowerQuestion.includes("admin") || lowerQuestion.includes("beheerder"))) {
        answer = faqData[lang].messageAdmin.answer;
      }
      else if (lowerQuestion.includes("password") || lowerQuestion.includes("wachtwoord")) {
        answer = faqData[lang].passwordChange.answer;
      }
      else if (lowerQuestion.includes("track") || lowerQuestion.includes("volgen")) {
        answer = faqData[lang].trackingUse.answer;
      }
      else {
        // If no matching question found, provide a default response
        answer = lang === "en"
          ? "I'm sorry, I don't have a specific answer to that question. Please try asking another question or contact support for more help."
          : "Het spijt me, ik heb geen specifiek antwoord op die vraag. Probeer een andere vraag te stellen of neem contact op met ondersteuning voor meer hulp.";
      }
      
      // In a real implementation, you would connect to an AI service here
      // For example, if Perplexity integration is available:
      /*
      if (process.env.PERPLEXITY_API_KEY) {
        try {
          const aiResponse = await callPerplexityApi(question, contextId, lang);
          return res.status(200).json({ answer: aiResponse });
        } catch (aiError) {
          console.error("Error calling AI service:", aiError);
          // Fallback to pre-defined answers if AI fails
        }
      }
      */
      
      // Log the question for future improvement of the help system
      await storage.logHelpQuestion({
        userId: req.user.id,
        question,
        contextId,
        timestamp: new Date(),
        answer
      });
      
      return res.status(200).json({ answer });
      
    } catch (error) {
      console.error("Error processing help question:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add a help experience rating
  app.post("/api/help/feedback", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { helpId, rating, comment } = req.body;
      if (!helpId || !rating) {
        return res.status(400).json({ message: "Help ID and rating are required" });
      }

      // Store the feedback in the database
      await storage.saveHelpFeedback({
        userId: req.user.id,
        helpId,
        rating,
        comment: comment || "",
        timestamp: new Date()
      });

      return res.status(200).json({ message: "Feedback received, thank you!" });
    } catch (error) {
      console.error("Error saving help feedback:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
}

// Helper function to call Perplexity API (to be implemented when API key is available)
async function callPerplexityApi(question: string, contextId: string, language: string): Promise<string> {
  // This would be implemented when the Perplexity API key is available
  // For now, return a placeholder
  return language === "en"
    ? "This is a placeholder response from the AI. When the Perplexity API is configured, this will provide intelligent answers to your questions."
    : "Dit is een tijdelijke reactie van de AI. Wanneer de Perplexity API is geconfigureerd, zal dit intelligente antwoorden geven op je vragen.";
}