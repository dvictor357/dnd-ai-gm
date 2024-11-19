import React, { useEffect, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import useGameStore from '../../store/gameStore';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { XCircleIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '../common/ConfirmationModal';

const ChatWindow = () => {
  const {
    messages,
    ws,
    addMessage,
    character,
    chatInput,
    setChatInput,
    endGame,
    isGMTyping,
    currentRoom
  } = useGameStore();

  const [isEndGameModalOpen, setIsEndGameModalOpen] = useState(false);

  const virtuosoRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.type === 'gm_response' && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !ws || !ws.connected) return;

    // Add player message
    const playerMessage = {
      type: 'action',
      content: chatInput,
      player: {
        name: character.name,
        class: character.class,
        race: character.race
      }
    };
    addMessage(playerMessage);

    // Send to server
    ws.emit('message', {
      type: 'action',
      content: chatInput,
      character: {
        name: character.name,
        race: character.race,
        class: character.class,
        stats: character.stats,
        background: character.background
      }
    });

    setChatInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none flex justify-between items-center px-4 py-2 border-b border-gray-700">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-white">
            {character.name ? `${character.name}'s Adventure` : 'D&D Adventure'}
          </h2>
          {currentRoom && (
            <span className="text-sm text-gray-400">Room: {currentRoom}</span>
          )}
        </div>
        <button
          onClick={() => setIsEndGameModalOpen(true)}
          className="text-red-400 hover:text-red-300 transition-colors"
          title="End Game"
        >
          <XCircleIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <Virtuoso
          ref={virtuosoRef}
          data={messages}
          totalCount={messages.length}
          followOutput="smooth"
          initialTopMostItemIndex={messages.length - 1}
          alignToBottom={true}
          stick
          itemContent={(index, message) => (
            <div className="p-4">
              <ChatMessage key={index} message={message} />
            </div>
          )}
          style={{ height: '100%' }}
        />
      </div>

      <form onSubmit={handleSubmit} className="flex-none p-4 border-t border-gray-700">
        <div className="flex space-x-4">
          {isGMTyping ? (
            <div className="flex-1 bg-gray-800/50 border border-primary-500/20 rounded-lg py-3">
              <TypingIndicator />
            </div>
          ) : (
            <>
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="What would you like to do?"
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </form>

      <ConfirmationModal
        isOpen={isEndGameModalOpen}
        onClose={() => setIsEndGameModalOpen(false)}
        onConfirm={endGame}
        title="End Game"
        message="Are you sure you want to end this game? This will clear all your character data and chat history."
      />
    </div>
  );
};

export default ChatWindow;
