import React, { useEffect, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import useGameStore from '../../store/gameStore';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { XCircleIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '../common/ConfirmationModal';
import DiceRoller from '../DiceRoller/DiceRoller';

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
  const [showDiceRoller, setShowDiceRoller] = useState(false);

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

      <div className="flex-1 overflow-hidden relative">
        <Virtuoso
          ref={virtuosoRef}
          data={messages}
          totalCount={messages.length}
          followOutput="smooth"
          initialTopMostItemIndex={messages.length - 1}
          alignToBottom={true}
          stick="true"
          itemContent={(index, message) => (
            <div className="p-4">
              <ChatMessage key={index} message={message} />
            </div>
          )}
        />
        {isGMTyping && <TypingIndicator />}
      </div>

      <form onSubmit={handleSubmit} className="flex-none p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex space-x-4">
          {isGMTyping ? (
            <div className="flex-1 flex items-center px-4 py-2 bg-gray-700 rounded-lg">
              <TypingIndicator />
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowDiceRoller(!showDiceRoller)}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors w-10 h-10 flex items-center justify-center"
                title="Roll Dice"
              >
                <span className="text-xl">🎲</span>
              </button>
              <input
                type="text"
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="What would you like to do?"
                className="flex-1 px-4 py-2 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </>
          )}
          <button
            type="submit"
            disabled={!chatInput.trim() || !ws?.connected}
            className={`p-2 rounded-lg ${chatInput.trim() && ws?.connected
              ? 'bg-primary-500 hover:bg-primary-600 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
          >
            <PaperAirplaneIcon className="w-6 h-6" />
          </button>
        </div>
      </form>

      {showDiceRoller && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Roll Dice</h2>
              <button
                onClick={() => setShowDiceRoller(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <DiceRoller triggerAction={() => setShowDiceRoller(false)} />
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isEndGameModalOpen}
        onClose={() => setIsEndGameModalOpen(false)}
        onConfirm={() => {
          endGame();
          setIsEndGameModalOpen(false);
        }}
        title="End Game"
        message="Are you sure you want to end this game? This will clear all messages and character data."
      />
    </div>
  );
};

export default ChatWindow;
