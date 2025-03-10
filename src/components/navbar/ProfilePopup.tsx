import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/auth';
import { EnrollMFA } from '../MFA/EnrollMFA';
import { useNavigate } from 'react-router-dom';

interface ProfilePopupProps {
  user: any;
  onClose: () => void;
}

type CategoryType = 'General' | 'Security' | 'Personalization' | 'Subscription';

const ProfilePopup: React.FC<ProfilePopupProps> = ({ user, onClose }) => {
  const [message, setMessage] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('General');
  const [showEnrollMFA, setShowEnrollMFA] = useState(false);
  const [aalLevel, setAalLevel] = useState('aal1'); 
  const [hasMFA, setHasMFA] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: refreshed, error } = await supabase.auth.refreshSession();
      console.log('Refreshed session:', refreshed, error);
      const session = refreshed?.session || (await supabase.auth.getSession()).data.session;
      if (session?.user?.app_metadata?.aal) {
        setAalLevel(session.user.app_metadata.aal);
      }
    })();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change event:', event, session);
      if (session?.user?.app_metadata?.aal) {
        setAalLevel(session.user.app_metadata.aal);
      }
    });
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkMFAStatus = async () => {
      const sessionResp = await supabase.auth.getSession();
      if (!sessionResp.data.session) {
        console.warn("No auth session available; skipping MFA check.");
        setHasMFA(false);
        return;
      }
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        console.error('Error checking MFA status:', error);
        return;
      }
      setHasMFA(factors.totp && factors.totp.length > 0);
    };

    checkMFAStatus();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkMFAStatus();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleChangePassword = async () => {
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.href,
    });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('A password reset email has been sent. Please check your inbox.');
    }
  };

  const handleSignOut = async () => {
    setMessage('');
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage(`Error signing out: ${error.message}`);
    } else {
      navigate('/');
    }
  };

  const fullName = [
    user.user_metadata?.first_name,
    user.user_metadata?.last_name
  ].filter(Boolean).join(' ') || 'N/A';

  const categories: CategoryType[] = ['General', 'Security', 'Personalization', 'Subscription'];

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-lg w-[700px] min-h-[500px] flex"
      >
        <div className="w-1/4 border-r border-gray-200 p-4 flex flex-col justify-between">
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 ${
                  activeCategory === category 
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <button 
            onClick={handleSignOut}
            className="w-full px-4 py-2 mt-4 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>

        <div className="flex-1 p-8">
          <h2 className="text-2xl font-bold mb-6">{activeCategory}</h2>
          
          {activeCategory === 'General' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-gray-600">Name</p>
                <p className="text-lg font-medium">{fullName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600">Email</p>
                <p className="text-lg font-medium">{user.email}</p>
              </div>
            </div>
          )}

          {activeCategory === 'Security' && (
            <div className="space-y-4">
              <button
                onClick={handleChangePassword}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300"
              >
                Change Password
              </button>
              {hasMFA ? (
                <div className="group relative">
                  <button
                    disabled
                    className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg cursor-not-allowed"
                  >
                    2FA Enabled
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute top-full mt-2 w-full p-2 bg-gray-800 text-white text-sm rounded-lg">
                    Please contact us to disable 2FA
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <button
                    onClick={() => setShowEnrollMFA(true)}
                    className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-300"
                  >
                    Configure 2FA
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute top-full mt-2 w-full p-2 bg-gray-800 text-white text-sm rounded-lg">
                    Once enabled, you'll need to contact support to disable 2FA
                  </div>
                </div>
              )}
            </div>
          )}

          {message && <p className="text-sm text-center text-red-500 mt-4">{message}</p>}
        </div>
      </div>
      {showEnrollMFA && (
        <div 
          onClick={() => setShowEnrollMFA(false)}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-60"
        >
          <div onClick={(e) => e.stopPropagation()}>
            <EnrollMFA
              onEnrolled={() => {
                setShowEnrollMFA(false);
                setMessage('MFA configured successfully.');
              }}
              onCancelled={() => setShowEnrollMFA(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePopup;
