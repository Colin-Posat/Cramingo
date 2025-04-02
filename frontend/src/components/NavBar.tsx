import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookIcon,
  BookmarkIcon,
  SearchIcon,
  UserIcon,
  MenuIcon,
  XIcon
} from 'lucide-react';

const NavBar: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Navigation items configuration
  const navItems = [
    {
      to: "/created-sets",
      icon: BookIcon,
      label: "Created Sets"
    },
    {
      to: "/saved-sets",
      icon: BookmarkIcon,
      label: "Saved Sets"
    },
    {
      to: "/search-sets",
      icon: SearchIcon,
      label: "Search Sets"
    },
    {
      to: "/profile",
      icon: UserIcon,
      label: "Profile"
    }
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#004a74] text-white z-50 h-16">
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center justify-center gap-4 h-full px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 px-4 py-2 rounded-full
                transition-colors ${
                  isActive
                    ? "bg-[#00659f] font-semibold"
                    : "hover:bg-[#00659f]"
                }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center justify-between h-full px-4">
        <Link 
          to="/" 
          className="text-xl font-bold"
        >

        </Link>
        <button 
          onClick={toggleMenu}
          className="p-2"
        >
          {isMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-[#004a74] shadow-lg">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 border-b border-[#00659f] hover:bg-medium-blue
                  ${isActive ? "bg-[#00659f] font-semibold" : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default NavBar;