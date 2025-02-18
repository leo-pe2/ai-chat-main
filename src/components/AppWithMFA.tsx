import React, { useState, useEffect } from 'react';
import { supabase } from '../services/auth';
import AuthMFA from './AuthMFA';
import App from '../App';

function AppWithMFA() {
  const [readyToShow, setReadyToShow] = useState(false);
  const [showMFAScreen, setShowMFAScreen] = useState(false);

  useEffect(() => {
    (async () => {
      console.log('Checking MFA levels...');
      try {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error) {
          console.error('Error fetching MFA levels:', error);
          // Optionally set readyToShow to true even on error if you want to proceed
          return;
        }
        if (data) {
          console.log('MFA Levels:', data.currentLevel, data.nextLevel);
          // If MFA is required, show the challenge
          if (data.nextLevel === 'aal2' && data.currentLevel === 'aal1') {
            setShowMFAScreen(true);
          }
        } else {
          console.log('No MFA data returned.');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setReadyToShow(true);
      }
    })();
  }, []);

  if (!readyToShow) return null;
  return showMFAScreen ? (
    <AuthMFA onVerified={() => setShowMFAScreen(false)} />
  ) : (
    <App />
  );
}

export default AppWithMFA;
