
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import OwnersOnlyDialog from "./OwnersOnlyDialog";

// Locations data - organized by state
const webLocations = [
  // Arizona
  {
    city: "Buckeye",
    state: "AZ",
    website: "https://www.RestRecoveryBuckeye.com"
  }, {
    city: "Chandler",
    state: "AZ",
    website: "https://www.RestRecoveryChandler.com"
  }, {
    city: "Gilbert",
    state: "AZ",
    website: "https://www.RestRecoveryGilbert.com"
  }, {
    city: "North Phoenix",
    state: "AZ",
    website: "https://www.RestRecoveryNorthPhoenix.com"
  },
  // California
  {
    city: "Oceanside",
    state: "CA",
    website: "https://www.RestRecoverySandiego.com"
  }, {
    city: "Roseville",
    state: "CA",
    website: "https://www.RestRecoveryRoseville.com"
  },
  // Colorado
  {
    city: "Denver",
    state: "CO",
    website: "https://www.RestRecoveryDenver.com"
  }, {
    city: "Superior",
    state: "CO",
    website: "https://www.restrecoverysuperior.com"
  },
  // Florida
  {
    city: "Fort Walton",
    state: "FL",
    website: "https://www.RestRecoveryFortWalton.com"
  },
  // Idaho
  {
    city: "Meridian",
    state: "ID",
    website: "https://www.RestRecoveryMeridian.com"
  },
  // Illinois
  {
    city: "Naperville",
    state: "IL",
    website: "https://www.RestRecoveryNaperville.com"
  },
  // Massachusetts
  {
    city: "Groton",
    state: "MA",
    website: "https://www.RestRecoveryGroton.com"
  },
  // Mississippi
  {
    city: "Gluckstadt",
    state: "MS",
    website: "https://www.RestRecoveryGluckstadt.com"
  }, {
    city: "Jackson",
    state: "MS",
    website: "https://www.RestRecoveryJackson.com"
  },
  // New Jersey
  {
    city: "Wayne",
    state: "NJ",
    website: "https://www.WayneRestRecovery.com"
  },
  // Oregon
  {
    city: "Portland",
    state: "OR",
    website: "https://www.restrecoveryportland.com"
  },
  // Texas
  {
    city: "San Antonio",
    state: "TX",
    website: "https://www.RestRecoverySanAntonio.com"
  },
  // Louisiana
  {
    city: "Alexandria",
    state: "LA",
    website: "https://www.RestRecoveryAlexandria.com"
  },
  // South Carolina
  {
    city: "Fort Hill",
    state: "SC",
    website: "https://www.RestRecoveryFortHill.com"
  },
  // Tennessee
  {
    city: "Franklin",
    state: "TN",
    website: "https://www.RestRecoveryFranklin.com"
  },
  // Utah
  {
    city: "Bountiful",
    state: "UT",
    website: "https://www.RestRecoveryBountiful.com"
  }, {
    city: "Ephraim",
    state: "UT",
    website: "https://www.RestRecoveryEphraim.com"
  }, {
    city: "Logan",
    state: "UT",
    website: "https://www.RestRecoveryLogan.com"
  },
  // Virginia
  {
    city: "Ashburn",
    state: "VA",
    website: "https://www.restrecoveryvirginia.com"
  }
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOwnersDialogOpen, setIsOwnersDialogOpen] = useState(false);

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
        <div className="flex items-center space-x-3">
          {/* Updated logo - clickable to go home */}
          <Link to="/">
            <img 
              src="/lovable-uploads/29984e37-3036-4b0d-82a2-e6e2bacb1954.png" 
              alt="Sauna Logo" 
              className="h-24 w-24 object-contain hover:opacity-80 transition-opacity cursor-pointer"
            />
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="font-medium text-white/80 hover:text-white transition-colors">
            Home
          </Link>
          <Link to="/licensee" className="font-medium text-white/80 hover:text-white transition-colors">
            Licensee
          </Link>
          <Link to="/shop" className="font-medium text-white/80 hover:text-white transition-colors">
            Shop
          </Link>
          
          {/* Locations Dropdown */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white/80 hover:text-white font-medium h-auto p-0 data-[state=open]:bg-transparent">
                  Locations
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid grid-cols-2 gap-1 p-4 w-96 bg-black/95 backdrop-blur-lg border border-white/10">
                    {webLocations.map((location, idx) => (
                      <a
                        key={idx}
                        href={location.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                      >
                        {location.city}, {location.state}
                      </a>
                    ))}
                    <div className="block px-3 py-2 text-sm text-white/60 rounded">
                      North Carolina - Coming 2026
                    </div>
                    <div className="block px-3 py-2 text-sm text-white/60 rounded">
                      New York - Coming 2026
                    </div>
                    <div className="block px-3 py-2 text-sm text-white/60 rounded">
                      Maryland - Coming 2026
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          
          <button 
            onClick={() => setIsOwnersDialogOpen(true)}
            className="font-medium text-white/80 hover:text-white transition-colors flex items-center gap-2"
          >
            <Lock size={16} />
            Owners Only
          </button>
          
        </nav>

        {/* Desktop Button */}
        <div className="hidden md:block">
          <Button 
            className="bg-white text-black hover:bg-white/90 rounded-full px-6"
            onClick={() => scrollToSection('contact')}
          >
            Contact Now
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
            >
              Home
            </Link>
            <Link 
              to="/licensee"
              className="font-medium text-white/90 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-4 py-3 transition-colors text-lg block"
            >
              Licensee
            </Link>
            <Link 
              to="/shop"
              className="font-medium text-white/90 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-4 py-3 transition-colors text-lg block"
            >
              Shop
            </Link>
            {/* Mobile Locations */}
            <div className="bg-white/5 rounded-lg px-4 py-3">
              <p className="font-medium text-white/90 text-lg mb-2">Locations</p>
              <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
                {webLocations.map((location, idx) => (
                  <a
                    key={idx}
                    href={location.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-2 py-1 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                  >
                    {location.city}, {location.state}
                  </a>
                ))}
                <div className="block px-2 py-1 text-sm text-white/60 rounded">
                  North Carolina - Coming 2026
                </div>
                <div className="block px-2 py-1 text-sm text-white/60 rounded">
                  New York - Coming 2026
                </div>
                <div className="block px-2 py-1 text-sm text-white/60 rounded">
                  Maryland - Coming 2026
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOwnersDialogOpen(true)}
              className="font-medium text-white/90 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg px-4 py-3 transition-colors text-lg flex items-center gap-2 w-full"
            >
              <Lock size={20} />
              Owners Only
            </button>
            <Button 
              className="bg-white text-black hover:bg-white/90 rounded-full w-full mt-2 py-4 text-lg"
              onClick={() => scrollToSection('contact')}
            >
              Contact Now
            </Button>
          </div>
        </div>
      )}
      
      <OwnersOnlyDialog open={isOwnersDialogOpen} onOpenChange={setIsOwnersDialogOpen} />
    </header>
  );
};

export default Navbar;
