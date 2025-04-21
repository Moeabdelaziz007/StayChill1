import React from 'react';
import { Link } from 'wouter';
import { Snowflake } from 'lucide-react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'compact' | 'monochrome';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  variant = 'default',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  // Monochrome variant uses current text color, for footers or dark backgrounds
  if (variant === 'monochrome') {
    return (
      <Link to="/">
        <div className={`flex items-center font-bold ${sizeClasses[size]} cursor-pointer ${className}`}>
          <span className="font-extrabold tracking-tight">STAY</span>
          <span className="font-light tracking-wider">CHILL</span>
          <Snowflake className={`${iconSizes[size]} ml-1 opacity-80`} />
        </div>
      </Link>
    );
  }

  // Compact variant for navbar on mobile
  if (variant === 'compact') {
    return (
      <Link to="/">
        <div className={`flex items-center font-bold ${sizeClasses[size]} cursor-pointer ${className}`}>
          <span className="font-black text-black dark:text-white">S</span>
          <span className="text-primary font-black">C</span>
          <Snowflake className={`${iconSizes[size]} text-primary ml-0.5`} />
        </div>
      </Link>
    );
  }

  // Default luxury variant
  return (
    <Link to="/">
      <div className={`flex items-center font-bold ${sizeClasses[size]} cursor-pointer ${className}`}>
        <span className="font-black text-black dark:text-white tracking-tight">STAY</span>
        <span className="text-primary font-extrabold tracking-tight">CHILL</span>
        <Snowflake className={`${iconSizes[size]} text-primary ml-1`} stroke="currentColor" strokeWidth={2.5} />
      </div>
    </Link>
  );
};

export default Logo;