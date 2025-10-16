import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Instagram, Linkedin, Twitter, Youtube, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import OwnersOnlyDialog from "./OwnersOnlyDialog";

const Footer = () => {
  const [isOwnersDialogOpen, setIsOwnersDialogOpen] = useState(false);
  
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h3 className="text-xl font-bold mb-6 text-white tracking-tight">REST RECOVERY</h3>
            <p className="text-white/70 mb-6">
              Leading the recovery revolution with cutting-edge technology and proven methodologies.
              Join our community of wellness enthusiasts and recovery professionals.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/restrecoverywellness/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://www.instagram.com/restrecoverywellness/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://www.instagram.com/restrecoverywellness/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="https://www.instagram.com/restrecoverywellness/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="https://www.instagram.com/restrecoverywellness/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors" aria-label="YouTube">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6 text-white tracking-tight">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => setIsOwnersDialogOpen(true)}
                  className="text-white/70 hover:text-white transition-opacity flex items-center gap-2"
                >
                  <Lock size={16} />
                  Owners Only
                </button>
              </li>
              <li><a href="#" className="text-white/70 hover:text-white transition-opacity">About Us</a></li>
              <li><a href="#" className="text-white/70 hover:text-white transition-opacity">License Opportunities</a></li>
              <li><a href="#" className="text-white/70 hover:text-white transition-opacity">Products</a></li>
              <li><a href="#" className="text-white/70 hover:text-white transition-opacity">Locations</a></li>
              <li><a href="#" className="text-white/70 hover:text-white transition-opacity">Contact</a></li>
              <li><a href="#" className="text-white/70 hover:text-white transition-opacity">Press</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6 text-white tracking-tight">Legal</h3>
            <ul className="space-y-3">
              <li><a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-opacity">Privacy Policy</a></li>
              <li><a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-opacity">Terms of Service</a></li>
              <li><a href="/license-disclosure" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-opacity">License Disclosure</a></li>
              <li><a href="/returns-policy" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-opacity">Return Policy</a></li>
              <li><a href="/accessibility" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-opacity">Accessibility</a></li>
              <li><a href="/cookie-policy" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-opacity">Cookie Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6 text-white tracking-tight">Subscribe</h3>
            <p className="text-white/70 mb-4">
              Get the latest news and special offers.
            </p>
            <form className="flex flex-col space-y-4">
              <Input
                type="email"
                placeholder="Your email"
                className="bg-white/5 border-white/10 placeholder:text-white/50 text-white"
              />
              <Button variant="secondary" className="bg-white text-black hover:bg-white/90 rounded-full">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-12 pt-8 text-center">
          <p className="text-white/70">
            &copy; {new Date().getFullYear()} REST RECOVERY Wellness. All rights reserved.
          </p>
        </div>
      </div>
      
      <OwnersOnlyDialog open={isOwnersDialogOpen} onOpenChange={setIsOwnersDialogOpen} />
    </footer>
  );
};

export default Footer;
