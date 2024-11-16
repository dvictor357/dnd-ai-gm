import React from 'react';

const D20Icon = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M12 2L2 8.5V15.5L12 22L22 15.5V8.5L12 2ZM12 4.25L4.5 9.25V14.75L12 19.75L19.5 14.75V9.25L12 4.25Z"
    />
    <path d="M12 7L7 10V15L12 18L17 15V10L12 7Z" />
    <path d="M12 9L9 11V14L12 16L15 14V11L12 9Z" />
    <circle cx="12" cy="12.5" r="1" />
  </svg>
);

export default D20Icon;
