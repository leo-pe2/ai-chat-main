import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import AiModelsMenu from './aiModelsMenu';
import LoginPopup from './LoginPopup';  // Existing

interface NavbarProps {
  onToggle: () => void;
  sidebarOpen: boolean;
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  loginPopupActive: boolean;  // Existing
  setLoginPopupActive: React.Dispatch<React.SetStateAction<boolean>>;  // Existing
  user: any;  // New prop: current authenticated user (null if not signed in)
  setProfilePopupActive: React.Dispatch<React.SetStateAction<boolean>>; // New
  onNewChat: () => void; // New prop for creating a new chat
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
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleModelMenu = () => setMenuOpen(!menuOpen);

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
              
              {/* Only show new chat button when sidebar is closed */}
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