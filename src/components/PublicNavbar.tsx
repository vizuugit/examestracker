import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import exLogo from "@/assets/ex-logo.png";

export const PublicNavbar = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between h-20 px-4">
        <Link to="/" className="flex items-center space-x-3 group">
          <img 
            src={exLogo} 
            alt="Exames Logo" 
            className="w-16 h-16 object-contain group-hover:scale-110 transition-transform" 
          />
          <span className="text-2xl font-bold text-white tracking-tight">Exames</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => scrollToSection('inicio')}
            className="text-gray-300 hover:text-rest-cyan transition-colors"
          >
            Início
          </button>
          <button 
            onClick={() => scrollToSection('como-funciona')}
            className="text-gray-300 hover:text-rest-cyan transition-colors"
          >
            Como Funciona
          </button>
          <Link 
            to="/about"
            className="text-gray-300 hover:text-rest-cyan transition-colors"
          >
            Sobre Nós
          </Link>
          <Button 
            className="bg-rest-blue text-white hover:bg-rest-cyan rounded-full px-6 transition-colors"
            onClick={() => navigate('/auth')}
          >
            Entrar
          </Button>
        </nav>

        <Button 
          className="md:hidden bg-rest-blue text-white hover:bg-rest-cyan rounded-full px-6 transition-colors"
          onClick={() => navigate('/auth')}
        >
          Entrar
        </Button>
      </div>
    </header>
  );
};
