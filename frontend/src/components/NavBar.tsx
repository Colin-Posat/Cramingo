import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookIcon, 
  BookmarkIcon, 
  SearchIcon, 
  UserIcon 
} from 'lucide-react';

const NavBar: React.FC = () => {
  const location = useLocation();

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

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#004a74] text-white z-50 
      flex items-center justify-center gap-4 p-3">
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
            <Icon className="w-6 h-6" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavBar;