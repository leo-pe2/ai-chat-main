import React, { useState, useEffect } from 'react';
import { supabase } from '../services/auth';

interface EnrollMFAProps {
  onEnrolled: () => void;
  onCancelled: () => void;
}

export function EnrollMFA({ onEnrolled, onCancelled }: EnrollMFAProps) {
  const [factorId, setFactorId] = useState('');
  const [qr, setQR] = useState(''); // holds the QR code SVG
  const [secret, setSecret] = useState(''); // plain text secret if scanning fails
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');

  // Enroll MFA: get initial QR code, secret, and factorId
  useEffect(() => {
    (async () => {
      setError('');
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) {
        setError(error.message);
        return;
      }
      // Assume data.totp contains 'qr_code' and 'secret'
      setFactorId(data.id);
      setQR(data.totp.qr_code);
      setSecret(data.totp.secret);
    })();
  }, []);

  const cleanupEnrollment = async () => {
    if (factorId) {
      try {
        const { error } = await supabase.auth.mfa.unenroll({ factorId });
        if (error) {
          console.error("Error removing MFA factor:", error.message);
        }
      } catch (err: any) {
        console.error("Cleanup error:", err.message || err);
      }
    }
  };

  const handleCancel = async () => {
    await cleanupEnrollment();
    onCancelled();
  };

  const onEnableClicked = async () => {
    setError('');
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) {
        setError(challenge.error.message);
        return;
      }
      const challengeId = challenge.data.id;
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verifyCode,
      });
      if (verify.error) {
        setError(verify.error.message);
        return;
      }
      
      // Force a session refresh so the JWT includes the updated AAL
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        setError(refreshError.message);
        return;
      }
      console.log('Refreshed session:', refreshed);

      onEnrolled();
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    }
  };

  return (
    <div className="p-4 bg-white border rounded shadow space-y-4">
      {error && <div className="text-red-500">{error}</div>}
      <div>
        <h3 className="font-bold mb-2">Scan this QR Code</h3>
        {qr ? <img src={qr} alt="MFA QR Code" /> : <p>Loading QR code...</p>}
      </div>
      <div>
        <p className="text-sm">If you cannot scan the QR code, use this secret:</p>
        <pre className="bg-gray-100 p-2 rounded">{secret}</pre>
      </div>
      <div>
        <input
          type="text"
          placeholder="Enter verification code"
          value={verifyCode}
          onChange={(e) => setVerifyCode(e.target.value.trim())}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div className="flex space-x-3">
        <input 
          type="button" 
          value="Enable" 
          onClick={onEnableClicked} 
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded" 
        />
        <input 
          type="button" 
          value="Cancel" 
          onClick={handleCancel} 
          className="flex-1 px-4 py-2 bg-gray-300 rounded" 
        />
      </div>
    </div>
  );
}
