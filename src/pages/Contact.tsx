
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { 
  MailIcon, 
  PhoneIcon, 
  MapPinIcon 
} from "lucide-react";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast.success("Message sent successfully!");
      setName("");
      setEmail("");
      setMessage("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-8">Contact Us</h1>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
          Have questions or feedback? We'd love to hear from you. Fill out the form below and our team will get back to you as soon as possible.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {/* Contact Form */}
          <div className="bg-card rounded-lg shadow-sm p-6 border">
            <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Your Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">
                  Message
                </label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  rows={5}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
          
          {/* Contact Information */}
          <div className="flex flex-col justify-center">
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
              
              <ContactItem
                icon={<MailIcon className="h-6 w-6 text-primary" />}
                title="Email"
                content="support@notetaking-app.com"
              />
              
              <ContactItem
                icon={<PhoneIcon className="h-6 w-6 text-primary" />}
                title="Phone"
                content="+1 (555) 123-4567"
              />
              
              <ContactItem
                icon={<MapPinIcon className="h-6 w-6 text-primary" />}
                title="Address"
                content="123 Note Street, San Francisco, CA 94107, USA"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactItem({ icon, title, content }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1">{icon}</div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-muted-foreground">{content}</p>
      </div>
    </div>
  );
}
