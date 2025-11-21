import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import exLogo from "@/assets/ex-logo.png";

interface PublicNavbarProps {
  showOnlyBackButton?: boolean;
}

export const PublicNavbar = ({ showOnlyBackButton = false }: PublicNavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavigateToSection = (sectionId: string) => {
    if (location.pathname === '/') {
      scrollToSection(sectionId);
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
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
        
        {showOnlyBackButton ? (
          <Button 
            onClick={() => navigate('/')}
            variant="ghost"
            size="icon"
            className="bg-gradient-to-br from-rest-blue to-rest-cyan text-white hover:from-rest-cyan hover:to-rest-blue rounded-full w-10 h-10 transition-all duration-200 ease-in-out hover:scale-110"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : (
          <>
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => handleNavigateToSection('inicio')}
                className="text-gray-300 hover:text-rest-cyan transition-colors"
              >
                Início
              </button>
              <button 
                onClick={() => handleNavigateToSection('como-funciona')}
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
          </>
        )}
      </div>
    </header>
  );
};
