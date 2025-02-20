import React from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const calculateStrength = (): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    const strengthMap = {
      0: { label: 'Very Weak', color: 'bg-red-500' },
      1: { label: 'Weak', color: 'bg-orange-500' },
      2: { label: 'Medium', color: 'bg-yellow-500' },
      3: { label: 'Strong', color: 'bg-blue-500' },
      4: { label: 'Very Strong', color: 'bg-green-500' }
    };

    return {
      strength: (strength / 4) * 100,
      label: strengthMap[strength as keyof typeof strengthMap].label,
      color: strengthMap[strength as keyof typeof strengthMap].color
    };
  };

  const { strength, label, color } = calculateStrength();

  return (
    <div className="w-full mt-2">
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${strength}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
};

export default PasswordStrengthMeter;
