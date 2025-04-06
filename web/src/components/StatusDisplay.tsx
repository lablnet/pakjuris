import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusDisplayProps {
  status: {
    step: string;
    message: string;
    intent?: string;
  };
  isConnected?: boolean;
  connectionError?: string | null;
  onReconnect?: () => void;
}

const steps = {
  start: { icon: '🚀', label: 'Starting' },
  intent: { icon: '🧠', label: 'Analyzing Intent' },
  search: { icon: '🔍', label: 'Searching' },
  embedding: { icon: '📊', label: 'Processing' },
  filtering: { icon: '🔎', label: 'Filtering' },
  ranking: { icon: '📈', label: 'Ranking' },
  summary: { icon: '✍️', label: 'Generating' },
  finalizing: { icon: '✨', label: 'Finalizing' },
  complete: { icon: '✅', label: 'Complete' }
};

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, isConnected, connectionError, onReconnect }) => {
  const currentStepIndex = Object.keys(steps).indexOf(status.step);
  const totalSteps = Object.keys(steps).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 shadow-lg border border-blue-100"
    >
      <div className="space-y-4">
        {/* Connection Error Message */}
        {connectionError && !isConnected && (
          <div className="bg-yellow-100 text-amber-800 px-3 py-2 rounded-lg text-xs flex justify-between items-center mb-2">
            <span>{connectionError}</span>
            {onReconnect && (
              <button 
                onClick={onReconnect}
                className="bg-amber-200 hover:bg-amber-300 text-amber-800 px-2 py-1 rounded text-xs font-medium ml-2"
              >
                Reconnect
              </button>
            )}
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex justify-between items-center">
          {Object.entries(steps).map(([step, { icon, label }], index) => (
            <motion.div
              key={step}
              className="flex flex-col items-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: index <= currentStepIndex ? 1 : 0.8,
                opacity: index <= currentStepIndex ? 1 : 0.5
              }}
              transition={{ duration: 0.3 }}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-lg
                ${index <= currentStepIndex 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-500'}
              `}>
                {icon}
              </div>
              <span className="text-xs mt-1 text-gray-600">{label}</span>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStepIndex + 1) / totalSteps * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Status Message */}
        <AnimatePresence mode="wait">
          <motion.div
            key={status.message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <p className="text-sm text-gray-700 font-medium">
              {status.message}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default StatusDisplay; 