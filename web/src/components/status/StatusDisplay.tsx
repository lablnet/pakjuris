import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusDisplayProps {
  status: {
    step: string;
    message: string;
    intent?: string;
    output?: any;
  };
  isConnected?: boolean;
  connectionError?: string | null;
  onReconnect?: () => void;
}

// Define tool names as a type
type ToolName = 'generate_search_terms' | 'retrieve_documents' | 'agent_thinking' | 'agent_final';

// Map actual tool names to user-friendly display info
const toolInfo: Record<ToolName, { icon: string; label: string; description: string }> = {
  generate_search_terms: { icon: '🧠', label: 'Generating Search Terms', description: 'Creating optimized search queries...' },
  retrieve_documents: { icon: '🔍', label: 'Searching Documents', description: 'Finding relevant legal documents...' },
  agent_thinking: { icon: '🤖', label: 'AI Processing', description: 'Analyzing and preparing response...' },
  agent_final: { icon: '✅', label: 'Complete', description: 'Response ready!' }
};

// Helper function to determine current status based on step and output
const getStatusInfo = (step: string, output: any) => {
  if (step === 'agent') {
    // Check if agent is making tool calls
    if (output?.messages?.[0]?.tool_calls?.length > 0) {
      const toolCall = output.messages[0].tool_calls[0];
      const toolName = toolCall.name as string;
      
      if (toolName in toolInfo) {
        return {
          ...toolInfo[toolName as ToolName],
          currentTool: toolName
        };
      }
    }
    
    // Check if agent has final response (no tool calls)
    if (output?.messages?.[0]?.content && !output?.messages?.[0]?.tool_calls?.length) {
      return toolInfo.agent_final;
    }
    
    // Default agent thinking
    return toolInfo.agent_thinking;
  }
  
  if (step === 'tools') {
    return {
      icon: '⚙️',
      label: 'Processing Tools',
      description: 'Tools are executing...'
    };
  }
  
  // Fallback
  return {
    icon: '🔄',
    label: 'Processing',
    description: 'Working on your request...'
  };
};

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, isConnected, connectionError, onReconnect }) => {
  const statusInfo = getStatusInfo(status.step, status.output);
  
  // Don't show status if it's the final response
  if (statusInfo.label === 'Complete') {
    return null;
  }

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

        {/* Current Status */}
        <div className="flex items-center space-x-4">
          {/* Animated Icon */}
          <motion.div
            className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: statusInfo.label === 'AI Processing' ? 360 : 0
            }}
            transition={{ 
              scale: { duration: 2, repeat: Infinity },
              rotate: { duration: 2, repeat: Infinity, ease: "linear" }
            }}
          >
            {statusInfo.icon}
          </motion.div>

          {/* Status Text */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">
              {statusInfo.label}
            </h3>
            <p className="text-sm text-gray-600">
              {statusInfo.description}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Additional Info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={status.message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <p className="text-xs text-gray-500">
              {status.message || 'Processing your legal query...'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default StatusDisplay;
