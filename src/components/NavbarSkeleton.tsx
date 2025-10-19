import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

export const NavbarSkeleton = () => {
  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between h-20 px-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-rest-blue to-rest-cyan rounded-full flex items-center justify-center">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Exames</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <Skeleton className="h-5 w-20 bg-white/10" />
          <Skeleton className="h-5 w-24 bg-white/10" />
          <Skeleton className="h-10 w-28 rounded-full bg-white/10" />
        </div>

        <Skeleton className="md:hidden h-8 w-8 bg-white/10" />
      </div>
    </header>
  );
};
