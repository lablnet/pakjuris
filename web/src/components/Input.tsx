import React, { InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../utils/cn'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isPasswordToggleable?: boolean;
}

const Input: React.FC<InputProps> = ({
  className,
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  size = 'md',
  fullWidth = true,
  type = 'text',
  isPasswordToggleable = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Determine input type for password fields
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  // Define sizing based on the size prop
  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-5 py-2.5',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const inputClass = cn(
    'rounded-lg border transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    sizes[size],
    widthClass,
    error ? 'border-red-300 bg-red-50' : 'border-gray-300',
    leftIcon ? 'pl-10' : '',
    (rightIcon || (type === 'password' && isPasswordToggleable)) ? 'pr-10' : '',
    className
  );

  return (
    <div className={cn('flex flex-col', widthClass)}>
      {label && (
        <label htmlFor={props.id} className="block text-gray-700 font-medium mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {leftIcon}
          </div>
        )}
        
        <input
          type={inputType}
          className={inputClass}
          {...props}
        />
        
        {(type === 'password' && isPasswordToggleable) && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        )}
        
        {rightIcon && !isPasswordToggleable && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
            {rightIcon}
          </div>
        )}
      </div>
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-600">{helperText}</p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;
