import React, { useState, useEffect } from 'react';
import useGameStore from '../store/gameStore';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const ServerStatus = () => {
  const { isConnected, gameStats, ws } = useGameStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    status: 'checking',
    model: { name: '', type: '', version: '' },
    system: {
      memory: { heapUsed: 0, heapTotal: 0, external: 0, usagePercent: 0 },
      performance: { responseTime: 0, activeSessions: 0 }
    }
  });

  useEffect(() => {
    const fetchSystemInfo = async () => {
      if (ws) {
        ws.emit('get_server_info');
      }
    };

    // Fetch initial system info
    fetchSystemInfo();

    // Set up listener for system info updates
    if (ws) {
      ws.on('server_info_response', (info) => {
        setSystemInfo(info);
      });

      // Fetch system info every 30 seconds
      const interval = setInterval(fetchSystemInfo, 30000);

      return () => {
        ws.off('server_info_response');
        clearInterval(interval);
      };
    }
  }, [ws]);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        {/* Basic Info - Always Visible */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div 
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="font-medium">Server Status</span>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Stats Summary - Always Visible */}
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <div>Players: {gameStats.playerCount}</div>
          <div>Encounters: {gameStats.encounterCount}</div>
          <div>Rolls: {gameStats.rollCount}</div>
          <button 
            onClick={toggleExpanded}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors duration-200"
          >
            {isExpanded ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Stats */}
      {isExpanded && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Game Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Active Players:</span>
                <span className="text-green-400">{gameStats.playerCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Encounters:</span>
                <span className="text-blue-400">{gameStats.encounterCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Dice Rolls:</span>
                <span className="text-purple-400">{gameStats.rollCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium mb-2">System Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Memory Usage:</span>
                <span className="text-yellow-400">{systemInfo.system?.memory?.usagePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span>Heap Used:</span>
                <span className="text-blue-400">{systemInfo.system?.memory?.heapUsed} MB</span>
              </div>
              <div className="flex justify-between">
                <span>Response Time:</span>
                <span className="text-green-400">{systemInfo.system?.performance?.responseTime} ms</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium mb-2">AI Model</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Model:</span>
                <span className="text-blue-400">{systemInfo.model?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="text-purple-400">{systemInfo.model?.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Version:</span>
                <span className="text-green-400">{systemInfo.model?.version}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerStatus;
