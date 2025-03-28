
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { 
  BookIcon, 
  MicIcon, 
  FolderIcon, 
  EditIcon, 
  ArrowRightIcon 
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
          <span className="text-primary">Note</span>Taking Made Simple
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
          The ultimate note-taking solution with voice input, organization, and real-time editing.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            size="lg" 
            onClick={() => navigate(user ? "/" : "/auth")}
            className="px-8 py-6 text-lg"
          >
            {user ? "My Notes" : "Get Started"}
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => navigate("/contact")}
            className="px-8 py-6 text-lg"
          >
            Contact Us
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold text-center mb-16">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard 
            icon={<BookIcon className="h-12 w-12 text-primary" />}
            title="Smart Notes"
            description="Create and edit notes with a beautiful, distraction-free editor."
          />
          <FeatureCard 
            icon={<MicIcon className="h-12 w-12 text-primary" />}
            title="Voice Input"
            description="Capture your thoughts by speaking with real-time speech-to-text."
          />
          <FeatureCard 
            icon={<FolderIcon className="h-12 w-12 text-primary" />}
            title="Organization"
            description="Keep your notes organized with folders and easy navigation."
          />
          <FeatureCard 
            icon={<EditIcon className="h-12 w-12 text-primary" />}
            title="Rich Formatting"
            description="Format your notes with bold, italic, lists, and more."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="bg-primary/10 rounded-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto">
            Join thousands of users who trust our platform for their note-taking needs.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate(user ? "/" : "/auth")}
            className="mt-8 px-8 py-6 text-lg"
          >
            {user ? "Open App" : "Sign Up Free"}
          </Button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-card rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border">
      <div className="flex flex-col items-center text-center">
        {icon}
        <h3 className="mt-4 text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
