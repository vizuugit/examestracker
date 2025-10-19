import { useAuth } from "@/hooks/useAuth";
import { PublicNavbar } from "./PublicNavbar";
import { AuthenticatedNavbar } from "./AuthenticatedNavbar";
import { NavbarSkeleton } from "./NavbarSkeleton";

const Navbar = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <NavbarSkeleton />;
  
  return user ? <AuthenticatedNavbar /> : <PublicNavbar />;
};

export default Navbar;
