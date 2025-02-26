import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/auth';
import SimpleNavbar from '../components news/navbar/SimpleNavbar';
import ProfilePopup from '../components/navbar/ProfilePopup';

const NewsPage: React.FC = () => {
  const [loginPopupActive, setLoginPopupActive] = useState(false);
  const [profilePopupActive, setProfilePopupActive] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  
  // Handle new chat creation (redirects to main chat page)
  const handleNewChat = () => {
    navigate('/');
  };
  
  // Effect for auth state
  React.useEffect(() => {
    supabase.auth.getSession().then((res) => {
      const currentUser = res.data.session?.user || null;
      setUser(currentUser);
    });
    
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
    });
    
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="fixed top-0 left-0 right-0 z-20">
        <SimpleNavbar
          user={user}
          setLoginPopupActive={setLoginPopupActive}
          setProfilePopupActive={setProfilePopupActive}
        />
      </header>
      
      <main className="pt-[70px] px-4 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Latest News</h1>
        
        <div className="space-y-6">
          <article className="border border-gray-200 rounded-lg p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">AI Model Updates</h2>
            <p className="text-gray-700 mb-3">
              Our newest models have shown significant improvements in comprehension and response accuracy.
              Testing shows a 15% reduction in hallucinations compared to previous versions.
            </p>
            <span className="text-sm text-gray-500">Posted 2 days ago</span>
          </article>
          
          <article className="border border-gray-200 rounded-lg p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Enhanced Search Features</h2>
            <p className="text-gray-700 mb-3">
              We've integrated Tavily search capabilities to provide more accurate and up-to-date 
              information when answering your questions.
            </p>
            <span className="text-sm text-gray-500">Posted 1 week ago</span>
          </article>
          
          <article className="border border-gray-200 rounded-lg p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Platform Security Enhancements</h2>
            <p className="text-gray-700 mb-3">
              Our team has implemented additional security measures including MFA 
              and enhanced session management to keep your data safe.
            </p>
            <span className="text-sm text-gray-500">Posted 2 weeks ago</span>
          </article>
        </div>
      </main>
      
      {profilePopupActive && user && (
        <ProfilePopup
          user={user}
          onClose={() => setProfilePopupActive(false)}
        />
      )}
    </div>
  );
};

export default NewsPage;
