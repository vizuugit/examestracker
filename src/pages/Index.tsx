import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import exLogoFull from "@/assets/ex-logo-full.png";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkFirstLogin = async () => {
      if (!loading && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_login_completed')
          .eq('id', user.id)
          .single();
        
        if (profile && !profile.first_login_completed) {
          navigate('/demo');
        } else {
          navigate('/dashboard');
        }
      }
    };
    
    checkFirstLogin();
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black">
        <div className="space-y-4 text-center">
          <Skeleton className="h-32 w-64 rounded-lg bg-white/10 mx-auto" />
          <Skeleton className="h-12 w-32 bg-white/10 mx-auto rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rest-blue/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-rest-cyan/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-12 p-8">
        <img 
          src={exLogoFull} 
          alt="Exames Logo" 
          className="h-40 mx-auto drop-shadow-2xl animate-in fade-in duration-1000"
        />
        
        <Button 
          onClick={() => navigate('/auth')}
          size="lg"
          className="px-12 py-6 text-lg font-semibold bg-rest-blue hover:bg-rest-blue/90 transition-all duration-300 hover:scale-105"
        >
          Entrar
        </Button>
      </div>
    </div>
  );
};

export default Index;