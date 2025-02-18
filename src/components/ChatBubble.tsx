import React, { useRef, useEffect } from 'react';

interface ChatBubbleProps {
  sidebarOpen: boolean;
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  isSearchActive: boolean;
  onToggleSearch: () => void;
  loginPopupActive: boolean;
  user: any; // User-Prop
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  sidebarOpen,
  inputValue,
  onInputChange,
  onSend,
  isSearchActive,
  onToggleSearch,
  loginPopupActive,
  user,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Automatische Höhenanpassung, wenn sich der Inhalt ändert
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      className={`fixed bottom-10 left-0 right-0 flex justify-center transition-all duration-300 ${
        sidebarOpen ? 'ml-64' : 'ml-0'
      } ${loginPopupActive ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className={`w-[48rem] px-4 py-3 rounded-xl shadow-md border border-gray-200 backdrop-blur-sm ${
        user ? 'bg-white' : 'bg-transparent'
      }`}>
        <textarea
          ref={textareaRef}
          rows={1} // Initial nur eine Zeile anzeigen
          placeholder={user ? "Type your message..." : "Please login to use"}
          value={inputValue}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          disabled={!user}
          className={`w-full px-2 py-2 rounded-md focus:outline-none resize-none transition-all
            max-h-[200px] overflow-y-auto bg-transparent
            ${!user ? 'cursor-not-allowed placeholder-gray-400' : ''}`}
          style={{
            minHeight: '20px',
            overflowWrap: 'break-word',
            lineHeight: '1.4',
            outline: 'none',
            boxSizing: 'border-box', // Berücksichtigt Padding und Border
          }}
        />
        <div className="mt-2 flex justify-between items-center">
          <button
            className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-all duration-300 border
              ${isSearchActive ? 'bg-blue-500/20 border-blue-500/30' : 'bg-white hover:opacity-60 border-gray-200'}
              ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={onToggleSearch}
            disabled={!user}
          >
            <img
              width="18"
              height="18"
              src="https://cdn-icons-png.flaticon.com/128/7710/7710466.png"
              alt="Search"
            />
            <span>Search</span>
          </button>
          <button
            className={`flex items-center justify-center w-10 h-10 rounded-full bg-white transition-opacity duration-300 hover:opacity-60
              ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={onSend}
            disabled={!user}
          >
            <img
              width="24"
              height="24"
              src="https://cdn-icons-png.flaticon.com/128/12557/12557011.png"
              alt="Send"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
