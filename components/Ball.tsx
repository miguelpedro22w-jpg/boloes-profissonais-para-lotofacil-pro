
import React from 'react';
import { getBallColorClass } from '../utils/lotteryUtils';

interface BallProps {
  number: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  selected?: boolean;
  onClick?: () => void;
  isResult?: boolean; // If true, simpler styling for results list
}

export const Ball: React.FC<BallProps> = ({ number, size = 'md', selected = false, onClick, isResult = false }) => {
  const colorClass = getBallColorClass(number);
  
  const sizeClasses = {
    sm: 'w-9 h-9 text-base font-bold', // Increased to 36px
    md: 'w-12 h-12 text-lg font-bold', // Increased to 48px
    lg: 'w-14 h-14 text-xl font-bold',
    xl: 'w-20 h-20 text-3xl font-black' // Increased to 80px for massive highlight
  };

  const baseClasses = `flex items-center justify-center rounded-full text-white shadow-sm transition-transform ${sizeClasses[size]}`;
  const interactiveClasses = onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : '';
  const opacityClass = (onClick && !selected) ? 'opacity-30 bg-gray-400' : colorClass;
  
  // If purely for display (result list), we always show full color
  const finalColor = onClick ? (selected ? colorClass : 'bg-gray-300 text-gray-600') : colorClass;

  return (
    <div 
      className={`${baseClasses} ${finalColor} ${interactiveClasses}`}
      onClick={onClick}
    >
      {number.toString().padStart(2, '0')}
    </div>
  );
};
