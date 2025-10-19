import { Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const PublicNavbar = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between h-20 px-4">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-12 h-12 bg-gradient-to-br from-rest-blue to-rest-cyan rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Exames</span>
        </Link>
        
        <Button 
          className="bg-rest-blue text-white hover:bg-rest-cyan rounded-full px-6 transition-colors"
          onClick={() => navigate('/auth')}
        >
          Entrar
        </Button>
      </div>
    </header>
  );
};
