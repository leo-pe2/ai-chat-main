import React, { useState } from 'react';
import { supabase } from '../services/auth';

interface AuthMFAProps {
  onVerified: () => void;
}

const AuthMFA: React.FC<AuthMFAProps> = ({ onVerified }) => {
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');

  const onSubmitClicked = async () => {
    setError('');
    try {
      // Fetch the available MFA factors (we expect at least one TOTP factor)
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;

      const totpFactor = factors.data.totp[0];
      if (!totpFactor) throw new Error('No TOTP factors found!');
      const factorId = totpFactor.id;

      // Create a challenge for the chosen factor
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) {
        setError(challenge.error.message);
        throw challenge.error;
      }
      const challengeId = challenge.data.id;

      // Verify the provided code against the challenge
      const verifyRes = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verifyCode,
      });
      if (verifyRes.error) {
        setError(verifyRes.error.message);
        throw verifyRes.error;
      }
      // On successful verification, notify the parent component
      onVerified();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    }
  };

  return (
    <div>
      <div>Please enter the code from your authenticator app.</div>
      {error && <div className="text-red-500">{error}</div>}
      <input
        type="text"
        value={verifyCode}
        onChange={(e) => setVerifyCode(e.target.value.trim())}
      />
      <button onClick={onSubmitClicked}>Submit</button>
    </div>
  );
};

export default AuthMFA;
