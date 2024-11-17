import React from 'react';
import { UserIcon, ComputerDesktopIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';
import ActionSelector from './ActionSelector';
import DiceRollCode from './DiceRollCode';

// Process special formatting before markdown
const processSpecialFormatting = (text) => {
  // Helper to escape HTML but preserve markdown
  const escapeHTML = (str) => str.replace(/[<>]/g, match => match === '<' ? '&lt;' : '&gt;');

  // Helper to find all non-overlapping matches with their positions
  const findMatches = (text) => {
    const patterns = [
      { regex: /@[^@]+?@/g, type: 'char' },  // Characters must be processed first
      { regex: /#[^#]+?#/g, type: 'loc' },   // Then locations
      { regex: /"[^"]+?"/g, type: 'dial' },  // Then dialogue
      { regex: /\*\*[^*]+?\*\*/g, type: 'strong' },  // Then bold
      { regex: /\*[^*]+?\*/g, type: 'em' }   // Then italic
    ];

    let matches = [];
    patterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
          type
        });
      }
    });

    // Sort matches by start position and length (longer matches first for same position)
    return matches.sort((a, b) => {
      if (a.start === b.start) {
        return b.end - a.end; // Longer matches first
      }
      return a.start - b.start;
    });
  };

  // Process the text with non-overlapping matches
  const matches = findMatches(text);
  let result = '';
  let currentPos = 0;

  // Helper to convert match to markdown
  const convertToMarkdown = (match) => {
    const content = match.text.slice(1, -1).trim();
    switch (match.type) {
      case 'char':
        return '`char:' + content + '`';
      case 'loc':
        return '`loc:' + content + '`';
      case 'dial':
        return '`dial:' + content + '`';
      case 'strong':
        return '**' + content + '**';
      case 'em':
        return '*' + content + '*';
      default:
        return match.text;
    }
  };

  // Process matches in order
  matches.forEach(match => {
    // Add any text before this match
    if (match.start > currentPos) {
      result += escapeHTML(text.slice(currentPos, match.start));
    }

    // Add the converted match
    result += convertToMarkdown(match);
    currentPos = match.end;
  });

  // Add any remaining text
  if (currentPos < text.length) {
    result += escapeHTML(text.slice(currentPos));
  }

  return result;
};

// Custom components for ReactMarkdown
const customComponents = {
  strong: ({ children, ...props }) => (
    <span className="text-cyan-300 font-medieval px-2 py-0.5 rounded glow-cyan" {...props}>
      {children}
    </span>
  ),
  em: ({ children, ...props }) => (
    <span className="text-amber-200/90 px-2 py-0.5 rounded" {...props}>
      {children}
    </span>
  ),
  code: ({ children, ...props }) => {
    const text = children.toString();

    // Special formatting handlers with priority
    const formatters = {
      'char:': (content) => (
        <span className="text-violet-300 font-medieval px-2 py-0.5 rounded-md inline-flex items-center bg-violet-950/40 border border-violet-700/30">
          {content}
        </span>
      ),
      'loc:': (content) => (
        <span className="text-emerald-400 font-medieval px-2 py-0.5 rounded-md inline-flex items-center bg-emerald-950/40 border border-emerald-700/30">
          {content}
        </span>
      ),
      'dial:': (content) => (
        <span className="text-yellow-200/90 px-2 py-0.5 rounded inline-block italic glow-amber">
          {content}
        </span>
      )
    };

    // Check for special formatting with priority handling
    for (const [prefix, formatter] of Object.entries(formatters)) {
      if (text.startsWith(prefix)) {
        const content = text.slice(prefix.length).trim();
        // Process any remaining markdown in the content
        return formatter(content);
      }
    }

    // Default to dice roll code if no special formatting
    return <DiceRollCode content={text} {...props} />;
  },
  p: ({ children, ...props }) => (
    <div className="mb-3 last:mb-0 leading-relaxed" {...props}>
      {children}
    </div>
  ),
  pre: ({ children, ...props }) => (
    <pre className="bg-transparent p-0" {...props}>
      {children}
    </pre>
  ),
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
