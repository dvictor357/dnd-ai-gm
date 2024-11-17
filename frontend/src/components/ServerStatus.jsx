import React, { useEffect, useState } from 'react';
import useGameStore from '../store/gameStore';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const ServerStatus = () => {
  const { isConnected, gameStats } = useGameStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [serverInfo, setServerInfo] = useState({
    status: 'checking',
    version: '',
    uptime: ''
  });

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const wsHost = import.meta.env.VITE_WS_HOST;
        const response = await fetch(`http://${wsHost}/server-info`);
        const data = await response.json();
        setServerInfo({
          status: 'online',
          version: data.version,
          uptime: data.uptime
        });
      } catch (error) {
        setServerInfo({
          status: 'offline',
          version: '',
          uptime: ''
        });
      }
    };

    // Check status immediately and then every 30 seconds
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <div 
      className={`fixed bottom-4 right-4 bg-gray-800 rounded-lg shadow-lg text-sm text-gray-300 transition-all duration-300 ${
        isExpanded ? 'w-64' : 'w-auto'
      }`}
    >
      {/* Header - Always visible */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-700 rounded-t-lg"
        onClick={toggleExpanded}
      >
        <div className="flex items-center space-x-2">
          <div 
            className={`w-2 h-2 rounded-full ${
              isConnected && serverInfo.status === 'online' 
                ? 'bg-green-500' 
                : 'bg-red-500'
            }`}
          />
          <span className="font-medium">Server Status</span>
        </div>
        {isExpanded ? (
          <ChevronDownIcon className="w-4 h-4" />
        ) : (
          <ChevronUpIcon className="w-4 h-4" />
        )}
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-3 space-y-2 border-t border-gray-700">
          <div className="flex items-center space-x-2">
            <span>Connection:</span>
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span>Server:</span>
            <span className={
              serverInfo.status === 'online' ? 'text-green-400' : 
              serverInfo.status === 'checking' ? 'text-yellow-400' : 'text-red-400'
            }>
              {serverInfo.status}
            </span>
          </div>

          {serverInfo.status === 'online' && (
            <>
              <div className="text-gray-400">
                <span className="text-gray-500">Version:</span> {serverInfo.version}
              </div>
              <div className="text-gray-400">
                <span className="text-gray-500">Uptime:</span> {serverInfo.uptime}
              </div>
            </>
          )}

          <div className="border-t border-gray-700 pt-2 mt-2 space-y-1">
            <div className="text-gray-400 flex justify-between">
              <span className="text-gray-500">Players:</span>
              <span>{gameStats.playerCount}</span>
            </div>
            <div className="text-gray-400 flex justify-between">
              <span className="text-gray-500">Encounters:</span>
              <span>{gameStats.encounterCount}</span>
            </div>
            <div className="text-gray-400 flex justify-between">
              <span className="text-gray-500">Dice Rolls:</span>
              <span>{gameStats.rollCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerStatus;
