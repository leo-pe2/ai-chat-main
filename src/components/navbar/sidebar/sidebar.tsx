import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom'; 
import { getUserChats } from '../../../services/backendapi';
import { supabase } from '../../../services/auth'; 
import ConfirmDeletePopup from './ConfirmDeletePopup'; 

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  user: any;
  onSelectChat: (chatId: string) => Promise<void>;
  onNewChat: () => Promise<void>;
  chatRefresh: number;
  mfaVerified?: boolean;
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
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, user, onSelectChat, onNewChat, chatRefresh, mfaVerified }) => {
  const [chats, setChats] = useState<ChatType[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [chatToDelete, setChatToDelete] = useState<ChatType | null>(null); 
  const [activeChatId, setActiveChatId] = useState<string | null>(null); 

  const { chatId: routeChatId } = useParams<{ chatId: string }>();

  useEffect(() => {
    if (routeChatId && routeChatId !== activeChatId) {
      setActiveChatId(routeChatId);
    }
  }, [routeChatId, activeChatId]);

  useEffect(() => {
    if (!user || !mfaVerified) { 
      setChats([]);
      return;
    }
    getUserChats(user.id).then((data) => setChats(data)).catch(console.error);
  }, [user, chatRefresh, mfaVerified]);

  useEffect(() => {
    const scheduleMidnightUpdate = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      return setTimeout(() => {
        setCurrentTime(Date.now());
      }, msUntilMidnight);
    };
    const timer = scheduleMidnightUpdate();
    return () => clearTimeout(timer);
  }, [currentTime]);

  const groupedChats = useMemo(() => {
    const groups: ChatGroup = {
      "Today": [],
      "Yesterday": [],
      "Last 7 Days": [],
      "Last 30 Days": []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    chats.forEach((chat) => {
      const chatDate = new Date(chat.created_at);
      const chatDay = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());
      const diffDays = Math.floor((today.getTime() - chatDay.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        groups["Today"].push(chat);
      } else if (diffDays === 1) {
        groups["Yesterday"].push(chat);
      } else if (diffDays >= 2 && diffDays < 7) {
        groups["Last 7 Days"].push(chat);
      } else if (diffDays >= 7 && diffDays < 30) {
        groups["Last 30 Days"].push(chat);
      }
    });

    // Sort chats within each group by created_at descending
    Object.keys(groups).forEach(key => {
      groups[key as keyof ChatGroup].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return groups;
  }, [chats, currentTime]);

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
      setChats(prev => prev.filter(chat => chat.id !== chatToDelete.id));
      setChatToDelete(null);
    }
  };

  return (
    <>
      <div className={`fixed inset-y-0 left-0 w-64 bg-gray-100 text-black flex flex-col transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
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

        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(groupedChats).map(([groupName, groupChats]) => 
            groupChats.length > 0 && (
              <div key={groupName} className="mb-6"> 
                <h3 className="text-sm font-medium text-black">{groupName}</h3>
                {groupChats.map((chat: ChatType) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setActiveChatId(chat.id); 
                      onSelectChat(chat.id);
                    }}
                    className={`group flex justify-between items-center px-3 py-2 rounded-lg transition-all duration-300 ease-in-out cursor-pointer ${
                      chat.id === activeChatId ? 'bg-gray-300/50' : 'bg-transparent hover:bg-gray-200/50'
                    }`}
                  >
                    <div className="flex-1 overflow-hidden pr-0"> 
                      <span 
                        className="block whitespace-nowrap overflow-hidden" 
                        style={{ fontSize: '14px' }}
                      >
                        {chat.title?.replace(/"/g, '') || new Date(chat.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatToDelete(chat);
                      }}
                      className={`flex-shrink-0 ml-2 ${chat.id === activeChatId ? 'block' : 'hidden group-hover:block'}`}
                    >
                      <img
                        width="19"
                        height="19"
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
