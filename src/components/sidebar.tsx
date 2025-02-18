import React, { useEffect, useState, useMemo } from 'react';
import { getUserChats } from '../services/backendapi';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  user: any;
  onSelectChat: (chatId: string) => Promise<void>;
  onNewChat: () => Promise<void>;
  chatRefresh: number;
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

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, user, onSelectChat, onNewChat, chatRefresh }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (!user) {
      setChats([]);
      return;
    }
    getUserChats(user.id).then((data) => setChats(data)).catch(console.error);
  }, [user, chatRefresh]);

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

  return (
    <div className={`fixed inset-y-0 left-0 w-64 bg-gray-100 text-black p-4 transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
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
      <div className="mt-4 space-y-4">
        {Object.entries(groupedChats).map(([groupName, groupChats]) => 
          groupChats.length > 0 && (
            <div key={groupName} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">{groupName}</h3>
              {groupChats.map((chat: ChatType) => (
                <div
                  key={chat.id}
                  className="cursor-pointer bg-white px-3 py-2 rounded-lg shadow hover:bg-gray-200"
                  onClick={() => onSelectChat(chat.id)}
                >
                  {chat.title || new Date(chat.created_at).toLocaleTimeString()}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Sidebar;
