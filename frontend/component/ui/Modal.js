// app/component/ui/Modal.js
import { useEffect } from 'react';

export default function Modal({ children, onClose }) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 backdrop-blur-sm">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="fixed z-9999 w-full max-w-6xl animate-in fade-in duration-300 isolate ">
                {children}
            </div>
        </div>
    );
}