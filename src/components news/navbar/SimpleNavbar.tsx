import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SimpleNavbarProps {
  user: any;
  setLoginPopupActive: React.Dispatch<React.SetStateAction<boolean>>;
  setProfilePopupActive: React.Dispatch<React.SetStateAction<boolean>>;
}

const SimpleNavbar: React.FC<SimpleNavbarProps> = ({
  user,
  setLoginPopupActive,
  setProfilePopupActive,
}) => {
  const [centerDropdownOpen, setCenterDropdownOpen] = useState(false);
  const [centerSelection, setCenterSelection] = useState("");
  const navigate = useNavigate();

  // Update the center selection based on current path
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/news') {
      setCenterSelection("News");
    } else if (path === '/notes') {
      setCenterSelection("Notes");
    } else {
      setCenterSelection("Home");
    }
  }, []);

  const toggleCenterDropdown = () => setCenterDropdownOpen(!centerDropdownOpen);

  const getInitials = (user: any) => {
    const firstName = user.user_metadata?.first_name || '';
    const lastName = user.user_metadata?.last_name || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-white text-black">
      {/* Center Navigation Dropdown */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <div 
          className={`relative flex items-center cursor-pointer px-2 py-2 rounded-lg ${centerDropdownOpen ? "bg-gray-300/50" : "hover:bg-gray-300/50"}`}
          onClick={toggleCenterDropdown}
        >
          <img
            width="17"
            height="17"
            src="/images/home.svg"
            alt="dropdown icon"
            className="mr-2"
          />
          <span>{centerSelection}</span>
        </div>
        {centerDropdownOpen && (
          <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-lg z-30">
            <div className="flex space-x-4 p-2">
              <span 
                className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
                onClick={() => { 
                  setCenterSelection("Home");
                  navigate('/'); 
                  setCenterDropdownOpen(false); 
                }}
              >
                Home
              </span>
              <span 
                className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
                onClick={() => { 
                  setCenterSelection("News");
                  navigate('/news'); 
                  setCenterDropdownOpen(false); 
                }}
              >
                News
              </span>
              <span 
                className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
                onClick={() => { 
                  setCenterSelection("Notes");
                  navigate('/notes'); 
                  setCenterDropdownOpen(false); 
                }}
              >
                Notes
              </span>
            </div>
          </div>
        )}
      </div>

      {/* User Profile or Login Button */}
      <div className="ml-auto">
        {user ? (
          <button 
            onClick={() => setProfilePopupActive(true)}
            className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-300 flex items-center justify-center font-medium"
          >
            {getInitials(user)}
          </button>
        ) : (
          <button 
            onClick={() => setLoginPopupActive(true)}
            className="px-4 py-2 rounded-full bg-black text-white hover:bg-black/80 transition-colors duration-300"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default SimpleNavbar;
