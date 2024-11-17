import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/solid';

const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-3 px-2">
      <div className="relative">
        <SparklesIcon className="w-5 h-5 text-primary-400 animate-pulse" />
      </div>
      <span className="text-primary-300 text-sm font-medium italic">
        The Game Master weaves the next part of your tale...
      </span>
    </div>
  );
};

export default TypingIndicator;
