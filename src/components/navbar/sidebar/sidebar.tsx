import React, { useEffect, useState, useMemo } from 'react';
import { getUserChats } from '../../../services/backendapi';
import { supabase } from '../../../services/auth'; // New import for database update
import ConfirmDeletePopup from './ConfirmDeletePopup'; // New import

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  user: any;
  onSelectChat: (chatId: string) => Promise<void>;
  onNewChat: () => Promise<void>;
  chatRefresh: number;
  mfaVerified?: boolean; // <-- new prop
}

interface ChatGroup {
  Today: any[];
  Yesterday: any[];
  "Last 7 Days": any[];
  "Last 30 Days": any[];
}

interface ChatType {
  id: string;
  title?: string;
  created_at: string;
  // ...any other fields...
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, user, onSelectChat, onNewChat, chatRefresh, mfaVerified }) => {
  const [chats, setChats] = useState<ChatType[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [chatToDelete, setChatToDelete] = useState<ChatType | null>(null); // New state

  useEffect(() => {
    if (!user || !mfaVerified) { // only fetch chats when MFA is verified
      setChats([]);
      return;
    }
    getUserChats(user.id).then((data) => setChats(data)).catch(console.error);
  }, [user, chatRefresh, mfaVerified]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  const groupedChats = useMemo(() => {
    const groups: ChatGroup = {
      "Today": [],
      "Yesterday": [],
      "Last 7 Days": [],
      "Last 30 Days": []
    };

    const now = new Date();
    chats.forEach((chat) => {
      const chatDate = new Date(chat.created_at);
      const diffHours = (now.getTime() - chatDate.getTime()) / (1000 * 60 * 60);

      if (diffHours < 24) {
        groups["Today"].push(chat);
      } else if (diffHours < 48) {
        groups["Yesterday"].push(chat);
      } else if (diffHours < 24 * 7) {
        groups["Last 7 Days"].push(chat);
      } else if (diffHours < 24 * 30) {
        groups["Last 30 Days"].push(chat);
      }
    });

    // Sort chats within each group by created_at
    Object.keys(groups).forEach(key => {
      groups[key as keyof ChatGroup].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return groups;
  }, [chats, currentTime]);

  // Updated deletion handler: mark chat as not visible in the database.
  const handleConfirmDelete = async () => {
    if (chatToDelete) {
      try {
        const { error } = await supabase
          .from('chats')
          .update({ is_visible: false })
          .eq('id', chatToDelete.id);
        if (error) {
          console.error('Error deleting chat:', error.message);
        }
      } catch (err) {
        console.error('Unexpected error while deleting chat:', err);
      }
      // Remove from local state so it no longer appears.
      setChats(prev => prev.filter(chat => chat.id !== chatToDelete.id));
      setChatToDelete(null);
    }
  };

  return (
    <>
      <div className={`fixed inset-y-0 left-0 w-64 bg-gray-100 text-black flex flex-col transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Fixed header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <button 
              onClick={onClose} 
              className="px-3 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-gray-300/50"
            >
              <img
                width="24"
                height="24"
                src="https://cdn-icons-png.flaticon.com/128/12144/12144316.png"
                alt="close sidebar"
              />
            </button>
            <button
              onClick={onNewChat}
              className="px-3 py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-gray-300/50"
            >
              <img
                width="24"
                height="24"
                src="https://cdn-icons-png.flaticon.com/128/11127/11127933.png"
                alt="new chat"
              />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {Object.entries(groupedChats).map(([groupName, groupChats]) => 
            groupChats.length > 0 && (
              <div key={groupName} className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">{groupName}</h3>
                {groupChats.map((chat: ChatType) => (
                  // Make the entire container clickable
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className="flex justify-between items-center bg-white px-3 py-2 rounded-lg shadow hover:bg-gray-200 cursor-pointer"
                  >
                    <span>
                      {chat.title || new Date(chat.created_at).toLocaleTimeString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatToDelete(chat);
                      }}
                      className="flex-shrink-0 ml-2"
                    >
                      <img
                        width="20"
                        height="20"
                        src="https://cdn-icons-png.flaticon.com/128/15691/15691674.png"
                        alt="delete"
                      />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
      {chatToDelete && (
        <ConfirmDeletePopup
          chatTitle={chatToDelete.title || 'Unnamed Chat'}
          onConfirm={handleConfirmDelete}
          onCancel={() => setChatToDelete(null)}
        />
      )}
    </>
  );
};

export default Sidebar;
