import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, Activity, LogOut, User } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const AuthenticatedNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const scrollToSection = (sectionId: string) => {
    // Se não estiver na página inicial, navegar para lá primeiro
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
      return;
    }

    try {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        setIsMenuOpen(false);
      }
    } catch (error) {
      console.error(`Error scrolling to ${sectionId}:`, error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between h-20 px-4">
        <Link to="/dashboard" className="flex items-center space-x-3 group">
          <div className="w-12 h-12 bg-gradient-to-br from-rest-blue to-rest-cyan rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Exames</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/dashboard" className="font-medium text-white/80 hover:text-white transition-colors">
            Home
          </Link>
          <Link to="/patients" className="font-medium text-white/80 hover:text-white transition-colors">
            Pacientes
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-rest-blue text-white hover:bg-rest-cyan rounded-full px-6 transition-colors">
                <User className="w-4 h-4 mr-2" />
                Perfil
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black/95 border-white/10 text-white z-50">
              <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer hover:bg-white/10">
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/patients')} className="cursor-pointer hover:bg-white/10">
                Pacientes
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer hover:bg-white/10 text-red-400">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              to="/dashboard"
              className="font-medium text-white/90 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-4 py-3 transition-colors text-lg block"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/patients"
              className="font-medium text-white/90 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-4 py-3 transition-colors text-lg block"
              onClick={() => setIsMenuOpen(false)}
            >
              Pacientes
            </Link>
            <button 
              onClick={() => scrollToSection('contact')}
              className="font-medium text-white/90 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-4 py-3 transition-colors text-lg text-left"
            >
              Contato
            </button>
            <Button 
              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-full mt-2 py-4 text-lg"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
