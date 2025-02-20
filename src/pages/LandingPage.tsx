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

interface Message {
  sender: 'user' | 'bot' | 'developer';
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

const DEV_PROMPT = "You are a helpful assistant that answers questions and provides information. You are friendly, professional, and knowledgeable. You are always ready to help, provide accurate information, and are an expert in coding and academics.";

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMFA, setLoadingMFA] = useState(true);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [mfaCode, setMfaCode] = useState(''); // new state for MFA input
  const [mfaError, setMfaError] = useState(''); // new state for MFA error message

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

  // New function to handle new chat creation when button is clicked
  const handleNewChat = async () => {
    const newChatId = await createNewChat('New Chat', false); // changed from true to false
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

    // Determine the count of user messages (excluding developer messages)
    const userMessagesCount = conversation.filter(msg => msg.sender === 'user').length;

    // Ensure a chat is visible when the user sends a message.
    if (!currentChatId) {
      // Create a new chat with visible set to true.
      const generatedTitle = await generateChatTitle(trimmedMessage);
      const newChatId = await createNewChat(generatedTitle, true);
      if (!newChatId) return;
    } else if (userMessagesCount === 0 && currentChatId) {
      // Update the existing chat (title) to be visible if no user messages yet.
      const generatedTitle = await generateChatTitle(trimmedMessage);
      try {
        await updateChatTitle(currentChatId, generatedTitle);
      } catch (err) {
        console.error('Error updating chat title:', err);
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
      // Map conversation history: convert 'bot' to 'assistant'
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

  // New effect to subscribe to chat table updates for this user using Supabase channels
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

  // Realtime subscription for INSERT events on chats
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
          // If no chat is selected and the new chat is empty, set it as current
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
      // First, check if user has MFA enabled
      const factorsResponse = await supabase.auth.mfa.listFactors();
      if (factorsResponse.error) {
        console.error("Error listing MFA factors:", factorsResponse.error.message);
        setMfaVerified(false);
      } else if (!factorsResponse.data.totp || factorsResponse.data.totp.length === 0) {
        // User does not have MFA enabled, so mark as verified
        setMfaVerified(true);
      } else {
        // User has MFA enabled, check the assurance level
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

  // New handler for MFA submit
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // List current MFA factors; expect at least one TOTP factor
    const factors = await supabase.auth.mfa.listFactors();
    if (factors.error || !factors.data.totp.length) {
      setMfaError("No MFA factors found.");
      return;
    }
    const totpFactor = factors.data.totp[0];
    // Create a challenge for the chosen factor
    const challengeResult = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
    if (challengeResult.error || !challengeResult.data) {
      setMfaError(challengeResult.error?.message || "Failed to create challenge.");
      return;
    }
    const challengeId = challengeResult.data.id;
    // Verify the provided code using the real factorId and challengeId
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
    // ...existing useEffect code...
  }, []);

  // Add a loading guard to avoid showing MFA during check
  if (loadingMFA) return null;

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
          mfaVerified={mfaVerified} // <-- new prop passed
        />
      </header>
      
      <main className={`absolute top-[60px] bottom-[150px] transition-all duration-300 ${sidebarOpen ? 'left-64' : 'left-0'} right-0 overflow-y-auto`}>
        <div className="flex justify-center">
          <div className="w-[45rem] px-4 py-12 space-y-4">
            {conversation
              .filter(msg => msg.sender !== 'developer') // hide developer messages
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