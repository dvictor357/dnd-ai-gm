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
    isCharacterCreated,
    chatInput,
    setChatInput,
  } = useGameStore();

  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for WebSocket messages to handle loading state
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'gm_response') {
        setIsLoading(false);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

    setIsLoading(true);

    // Add player message
    addMessage({
      type: 'action',
      content: chatInput,
      player: {
        name: character.name,
        class: character.class,
        race: character.race
      }
    });

    // Send to server
    ws.send(JSON.stringify({
      type: 'action',
      content: chatInput,
      character: {
        name: character.name,
        race: character.race,
        class: character.class,
        stats: character.stats
      }
    }));

    setChatInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-400 animate-pulse">
            <div className="w-6 h-6">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            </div>
            <div className="w-6 h-6">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            </div>
            <div className="w-6 h-6">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span>Game Master is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex space-x-4">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={!isCharacterCreated || isLoading}
            placeholder={isCharacterCreated ? (isLoading ? "Game Master is thinking..." : "What would you like to do?") : "Create your character to begin..."}
            className={`flex-1 bg-gray-700 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 ${isLoading ? 'animate-pulse' : ''}`}
          />
          <button
            type="submit"
            disabled={!isCharacterCreated || isLoading || !chatInput.trim()}
            className={`px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isLoading ? 'animate-pulse' : ''}`}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
