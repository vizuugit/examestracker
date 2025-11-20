import { Button } from "@/components/ui/button";
import { Menu, LogOut, User, Home, Users, Shield, Bell, Mail, Copy, Info } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { BackButton } from "@/components/BackButton";
import exLogo from "@/assets/ex-logo.png";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AuthenticatedNavbarProps {
  showBackButton?: boolean;
  backButtonPath?: string;
}

export const AuthenticatedNavbar = ({ showBackButton = false, backButtonPath = '/patients' }: AuthenticatedNavbarProps) => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("suporte@exames.co");
    toast.success("Email copiado!");
  };

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
      return;
    }

    try {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error(`Error scrolling to ${sectionId}:`, error);
    }
  };

  // Query para notificações (apenas admins)
  const { data: notifications } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_notifications")
        .select("*")
        .eq("admin_id", user?.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user && isAdmin,
    refetchInterval: 30000, // Atualizar a cada 30s
  });

  const unreadCount = notifications?.length || 0;

  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("admin_notifications")
        .update({ read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between h-20 px-4">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <BackButton to={backButtonPath} className="flex-shrink-0" />
          )}
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <img 
              src={exLogo} 
              alt="Exames Logo" 
              className="w-16 h-16 object-contain group-hover:scale-110 transition-transform" 
            />
            <span className="text-2xl font-bold text-white tracking-tight">Exames</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/dashboard" className="font-medium text-white/80 hover:text-white transition-colors">
            Home
          </Link>
          <Link to="/patients" className="font-medium text-white/80 hover:text-white transition-colors">
            Pacientes
          </Link>
          <button 
            onClick={() => setContactDialogOpen(true)}
            className="font-medium text-white/80 hover:text-white transition-colors"
          >
            Contato
          </button>
          <Link to="/demo" className="font-medium text-white/80 hover:text-white transition-colors">
            Como funciona
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {/* Notificações para Admins */}
          {isAdmin && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 hover:bg-red-600"
                      variant="destructive"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              
              <PopoverContent className="w-80 bg-black/95 border-white/10 text-white">
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">Notificações</h4>
                  
                  {notifications && notifications.length > 0 ? (
                    notifications.map(notif => (
                      <div 
                        key={notif.id}
                        className="p-3 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => markAsReadMutation.mutate(notif.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{notif.title}</p>
                            <p className="text-xs text-white/60 mt-1">{notif.message}</p>
                          </div>
                          <Badge className="ml-2 bg-rest-blue">Novo</Badge>
                        </div>
                        <p className="text-xs text-white/40 mt-2">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-center text-white/60 py-4">
                      Nenhuma notificação nova
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Dropdown de Perfil */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-gradient-to-br from-rest-blue to-rest-cyan text-white hover:from-rest-cyan hover:to-rest-blue rounded-lg w-10 h-10 focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-black/95 border-white/10 text-white z-50">
              {/* Header do usuário */}
              <div className="px-2 py-2">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-white/60 mt-1">
                  {isAdmin ? "👑 Administrador" : "👤 Profissional"}
                </p>
              </div>
              
              <DropdownMenuSeparator className="bg-white/10" />
              
              {/* Navegação */}
              <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer hover:bg-white/10">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => navigate('/patients')} className="cursor-pointer hover:bg-white/10">
                <Users className="mr-2 h-4 w-4" />
                Pacientes
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer hover:bg-white/10">
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              
              {/* Apenas para admins */}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10">
                    <Link to="/admin/invites" className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      Administração
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator className="bg-white/10" />
              
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer hover:bg-white/10 text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu className="w-6 h-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-black/95 border-white/10 text-white z-50">
            {/* Header do usuário */}
            <div className="px-2 py-2">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-white/60 mt-1">
                {isAdmin ? "👑 Administrador" : "👤 Profissional"}
              </p>
            </div>
            
            <DropdownMenuSeparator className="bg-white/10" />
            
            <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer hover:bg-white/10">
              <Home className="mr-2 h-4 w-4" />
              Home
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/patients')} className="cursor-pointer hover:bg-white/10">
              <Users className="mr-2 h-4 w-4" />
              Pacientes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer hover:bg-white/10">
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setContactDialogOpen(true)} className="cursor-pointer hover:bg-white/10">
              <Mail className="mr-2 h-4 w-4" />
              Contato
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/demo')} className="cursor-pointer hover:bg-white/10">
              <Info className="mr-2 h-4 w-4" />
              Como funciona
            </DropdownMenuItem>
            
            {isAdmin && (
              <>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-white/10">
                  <Link to="/admin/invites" className="flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    Administração
                    {unreadCount > 0 && (
                      <Badge className="ml-auto bg-red-500">{unreadCount}</Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer hover:bg-white/10 text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="bg-black/95 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-center">Entre em Contato</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="w-16 h-16 rounded-full bg-rest-blue/20 flex items-center justify-center">
              <Mail className="w-8 h-8 text-rest-blue" />
            </div>
            <div className="text-center">
              <p className="text-white/60 text-sm mb-2">Envie um email para:</p>
              <p className="text-2xl font-bold text-white">suporte@exames.co</p>
            </div>
            <Button
              onClick={handleCopyEmail}
              className="bg-gradient-to-r from-rest-blue to-rest-cyan hover:from-rest-cyan hover:to-rest-blue text-white font-medium px-6"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};
