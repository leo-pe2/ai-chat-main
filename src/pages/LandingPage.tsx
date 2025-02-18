import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/navbar';
import Sidebar from '../components/sidebar';
import ChatBubble from '../components/ChatBubble';
import { getAIBackendResponse, getUserChats, updateChatContent, getChatById } from '../services/backendapi';
import { sendDiscordError } from '../services/discordWebhook';
import { searchTavily } from '../services/tavilySearch';
import LoginPopup from '../components/LoginPopup';
import ProfilePopup from '../components/profile/ProfilePopup';
import { supabase } from '../services/auth';
import ResetPasswordPopup from '../components/ResetPasswordPopup';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { generateChatTitle } from '../services/chatTitleGenerator';
import { updateChatTitle } from '../services/backendapi';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

// Custom CodeBlock component using react-syntax-highlighter and a copy button
const CodeBlock = ({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children ?? '').replace(/\n$/, '');
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return <code className={className} {...props}>{children}</code>;
  }

  return (
    <div className="rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 flex justify-between items-center border-b border-gray-300">
        <span className="text-sm text-gray-700">{language || 'text'}</span>
        <CopyToClipboard text={codeString} onCopy={handleCopy}>
          <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700">
            <img
              src="https://img.icons8.com/fluency-systems-regular/50/copy--v1.png"
              alt="copy"
              className="w-5 h-5"
            />
            <span className="text-sm">{copied ? 'Copied' : ''}</span>
          </button>
        </CopyToClipboard>
      </div>
      <SyntaxHighlighter
        language={language}
        style={{
          ...tomorrow,
          'pre[class*="language-"]': {
            ...tomorrow['pre[class*="language-"]'],
            background: '#fafafa', // Much lighter background
            borderRadius: '0 0 0.5rem 0.5rem',
            margin: 0,
            fontSize: '0.875rem',
          },
          'code[class*="language-"]': {
            ...tomorrow['code[class*="language-"]'],
            color: '#374151', // darker text color
            textShadow: 'none', // remove text shadow
            fontSize: '0.875rem', // 14px
          },
          'token.keyword': {
            ...tomorrow['token.keyword'],
            color: '#2563eb', // brighter blue
          },
          'token.string': {
            ...tomorrow['token.string'],
            color: '#50A14F', // brighter green
          },
          'token.function': {
            ...tomorrow['token.function'],
            color: '#C916C9', // brighter purple
          }
        }}
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState('4o-mini');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [loginPopupActive, setLoginPopupActive] = useState(false);
  const [profilePopupActive, setProfilePopupActive] = useState(false);
  const [user, setUser] = useState<any>(null); // New state for auth user
  const [resetPasswordPopupActive, setResetPasswordPopupActive] = useState(false); // New state for reset password popup
  const [currentChatId, setCurrentChatId] = useState<string | null>(null); // New state
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const [chatRefresh, setChatRefresh] = useState(0); // Re-add chatRefresh state

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const createNewChat = async (title: string): Promise<string | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({ user_id: user.id, title, content: [], is_visible: true })
        .select();
      if (error) {
        console.error('Error creating chat:', error);
        return null;
      }
      const chat = data[0];
      setCurrentChatId(chat.id);
      return chat.id;
    } catch (err) {
      console.error('Error in createNewChat:', err);
      return null;
    }
  };

  // New function to handle new chat creation when button is clicked
  const handleNewChat = async () => {
    const newChatId = await createNewChat('New Chat');
    if (!newChatId) {
      console.error('Failed to create a new chat.');
    } else {
      await onSelectChat(newChatId);
      setChatRefresh(prev => prev + 1); // re-add refresh update
    }
  };

  const handleSend = async () => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage) return;

    // If it's the first message, update the chat title if a chat exists, or create one with the generated title
    if (conversation.length === 0) {
      const generatedTitle = await generateChatTitle(trimmedMessage);
      if (currentChatId) {
        // Edit the existing chat title with the generated title
        try {
          await updateChatTitle(currentChatId, generatedTitle);
        } catch (err) {
          console.error('Error updating chat title:', err);
        }
      } else {
        // No current chat exists, so create a new chat with the generated title
        const newChatId = await createNewChat(generatedTitle);
        if (!newChatId) return;
      }
    }

    // Append user message and update chat content
    const userMessage: Message = { sender: 'user', text: trimmedMessage };
    const updatedConversation = [...conversation, userMessage];
    setConversation(updatedConversation);
    setInputValue('');
    if (currentChatId) {
      try {
        await updateChatContent(currentChatId, updatedConversation);
      } catch (error) {
        console.error('Error updating chat content:', error);
      }
    }

    try {
      let modelInput = trimmedMessage;
      if (isSearchActive) {
        console.log("Waiting for Tavily response...");
        const searchResult = await searchTavily(trimmedMessage);
        console.log("Tavily search response received:", searchResult);
        if (searchResult) {
          modelInput = `Here is some information:\n"${searchResult}"\n\nSummarize the topic in depth and respond in the same language as this query: "${trimmedMessage}".`;
        }
      } else {
        modelInput = `${trimmedMessage}\n\nRespond in the same language as the query above. If you include mathematical formulas, wrap them in $$ symbols instead of [ ] symbols.`;
      }
      
      console.log("Sending prompt to model:", selectedModel, modelInput);
      const responseText = await getAIBackendResponse(modelInput, selectedModel);
      const formattedText = responseText.replace(/\[(.*?)\]/g, '$$$$1$$');
      const botMessage: Message = { sender: 'bot', text: formattedText };
      const newConversation = [...updatedConversation, botMessage];
      setConversation(newConversation);
      if (currentChatId) {
        await updateChatContent(currentChatId, newConversation);
      }
    } catch (error) {
      const detailedError = error instanceof Error ? error.message : 'Unknown error';
      sendDiscordError(`Error fetching response: ${detailedError}`);
      const errorMessage: Message = { sender: 'bot', text: 'An error occurred. Please try again later.' };
      const newConversation = [...updatedConversation, errorMessage];
      setConversation(newConversation);
      if (currentChatId) {
        await updateChatContent(currentChatId, newConversation);
      }
      console.error('API error:', error);
    }
  };

  // New handler to load a chat conversation when selected from sidebar
  const onSelectChat = async (chatId: string) => {
    console.log('onSelectChat called with chatId:', chatId); // Debug log
    if (!chatId) {
      console.error('No chat ID provided');
      return;
    }
  
    try {
      console.log('Fetching chat data...'); // Debug log
      const chat = await getChatById(chatId);
      console.log('Full chat data:', chat);  // Debug log
      
      if (!chat) {
        console.error('Chat not found or not visible');
        return;
      }
  
      // Set currentChatId first
      setCurrentChatId(chat.id);
      
      // Handle content
      console.log('Raw chat content:', chat.content); // Debug log
      let content = Array.isArray(chat.content) ? chat.content : [];
      console.log('Processed content:', content); // Debug log
      
      // Update conversation
      setConversation(content);
      
    } catch (error) {
      console.error('Error in onSelectChat:', error);
    }
  };

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then((res) => {
      const currentUser = res.data.session?.user || null;
      setUser(currentUser);
      if (!currentUser) { // Clear conversation if signed out
        setConversation([]);
        setCurrentChatId(null);
      }
    });
    // Subscribe to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (!currentUser) { // Clear conversation if signed out
        setConversation([]);
        setCurrentChatId(null);
      }
    });
    return () => {
      listener?.subscription?.unsubscribe();
    }
  }, []);

  useEffect(() => {
    // Check if URL hash indicates a recovery action
    if (window.location.hash.includes('type=recovery')) {
      setResetPasswordPopupActive(true);
      // Optionally clear the hash
      window.location.hash = '';
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-black relative">
      <header className="fixed top-0 left-0 right-0 z-20">
        <Navbar
          onToggle={toggleSidebar}
          sidebarOpen={sidebarOpen}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          loginPopupActive={loginPopupActive}
          setLoginPopupActive={setLoginPopupActive}
          user={user}                           // Pass user
          setProfilePopupActive={setProfilePopupActive}  // For profile popup toggle
          onNewChat={handleNewChat}  // updated: pass new chat handler
        />
        <Sidebar 
          open={sidebarOpen} 
          onClose={toggleSidebar} 
          user={user}
          onSelectChat={onSelectChat}
          onNewChat={handleNewChat}
          chatRefresh={chatRefresh}
        />
      </header>
      
      <main className={`absolute top-[60px] bottom-[150px] transition-all duration-300 ${sidebarOpen ? 'left-64' : 'left-0'} right-0 overflow-y-auto`}>
        <div className="flex justify-center">
          <div className="w-[45rem] px-4 py-12 space-y-4">
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`px-5 py-3 ${
                    msg.sender === 'user' 
                      ? 'bg-gray-100 rounded-3xl mr-[-1rem]' 
                      : msg.text.includes('{"@type"') || msg.text.includes('googleapis.com')
                        ? 'ml-[-1rem] pl-0 max-w-[100%] text-red-500 break-all'
                        : msg.text.startsWith('Error fetching response:')
                          ? 'ml-[-1rem] pl-0 max-w-[70%] text-red-500'
                          : 'ml-[-1rem] pl-0'
                  } max-w-[100%]`}
                >
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} components={{ code: CodeBlock }}>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={conversationEndRef} />
          </div>
        </div>
      </main>
      
      <footer className={`fixed bottom-10 left-0 right-0 z-20 transition-all duration-300`}>
        <ChatBubble
          sidebarOpen={sidebarOpen}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          onSend={handleSend}
          isSearchActive={isSearchActive}
          onToggleSearch={() => setIsSearchActive(!isSearchActive)}
          loginPopupActive={loginPopupActive}
          user={user}
        />
      </footer>
      
      {loginPopupActive && (
        <LoginPopup onClose={() => setLoginPopupActive(false)} />
      )}
      {profilePopupActive && user && (
        <ProfilePopup
          user={user}
          onClose={() => setProfilePopupActive(false)}
        />
      )}
      {resetPasswordPopupActive && (
        <ResetPasswordPopup onClose={() => setResetPasswordPopupActive(false)} />
      )}
    </div>
  );
};

export default LandingPage;