import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '../services/auth';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import { supabase } from '../services/auth';

interface LoginPopupProps {
  onClose: () => void;
  onMFAVerified?: () => void; // new prop for gating full access after MFA
}

type SignupStep = 'names' | 'credentials';

const SignupStepOne: React.FC<{
  firstName: string;
  lastName: string;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  onNext: () => void;
}> = ({ firstName, lastName, setFirstName, setLastName, onNext }) => (
  <div className="space-y-4">
    <input
      type="text"
      placeholder="First Name"
      value={firstName}
      onChange={(e) => setFirstName(e.target.value)}
      className="w-full px-4 py-2 border rounded"
      required
    />
    <input
      type="text"
      placeholder="Last Name"
      value={lastName}
      onChange={(e) => setLastName(e.target.value)}
      className="w-full px-4 py-2 border rounded"
      required
    />
    <button
      onClick={onNext}
      disabled={!firstName.trim() || !lastName.trim()}
      className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300 disabled:bg-gray-400"
    >
      Next
    </button>
  </div>
);

const SignupStepTwo: React.FC<{
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}> = ({ email, password, setEmail, setPassword, onBack, onSubmit }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <input
      type="email"
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="w-full px-4 py-2 border rounded"
      required
    />
    <div>
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-2 border rounded"
        required
      />
      <PasswordStrengthMeter password={password} />
    </div>
    <div className="flex space-x-3">
      <button
        type="button"
        onClick={onBack}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-300"
      >
        Back
      </button>
      <button
        type="submit"
        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300"
      >
        Sign Up
      </button>
    </div>
  </form>
);

const LoginPopup: React.FC<LoginPopupProps> = ({ onClose, onMFAVerified }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [signupStep, setSignupStep] = useState<SignupStep>('names');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showMfaPrompt, setShowMfaPrompt] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaChallengeId, setMfaChallengeId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      if (mode === 'login') {
        const signInData = await signInWithEmail(email, password);
        const factorsRes = await supabase.auth.mfa.listFactors();
        if (factorsRes.error) {
          throw factorsRes.error;
        }
        if (
          factorsRes.data &&
          factorsRes.data.totp &&
          factorsRes.data.totp.length > 0
        ) {
          const factor = factorsRes.data.totp[0];
          setMfaFactorId(factor.id);
          const challengeRes = await supabase.auth.mfa.challenge({
            factorId: factor.id
          });
          if (challengeRes.error) {
            throw challengeRes.error;
          }
          setMfaChallengeId(challengeRes.data.id);
          setShowMfaPrompt(true);
          return; // Wait for OTP verification.
        } else {
          // No MFA required, mark as verified.
          if (onMFAVerified) {
            onMFAVerified();
          } else {
            onClose();
          }
        }
      } else {
        await signUpWithEmail(firstName, lastName, email, password);
        onClose();
      }
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      const verifyRes = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code: mfaCode,
      });
      if (verifyRes.error) {
        setErrorMessage(verifyRes.error.message);
        return;
      }
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        setErrorMessage(refreshError.message);
        return;
      }
      console.log('Refreshed session:', refreshed);
      // Instead of closing the popup immediately, gate full access until MFA is verified.
      if (onMFAVerified) {
        onMFAVerified();
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unknown error occurred.');
    }
  };

  return (
    <>
      <div
        {...(showMfaPrompt ? {} : { onClick: onClose })}
        className={`fixed inset-0 flex items-center justify-center ${
          showMfaPrompt ? "bg-transparent backdrop-blur-md" : "bg-gray-500 bg-opacity-50"
        } z-50`}
      >
        <div onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-lg shadow-lg w-96">
          <h2 className="text-xl font-bold mb-4 text-center">
            {mode === 'login' ? 'Log In' : `Sign Up ${signupStep === 'names' ? '(1/2)' : '(2/2)'}`}
          </h2>
          
          {errorMessage && <p className="text-red-500 mb-4 text-center">{errorMessage}</p>}

          {!showMfaPrompt && (mode === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded"
                required
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300"
              >
                Log In
              </button>
            </form>
          ) : (
            signupStep === 'names' ? (
              <SignupStepOne
                firstName={firstName}
                lastName={lastName}
                setFirstName={setFirstName}
                setLastName={setLastName}
                onNext={() => setSignupStep('credentials')}
              />
            ) : (
              <SignupStepTwo
                email={email}
                password={password}
                setEmail={setEmail}
                setPassword={setPassword}
                onBack={() => setSignupStep('names')}
                onSubmit={handleSubmit}
              />
            )
          ))}
          {mode === 'login' && showMfaPrompt && (
            <form onSubmit={handleMfaSubmit} className="space-y-4 mt-4">
              <p className="text-center">Enter your MFA code from your authenticator app</p>
              <input
                type="text"
                placeholder="MFA Code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="w-full px-4 py-2 border rounded"
                required
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-300"
              >
                Verify MFA Code
              </button>
            </form>
          )}

          <div className="mt-4 text-center">
            {mode === 'login' ? (
              <p>
                Not signed up yet?{' '}
                <button 
                  onClick={() => {
                    setMode('signup');
                    setSignupStep('names');
                  }} 
                  className="text-blue-500 underline"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button 
                  onClick={() => setMode('login')} 
                  className="text-blue-500 underline"
                >
                  Log In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPopup;
