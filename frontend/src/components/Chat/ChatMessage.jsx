import React from 'react';
import { UserIcon, ComputerDesktopIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';
import ActionSelector from './ActionSelector';
import DiceRollCode from './DiceRollCode';

// Process special formatting before markdown
const processSpecialFormatting = (text) => {
  // First, escape any existing HTML tags to prevent conflicts
  text = text.replace(/[<>]/g, match => match === '<' ? '&lt;' : '&gt;');

  // Convert #...# to custom markdown for locations
  text = text.replace(/#([^#]+?)#/g, '`loc:$1`');

  // Convert @...@ to custom markdown for characters
  text = text.replace(/@([^@]+?)@/g, '`char:$1`');

  // Convert "..." to custom markdown for dialogue
  text = text.replace(/"([^"]+?)"/g, '`dial:$1`');

  return text;
};

// Custom components for ReactMarkdown
const customComponents = {
  // Text styling components
  strong: ({ children }) => (
    <span className="text-cyan-300 font-medieval px-2 py-0.5 rounded glow-cyan">
      {children}
    </span>
  ),
  em: ({ children }) => (
    <span className="text-amber-200/90 italic px-2 py-0.5 rounded glow-amber">
      {children}
    </span>
  ),
  code: ({ children }) => {
    const text = children.toString();
    if (text.startsWith('loc:')) {
      const location = text.slice(4).trim();
      return (
        <span className="text-emerald-400 font-medieval px-2 py-0.5 rounded-md inline-flex items-center bg-emerald-950/40 border border-emerald-700/30 glow-emerald">
          {location}
        </span>
      );
    }
    if (text.startsWith('char:')) {
      const character = text.slice(5).trim();
      return (
        <span className="text-violet-300 font-medieval px-2 py-0.5 rounded-md inline-flex items-center bg-violet-950/40 border border-violet-700/30 glow-violet">
          {character}
        </span>
      );
    }
    if (text.startsWith('dial:')) {
      const dialogue = text.slice(5).trim();
      return (
        <span className="text-yellow-200/90 px-2 py-0.5 rounded inline-block italic">
          {dialogue}
        </span>
      );
    }
    return <DiceRollCode content={text} />;
  },
  p: ({ children }) => (
    <div className="mb-3 last:mb-0 leading-relaxed">{children}</div>
  ),
  pre: ({ children }) => <pre className="bg-transparent p-0">{children}</pre>,
};

// Component for GM badge
const GMBadge = () => (
  <span className="ml-2 px-2 py-0.5 text-xs bg-amber-900/40 text-amber-200 rounded-full border border-amber-700/30 shadow-inner shadow-amber-900/20">
    AI Game Master
  </span>
);

export default function ChatMessage({ message, actions }) {
  const getIcon = () => {
    switch (message.type) {
      case 'gm_response':
        return <ComputerDesktopIcon className="w-5 h-5 text-amber-200/80" />;
      case 'system':
        return <InformationCircleIcon className="w-5 h-5 text-blue-300/80" />;
      default:
        return <UserIcon className="w-5 h-5 text-primary-300" />;
    }
  };

  const getTitle = () => {
    switch (message.type) {
      case 'gm_response':
        return 'GM';
      case 'system':
        return 'System';
      default:
        return message.player?.name || 'Player';
    }
  };

  return (
    <div className={`flex ${message.type === 'action' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`
        max-w-[85%] 
        ${message.type === 'gm_response'
          ? 'bg-gradient-to-br from-gray-800/95 to-gray-900/95 border border-gray-700/50'
          : message.type === 'system'
            ? 'bg-blue-900/20 border border-blue-700/30'
            : message.type === 'action'
              ? 'bg-gray-700/90'
              : 'bg-gray-800/90'
        } 
        rounded-lg p-4 shadow-md backdrop-blur-sm
        ${message.type === 'gm_response' ? 'shadow-amber-900/5' : ''}
        ${message.type === 'system' ? 'shadow-blue-900/5' : ''}
      `}>
        <div className="flex items-center mb-2">
          {getIcon()}
          <span className={`text-sm font-medium ml-2 ${message.type === 'system'
            ? 'text-blue-300'
            : 'text-primary-300'
            }`}>
            {getTitle()}
          </span>
          {message.type === 'gm_response' && <GMBadge />}
        </div>

        <div className={`prose prose-invert max-w-none ${message.type === 'gm_response'
          ? 'prose-p:leading-relaxed prose-p:text-gray-100'
          : message.type === 'system'
            ? 'prose-p:leading-relaxed prose-p:text-blue-100'
            : 'text-gray-100'
          }`}>
          <ReactMarkdown
            components={customComponents}
          >
            {processSpecialFormatting(message.content)}
          </ReactMarkdown>
          {actions && <ActionSelector actions={actions} />}
        </div>
      </div>
    </div>
  );
};
