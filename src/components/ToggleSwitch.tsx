import React from 'react';

interface ToggleSwitchProps {
  isActive: boolean;
  onChange: (isActive: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  isActive, 
  onChange, 
  loading = false,
  disabled = false
}) => {
  return (
    <div className="flex items-center justify-center">
      <div 
        onClick={() => !loading && !disabled && onChange(!isActive)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          isActive ? 'bg-green-500' : 'bg-gray-300'
        } ${(loading || disabled) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        role="switch"
        aria-checked={isActive}
        aria-busy={loading}
        aria-disabled={disabled}
      >
        <span 
          className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            isActive ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
          }`}
        >
          {loading && (
            <span className="absolute inset-0 flex h-full w-full items-center justify-center">
              <svg className="h-3 w-3 animate-spin text-gray-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default ToggleSwitch; 