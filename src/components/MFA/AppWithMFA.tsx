import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/auth';
import AuthMFA from '../Login/AuthMFA';
import App from '../../App';

function AppWithMFA() {
  const [loading, setLoading] = useState(true);
  const [mfaVerified, setMfaVerified] = useState(false);

  // Only mark MFA as verified if the current level is exactly 'aal2'
  const checkMfa = async () => {
    setLoading(true);
    try {
      console.log('Checking MFA levels...');
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error || !data) {
        console.error('Error or no MFA data:', error);
        setMfaVerified(false);
      } else {
        console.log('MFA Levels:', data.currentLevel, data.nextLevel);
        // Only mark as verified if the currentLevel is exactly 'aal2'
        setMfaVerified(data.currentLevel === 'aal2');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setMfaVerified(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMfa();
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      checkMfa();
    });
    return () => {
      // Correctly unsubscribe using the subscription property.
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;
  return mfaVerified ? <App /> : <AuthMFA onVerified={checkMfa} />;
}

export default AppWithMFA;
