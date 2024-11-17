import React, { useEffect, useRef, useState } from 'react';
import useGameStore from '../../store/gameStore';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { XCircleIcon } from '@heroicons/react/24/outline';

const ChatWindow = () => {
  const {
    messages,
    ws,
    addMessage,
    character,
    isCharacterCreated,
    chatInput,
    setChatInput,
    endGame
  } = useGameStore();

  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const chatContainer = messagesEndRef.current.parentElement;
      const isScrolledNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;

      // Only smooth scroll if user is already near the bottom
      messagesEndRef.current?.scrollIntoView({
        behavior: isScrolledNearBottom ? 'smooth' : 'auto',
        block: 'end'
      });
    }
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
        stats: character.stats,
        background: character.background
      }
    }));

    setChatInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">
          {character.name ? `${character.name}'s Adventure` : 'D&D Adventure'}
        </h2>
        {isCharacterCreated && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to end this game? This will clear all your character data and chat history.')) {
                endGame();
              }
            }}
            className="text-red-400 hover:text-red-300 transition-colors"
            title="End Game"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-12rem)] min-h-[400px]">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            actions={message.type === 'gm_response' ? message.actions : null}
          />
        ))}
        {isLoading && <TypingIndicator />}
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
