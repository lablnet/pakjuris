import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'error' | 'success' | 'info' | 'alert';

interface ToastProps {
    id: number;
    type: ToastType;
    message: string;
    duration?: number;
}

const ToastContext = createContext<(options: Omit<ToastProps, 'id'>) => void>(() => { });

export const useToast = () => useContext(ToastContext);

const Toast: React.FC<ToastProps & { onClose: () => void }> = ({ type, message, onClose }) => {
    const toastStyles = {
        error: 'bg-red-500',
        success: 'bg-green-500',
        info: 'bg-blue-500',
        alert: 'bg-yellow-500',
    };

    const icons = {
        error: <AlertCircle size={20} />,
        success: <CheckCircle size={20} />,
        info: <Info size={20} />,
        alert: <AlertTriangle size={20} />,
    };

    return (
        <div className={`flex items-center p-2 rounded-lg ${toastStyles[type]} text-white w-[420px] shadow-lg`}>
            <div className="mr-2">{icons[type]}</div>
            <p className="flex-grow text-sm font-outfit">{message}</p>
            <button onClick={onClose} className="ml-2 text-white hover:text-gray-200" aria-label="Close">
                <X size={20} />
            </button>
        </div>
    );
};

export const ToastManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<ToastProps | null>(null);

    const addToast = useCallback(({ type, message, duration = 5000 }: Omit<ToastProps, 'id'>) => {
        const id = Date.now();
        // Clear any existing toast and set the new one
        setToast({ id, type, message, duration });
    }, []);

    const removeToast = useCallback(() => {
        setToast(null);
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => removeToast(), toast.duration);
            return () => clearTimeout(timer);
        }
    }, [toast, removeToast]);

    return (
        <ToastContext.Provider value={addToast}>
            {children}
            {ReactDOM.createPortal(
                <div className="fixed bottom-4 right-4">
                    {toast && (
                        <Toast key={toast.id} {...toast} onClose={removeToast} />
                    )}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};
