import { useToast } from '../components/ui/ToastComp';

const useClipboard = () => {
  const toast = useToast();

  const copyToClipboard = (text: string) => {
    if (!text) return;
    
    navigator.clipboard.writeText(text);
    toast({ type: 'success', message: 'Copied to clipboard' });
  };

  return { copyToClipboard };
};

export default useClipboard;
