import React, { useEffect, useRef, useState } from 'react';
import useGameStore from '../../store/gameStore';
import ChatMessage from './ChatMessage';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

const ChatWindow = () => {
  const {
    messages,
    ws,
    addMessage,
    character,
    isCharacterCreated
  } = useGameStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for GM responses to reset loading state
  useEffect(() => {
    const handleGMResponse = () => {
      setIsLoading(false);
    };

    window.addEventListener('gmResponse', handleGMResponse);
    return () => window.removeEventListener('gmResponse', handleGMResponse);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

    setIsLoading(true);

    // Add player message
    addMessage({
      type: 'action',
      content: input,
      player: {
        name: character.name,
        class: character.class,
        race: character.race
      }
    });

    // Send to server
    ws.send(JSON.stringify({
      type: 'action',
      content: input,
      character: {
        name: character.name,
        race: character.race,
        class: character.class,
        stats: character.stats
      }
    }));

    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex flex-col space-y-2">

          <div className="flex space-x-4">
            <input
              type="text"
              value={isLoading ? "The GM is typing..." : input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!isCharacterCreated || isLoading}
              placeholder={isCharacterCreated ? "What would you like to do?" : "Create your character to begin..."}
              className={`flex-1 bg-gray-700 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 ${isLoading ? 'animate-pulse' : ''
                }`}
            />
            <button
              type="submit"
              disabled={!isCharacterCreated || isLoading || !input.trim()}
              className={`px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isLoading ? 'animate-pulse' : ''
                }`}
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
