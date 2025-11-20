import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  console.log('[AdminRoute] Debug:', { 
    user: user?.email, 
    authLoading, 
    roleLoading, 
    isAdmin,
    userId: user?.id 
  });

  if (authLoading || roleLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="space-y-4 text-center">
          <Skeleton className="h-20 w-20 rounded-full bg-white/10 mx-auto" />
          <Skeleton className="h-4 w-32 bg-white/10 mx-auto" />
          <p className="text-zinc-400 text-sm">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[AdminRoute] Redirecionando para /auth - sem usuário');
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    console.log('[AdminRoute] Redirecionando para /dashboard - não é admin');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('[AdminRoute] Renderizando children - usuário é admin');
  return <>{children}</>;
}
