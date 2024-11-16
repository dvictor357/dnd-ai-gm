import React from 'react';
import { UserIcon, ComputerDesktopIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

const ChatMessage = ({ message }) => {
  const getMessageStyle = () => {
    switch (message.type) {
      case 'action':
        return 'bg-gray-800 border-primary-600';
      case 'gm_response':
        return 'bg-gray-900 border-amber-600 shadow-lg shadow-amber-900/20';
      case 'system':
        return 'bg-gray-800 border-blue-600';
      default:
        return 'bg-gray-800 border-gray-600';
    }
  };

  const getMessageAnimation = () => {
    if (message.type === 'gm_response') {
      return 'animate-fade-in';
    }
    return '';
  };

  const getIcon = () => {
    switch (message.type) {
      case 'action':
        return <UserIcon className="w-6 h-6 text-primary-400" />;
      case 'gm_response':
        return <ComputerDesktopIcon className="w-6 h-6 text-amber-400" />;
      case 'system':
        return <InformationCircleIcon className="w-6 h-6 text-blue-400" />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (message.type) {
      case 'action':
        return message.player ? `${message.player.name} (${message.player.class})` : 'Player';
      case 'gm_response':
        return 'Game Master';
      case 'system':
        return 'System';
      default:
        return '';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getMessageStyle()} ${getMessageAnimation()} mb-4 transition-all duration-300 ease-in-out hover:scale-[1.01]`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary-300 mb-1 flex items-center">
            {getTitle()}
            {message.type === 'gm_response' && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-amber-900/30 text-amber-300 rounded-full">
                AI Dungeon Master
              </span>
            )}
          </p>
          <div className={`text-white prose prose-invert max-w-none ${
            message.type === 'gm_response' ? 'prose-p:leading-relaxed prose-strong:text-cyan-300 prose-strong:font-medieval prose-em:text-amber-200/90' : ''
          }`}>
            {message.type === 'gm_response' ? (
              <div 
                className="space-y-2"
                dangerouslySetInnerHTML={{ 
                  __html: message.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="magical-text">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/\n/g, '<br>')
                    .replace(/\[(\w+)\]/g, '<span class="px-1.5 py-0.5 bg-cyan-900/30 text-cyan-300 rounded font-medieval glow-sm">$1</span>')
                }} 
              />
            ) : (
              <p>{message.content}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
