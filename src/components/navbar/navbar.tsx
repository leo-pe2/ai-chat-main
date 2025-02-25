import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import AiModelsMenu from './aiModelsMenu';
import LoginPopup from '../Login/LoginPopup';  
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onToggle: () => void;
  sidebarOpen: boolean;
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  loginPopupActive: boolean;  
  setLoginPopupActive: React.Dispatch<React.SetStateAction<boolean>>;  
  user: any;  
  setProfilePopupActive: React.Dispatch<React.SetStateAction<boolean>>; 
  onNewChat: () => void; 
}

const Navbar: React.FC<NavbarProps> = ({
  onToggle,
  sidebarOpen,
  selectedModel,
  setSelectedModel,
  setLoginPopupActive,
  user,
  setProfilePopupActive,
  onNewChat,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const [centerDropdownOpen, setCenterDropdownOpen] = useState(false);
  const [centerSelection, setCenterSelection] = useState("Home");
  
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const toggleModelMenu = () => setMenuOpen(!menuOpen);
  const toggleCenterDropdown = () => setCenterDropdownOpen(!centerDropdownOpen);

  const getInitials = (user: any) => {
    const firstName = user.user_metadata?.first_name || '';
    const lastName = user.user_metadata?.last_name || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className={`flex items-center justify-between p-4 bg-white text-black relative transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="flex items-center space-x-1">
          {!sidebarOpen && (
            <>
              <button
                onClick={onToggle}
                className="px-2 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-gray-300/50"
              >
                <img
                  width="24"
                  height="24"
                  src="https://cdn-icons-png.flaticon.com/128/12144/12144316.png"
                  alt="show sidebar"
                />
              </button>
              
              <button
                onClick={onNewChat}
                className="px-2 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-gray-300/50"
              >
                <img
                  width="24"
                  height="24"
                  src="https://cdn-icons-png.flaticon.com/128/11127/11127933.png"
                  alt="new chat"
                />
              </button>
            </>
          )}
          
          <div
            ref={menuRef}
            className="relative flex items-center text-lg font-bold cursor-pointer transition-all duration-300 ease-in-out px-2 py-2 rounded-lg z-20 hover:bg-gray-300/50"
            onClick={toggleModelMenu}
          >
            {selectedModel}
            <img
              width="12"
              height="12"
              src="https://cdn-icons-png.flaticon.com/128/8944/8944265.png"
              alt="ai model icon"
              className="ml-2"
            />
            <AiModelsMenu
              isOpen={menuOpen}
              selectedModel={selectedModel}
              onSelect={(model) => {
                if (model !== selectedModel) {
                  setSelectedModel(model);
                  setMenuOpen(false);
                }
              }}
            />
          </div>
        </div>
        
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <div 
            className="relative flex items-center cursor-pointer px-2 py-2 rounded-lg hover:bg-gray-300/50"
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
            <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded shadow-lg z-30">
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
      </nav>
    </>
  );
};

export default Navbar;