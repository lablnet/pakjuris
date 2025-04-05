import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusDisplayProps {
  status: {
    step: string;
    message: string;
    intent?: string;
  };
}

const steps = {
  start: { icon: '🚀', label: 'Starting' },
  intent: { icon: '🧠', label: 'Analyzing' },
  search: { icon: '🔍', label: 'Searching' },
  embedding: { icon: '📊', label: 'Processing' },
  filtering: { icon: '🔎', label: 'Filtering' },
  ranking: { icon: '📈', label: 'Ranking' },
  summary: { icon: '✍️', label: 'Generating' },
  finalizing: { icon: '✨', label: 'Finalizing' },
  complete: { icon: '✅', label: 'Complete' }
};

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status }) => {
  const currentStepIndex = Object.keys(steps).indexOf(status.step);
  const totalSteps = Object.keys(steps).length;
  const stepsArray = Object.entries(steps);

  // For mobile, we only show current step, previous step, and next step
  const getVisibleSteps = () => {
    if (currentStepIndex === 0) {
      return stepsArray.slice(0, 3); // First, second, third
    } else if (currentStepIndex === stepsArray.length - 1) {
      return stepsArray.slice(-3); // Last three
    } else {
      return [
        stepsArray[currentStepIndex - 1],
        stepsArray[currentStepIndex],
        stepsArray[currentStepIndex + 1]
      ];
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 shadow-lg border border-blue-100"
    >
      <div className="space-y-4">
        {/* Progress Steps - Mobile (3 steps max) */}
        <div className="flex justify-between items-center md:hidden">
          {getVisibleSteps().map(([step, { icon, label }], index, visibleSteps) => {
            const actualIndex = stepsArray.findIndex(([s]) => s === step);
            const isCurrentStep = step === status.step;
            
            return (
              <div key={step} className="flex flex-col items-center relative">
                {/* Progress line to previous step */}
                {index > 0 && (
                  <div className="absolute w-full h-0.5 bg-gray-200 left-0 top-4 -ml-full z-0">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: actualIndex <= currentStepIndex ? '100%' : '0%' }}
                    ></div>
                  </div>
                )}
                
                <motion.div
                  className="flex flex-col items-center z-10"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: isCurrentStep ? 1.1 : actualIndex < currentStepIndex ? 0.9 : 0.85,
                    opacity: isCurrentStep ? 1 : actualIndex < currentStepIndex ? 0.8 : 0.6
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-lg
                    ${isCurrentStep
                      ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                      : actualIndex <= currentStepIndex
                        ? 'bg-blue-400 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {icon}
                  </div>
                  <span className={`
                    text-xs mt-1 
                    ${isCurrentStep ? 'font-medium text-blue-700' : 'text-gray-600'}
                  `}>
                    {label}
                  </span>
                </motion.div>
              </div>
            );
          })}
        </div>
        
        {/* Progress Steps - Desktop (all steps) */}
        <div className="hidden md:flex justify-between items-center">
          {stepsArray.map(([step, { icon, label }], index) => (
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
                ${index === currentStepIndex
                  ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                  : index < currentStepIndex
                    ? 'bg-blue-400 text-white'
                    : 'bg-gray-200 text-gray-500'
                }
              `}>
                {icon}
              </div>
              <span className={`
                text-xs mt-1 
                ${index === currentStepIndex ? 'font-medium text-blue-700' : 'text-gray-600'}
              `}>
                {label}
              </span>
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

        {/* Current step indicator */}
        <div className="text-center">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-1">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
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