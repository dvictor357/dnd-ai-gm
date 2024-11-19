import React, { useEffect, useState } from 'react';
import useGameStore from '../store/gameStore';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const ServerStatus = () => {
  const { isConnected, gameStats } = useGameStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [serverInfo, setServerInfo] = useState({
    status: 'checking',
    activeConnections: 0,
    encounters: 0,
    rolls: 0,
    model: { type: '', name: '' }
  });

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const wsHost = import.meta.env.VITE_WS_HOST;
        const response = await fetch(`http://${wsHost}/server-info`);
        const data = await response.json();
        setServerInfo({
          status: data.status,
          activeConnections: data.activeConnections,
          encounters: data.encounters,
          rolls: data.rolls,
          model: data.model
        });
      } catch (error) {
        setServerInfo({
          status: 'offline',
          activeConnections: 0,
          encounters: 0,
          rolls: 0,
          model: { type: '', name: '' }
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
    <div className="py-2">
      <div className="flex items-center justify-between">
        {/* Basic Info - Always Visible */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div 
              className={`w-2 h-2 rounded-full ${
                isConnected && serverInfo.status === 'ok' 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
              }`}
            />
            <span className="font-medium">Server Status</span>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <span className="text-gray-500">|</span>
            <span className={
              serverInfo.status === 'ok' ? 'text-green-400' : 
              serverInfo.status === 'checking' ? 'text-yellow-400' : 'text-red-400'
            }>
              {serverInfo.status}
            </span>
          </div>
        </div>

        {/* Stats Summary - Always Visible */}
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <div>Players: {serverInfo.activeConnections}</div>
          <div>Encounters: {serverInfo.encounters}</div>
          <div>Rolls: {gameStats.rollCount}</div>
          <button 
            onClick={toggleExpanded}
            className="flex items-center space-x-1 hover:text-gray-200"
          >
            <span>Details</span>
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronUpIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-gray-700 text-sm text-gray-400">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500">Total Server Rolls:</span> {serverInfo.rolls}
            </div>
            <div>
              <span className="text-gray-500">AI Model:</span>{' '}
              {serverInfo.model.type} ({serverInfo.model.name})
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerStatus;
