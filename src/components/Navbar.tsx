
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, Activity } from "lucide-react";
import { Link } from "react-router-dom";


const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    try {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        setIsMenuOpen(false);
      }
    } catch (error) {
      console.error(`Error scrolling to ${sectionId}:`, error);
      // Fallback for cross-origin issues
      const element = document.getElementById(sectionId);
      if (element) {
        const yOffset = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({top: yOffset, behavior: 'smooth'});
        setIsMenuOpen(false);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between h-20 px-4">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-12 h-12 bg-gradient-to-br from-rest-blue to-rest-cyan rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Exames</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="font-medium text-white/80 hover:text-white transition-colors">
            Home
          </Link>
          <button 
            onClick={() => scrollToSection('contact')}
            className="font-medium text-white/80 hover:text-white transition-colors"
          >
            Contato
          </button>
        </nav>

        {/* Desktop Button */}
        <div className="hidden md:block">
          <Button 
            className="bg-rest-blue text-white hover:bg-rest-cyan rounded-full px-6 transition-colors"
          >
            Login
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-lg w-full shadow-lg py-6 border-t border-white/10 animate-fade-in">
          <div className="container mx-auto flex flex-col space-y-2 px-4">
            <Link 
              to="/"
              className="font-medium text-white/90 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-4 py-3 transition-colors text-lg block"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <button 
              onClick={() => scrollToSection('contact')}
              className="font-medium text-white/90 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-4 py-3 transition-colors text-lg text-left"
            >
              Contato
            </button>
            <Button 
              className="bg-rest-blue text-white hover:bg-rest-cyan rounded-full w-full mt-2 py-4 text-lg"
            >
              Login
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
