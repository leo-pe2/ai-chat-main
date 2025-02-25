import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/navbar/navbar';
import Sidebar from '../components/navbar/sidebar/sidebar';
import ChatBubble from '../components/chat/ChatBubble';
import { getAIBackendResponse, getUserChats, updateChatContent, getChatById, updateChatTitle } from '../services/backendapi';
import { sendDiscordError } from '../services/discordWebhook';
import { searchTavily } from '../services/tavilySearch';
import LoginPopup from '../components/Login/LoginPopup';
import ProfilePopup from '../components/navbar/ProfilePopup';
import { supabase } from '../services/auth';
import ResetPasswordPopup from '../components/other/ResetPasswordPopup';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { generateChatTitle } from '../services/chatTitleGenerator';
import LoadingAnimation from '../components/chat/LoadingAnimation';
import AuthMFA from '../components/Login/AuthMFA';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

interface Message {
  sender: 'user' | 'bot' | 'developer';
  text: string;
}

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
            background: '#fafafa', 
            borderRadius: '0 0 0.5rem 0.5rem',
            margin: 0,
            fontSize: '0.875rem',
          },
          'code[class*="language-"]': {
            ...tomorrow['code[class*="language-"]'],
            color: '#374151', 
            textShadow: 'none', 
            fontSize: '0.875rem', 
          },
          'token.keyword': {
            ...tomorrow['token.keyword'],
            color: '#2563eb', 
          },
          'token.string': {
            ...tomorrow['token.string'],
            color: '#50A14F', 
          },
          'token.function': {
            ...tomorrow['token.function'],
            color: '#C916C9',
          }
        }}
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

const DEV_PROMPT = "You are a helpful assistant that answers questions and provides information. You are friendly, professional, and knowledgeable. You are always ready to help, provide accurate information, and are an expert in coding and academics.";

const LandingPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState('4o-mini');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [loginPopupActive, setLoginPopupActive] = useState(false);
  const [profilePopupActive, setProfilePopupActive] = useState(false);
  const [user, setUser] = useState<any>(null); 
  const [resetPasswordPopupActive, setResetPasswordPopupActive] = useState(false); 
  const [currentChatId, setCurrentChatId] = useState<string | null>(null); 
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const [chatRefresh, setChatRefresh] = useState(0); 
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMFA, setLoadingMFA] = useState(true);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [mfaCode, setMfaCode] = useState(''); 
  const [mfaError, setMfaError] = useState(''); 
  const navigate = useNavigate();
  const { chatId: routeChatId } = useParams<{ chatId: string }>();
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const createNewChat = async (title: string, visible: boolean = false): Promise<string | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({ 
          user_id: user.id, 
          title, 
          content: [{ sender: 'developer', text: DEV_PROMPT }], // store developer message
          is_visible: visible 
        })
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

  const handleNewChat = async () => {
    if (
      currentChatId &&
      conversation.length === 1 &&
      conversation[0].sender === 'developer' &&
      conversation[0].text === DEV_PROMPT
    ) {
      console.warn("A new chat is already in progress.");
      return;
    }
    const newChatId = await createNewChat('New Chat', false); 
    if (!newChatId) {
      console.error('Failed to create a new chat.');
    } else {
      await onSelectChat(newChatId);
      setChatRefresh(prev => prev + 1);
    }
  };

  const handleSend = async () => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage) return;

    const userMessagesCount = conversation.filter(msg => msg.sender === 'user').length;

    if (!currentChatId) {
      const generatedTitle = await generateChatTitle(trimmedMessage);
      const newChatId = await createNewChat(generatedTitle, true);
      if (!newChatId) return;
    } else if (userMessagesCount === 0 && currentChatId) {
      const generatedTitle = await generateChatTitle(trimmedMessage);
      try {
        await updateChatTitle(currentChatId, generatedTitle);
      } catch (err) {
        console.error('Error updating chat title:', err);
      }
    }

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
      setIsLoading(true);
      let modelInput = trimmedMessage;
      if (isSearchActive) {
        console.log("Waiting for Tavily response...");
        const searchResult = await searchTavily(trimmedMessage);
        console.log("Tavily search response received:", searchResult);
        if (searchResult) {
          modelInput = `Here is some information:\n"${searchResult}"\n\nSummarize the topic in depth and respond in the same language as this query: "${trimmedMessage}".`;
        }
      } else {
        modelInput = trimmedMessage;
      }
      
      console.log("Sending prompt to model:", selectedModel, modelInput);
      const historyForModel = updatedConversation.map(msg => ({
        sender: msg.sender === 'bot' ? 'assistant' : 'user',
        text: msg.text,
      }));
      const responseText = await getAIBackendResponse(modelInput, selectedModel, historyForModel);
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
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectChat = async (chatId: string) => {
    console.log('onSelectChat called with chatId:', chatId);
    if (!chatId) {
      console.error('No chat ID provided');
      return;
    }
    try {
      console.log('Fetching chat data...');
      const chat = await getChatById(chatId);
      console.log('Full chat data:', chat);
      
      if (!chat) {
        console.error('Chat not found or not visible');
        return;
      }
  
      setCurrentChatId(chat.id);
      let content = Array.isArray(chat.content) ? chat.content : [];
      setConversation(content);
      navigate(`/chat/${chat.id}`);
      
    } catch (error) {
      console.error('Error in onSelectChat:', error);
    }
  };

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  useEffect(() => {
    supabase.auth.getSession().then((res) => {
      const currentUser = res.data.session?.user || null;
      setUser(currentUser);
      if (!currentUser) { 
        setConversation([]);
        setCurrentChatId(null);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (!currentUser) { 
        setConversation([]);
        setCurrentChatId(null);
      }
    });
    return () => {
      listener?.subscription?.unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      setResetPasswordPopupActive(true);
      window.location.hash = '';
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const updateChannel = supabase.channel(`chats_updates_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chats",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log("Realtime UPDATE received:", payload);
          setChatRefresh(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      updateChannel.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const insertChannel = supabase.channel(`chats_inserts_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chats",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log("Realtime INSERT received:", payload);
          if (!currentChatId && Array.isArray(payload.new.content) && payload.new.content.length === 0) {
            setCurrentChatId(payload.new.id);
          }
          setChatRefresh(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      insertChannel.unsubscribe();
    };
  }, [user, currentChatId]);

  const checkMfa = async () => {
    setLoadingMFA(true);
    try {
      const factorsResponse = await supabase.auth.mfa.listFactors();
      if (factorsResponse.error) {
        console.error("Error listing MFA factors:", factorsResponse.error.message);
        setMfaVerified(false);
      } else if (!factorsResponse.data.totp || factorsResponse.data.totp.length === 0) {
        setMfaVerified(true);
      } else {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error || !data) {
          console.error('Error or no MFA data:', error);
          setMfaVerified(false);
        } else {
          if (data.currentLevel === 'aal2') {
            setMfaVerified(true);
          } else {
            setMfaVerified(false);
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setMfaVerified(false);
    } finally {
      setLoadingMFA(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const factors = await supabase.auth.mfa.listFactors();
    if (factors.error || !factors.data.totp.length) {
      setMfaError("No MFA factors found.");
      return;
    }
    const totpFactor = factors.data.totp[0];
    const challengeResult = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
    if (challengeResult.error || !challengeResult.data) {
      setMfaError(challengeResult.error?.message || "Failed to create challenge.");
      return;
    }
    const challengeId = challengeResult.data.id;
    const { data, error } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      challengeId,
      code: mfaCode,
    });
    if (error || !data) {
      setMfaError("Invalid MFA code. Please try again.");
      return;
    }
    setMfaVerified(true);
    setMfaError("");
  };

  useEffect(() => {
    checkMfa();
  }, []);

  useEffect(() => {
    if (routeChatId) {
      onSelectChat(routeChatId);
    }
  }, [routeChatId]);

  React.useEffect(() => {
    if (location.pathname === '/') {
      setCurrentChatId(null);
      setConversation([]);
    }
  }, [location.pathname]);

  return loadingMFA ? (
    <div className="min-h-screen flex items-center justify-center">
      Loading...
    </div>
  ) : (
    <div className="min-h-screen bg-white text-black relative">
      <header className="fixed top-0 left-0 right-0 z-20">
        <Navbar
          onToggle={toggleSidebar}
          sidebarOpen={sidebarOpen}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          loginPopupActive={loginPopupActive}
          setLoginPopupActive={setLoginPopupActive}
          user={user}                           
          setProfilePopupActive={setProfilePopupActive} 
          onNewChat={handleNewChat} 
        />
        <Sidebar 
          open={sidebarOpen} 
          onClose={toggleSidebar} 
          user={user}
          onSelectChat={onSelectChat}
          onNewChat={handleNewChat}
          chatRefresh={chatRefresh}
          mfaVerified={mfaVerified} 
        />
      </header>
      
      <main className={`absolute top-[60px] bottom-[150px] transition-all duration-300 ${sidebarOpen ? 'left-64' : 'left-0'} right-0 overflow-y-auto`}>
        <div className="flex justify-center">
          <div className="w-[45rem] px-4 py-12 space-y-4">
            {conversation
              .filter(msg => msg.sender !== 'developer') 
              .map((msg, index) => (
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
            {isLoading && <LoadingAnimation isLoading={isLoading} />}
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
        <LoginPopup 
          onClose={() => setLoginPopupActive(false)} 
          onMFAVerified={() => {
            setMfaVerified(true);
            setLoginPopupActive(false);
          }}
        />
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
      {user && !mfaVerified && !loginPopupActive && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50 z-50">
          <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleMfaSubmit} className="flex flex-col items-center">
              <input
                type="text"
                placeholder="Enter MFA code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-500 mb-4"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-black text-white rounded-md hover:opacity-80"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;