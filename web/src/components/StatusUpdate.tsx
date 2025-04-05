import React from 'react';

interface StatusUpdateProps {
  status: {
    step: string;
    message: string;
    intent?: string;
  };
}

const StatusUpdate: React.FC<StatusUpdateProps> = ({ status }) => {
  // Function to get step label based on step name
  const getStepLabel = (step: string): string => {
    switch (step) {
      case 'start': return 'Starting';
      case 'intent': return 'Intent Classification';
      case 'search': return 'Search Query Generation';
      case 'embedding': return 'Vector Search';
      case 'filtering': return 'Filtering Results';
      case 'ranking': return 'Ranking Results';
      case 'summary': return 'Generating Answer';
      case 'finalizing': return 'Finalizing';
      case 'complete': return 'Complete';
      default: return step;
    }
  };

  // Function to get step number for progress tracking
  const getStepNumber = (step: string): number => {
    const steps = ['start', 'intent', 'search', 'embedding', 'filtering', 'ranking', 'summary', 'finalizing', 'complete'];
    return steps.indexOf(step) + 1;
  };

  return (
    <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-2">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ 
              width: `${(getStepNumber(status.step) / 9) * 100}%` 
            }}
          ></div>
        </div>
        <span className="text-xs font-medium text-gray-700">
          {getStepNumber(status.step)}/9
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">
          {getStepLabel(status.step)}
        </span>
        <span className="text-xs text-gray-500">
          {status.message}
        </span>
      </div>
    </div>
  );
};

export default StatusUpdate; 