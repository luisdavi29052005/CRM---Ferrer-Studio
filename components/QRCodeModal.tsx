import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, RefreshCw, Smartphone, CheckCircle, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { checkWahaStatus, startWahaSession, getWahaScreenshot } from '../services/supabaseService';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [status, setStatus] = useState<'WORKING' | 'FAILED' | 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'UNKNOWN'>('UNKNOWN');
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            checkStatus();
            const interval = setInterval(checkStatus, 3000);
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && status !== 'WORKING') {
            // Poll for QR code every 2 seconds if not connected
            fetchQRCode();
            const interval = setInterval(fetchQRCode, 2000);
            return () => clearInterval(interval);
        }
    }, [isOpen, status]);

    const checkStatus = async () => {
        const currentStatus = await checkWahaStatus();
        setStatus(currentStatus);
        if (currentStatus === 'WORKING') {
            // Close modal after a delay if connected
            setTimeout(() => {
                // onClose(); // Optional: auto-close
            }, 2000);
        }
    };

    const fetchQRCode = async () => {
        const url = await getWahaScreenshot();
        if (url) {
            if (qrCodeUrl) URL.revokeObjectURL(qrCodeUrl);
            setQrCodeUrl(url);
            setError(null);
        }
    };

    const handleStartSession = async () => {
        setIsLoading(true);
        setError(null);
        await startWahaSession();
        // Wait a bit and check status
        setTimeout(() => {
            checkStatus();
            setIsLoading(false);
        }, 3000);
    };

    const handleLogout = async () => {
        if (!confirm('Are you sure you want to reset the session? This will disconnect WhatsApp.')) return;

        setIsLoading(true);
        try {
            await fetch('http://localhost:3000/api/sessions/default/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            // Wait and restart
            setTimeout(() => {
                handleStartSession();
            }, 1000);
        } catch (err) {
            console.error('Logout failed:', err);
            setError('Failed to logout');
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative w-full max-w-sm bg-[#0B0B0B] border border-white/5 rounded-2xl shadow-2xl overflow-hidden transform transition-all">
                {/* Minimalist Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                    <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-3 tracking-tight">
                        <Smartphone strokeWidth={1.5} size={20} className="text-zinc-400" />
                        {t('qrcode.title')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-full transition-all"
                    >
                        <X size={18} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col items-center justify-center min-h-[320px]">
                    {status === 'WORKING' ? (
                        <div className="text-center space-y-6 animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                <CheckCircle strokeWidth={1.5} size={40} className="text-emerald-500" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-zinc-100 mb-2">{t('qrcode.connected_title')}</h4>
                                <p className="text-zinc-500 text-sm">{t('qrcode.connected_msg')}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="mt-4 px-8 py-2.5 bg-zinc-100 hover:bg-white text-black font-medium rounded-lg transition-all text-sm"
                            >
                                {t('qrcode.close')}
                            </button>
                        </div>
                    ) : status === 'STARTING' || isLoading ? (
                        <div className="text-center space-y-6">
                            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                                <div className="absolute inset-0 border-t-2 border-zinc-500 rounded-full animate-spin"></div>
                                <Loader2 strokeWidth={1.5} size={32} className="text-zinc-500 animate-pulse" />
                            </div>
                            <div>
                                <h4 className="text-lg font-medium text-zinc-200 mb-2">{t('qrcode.initializing')}</h4>
                                <p className="text-zinc-500 text-xs uppercase tracking-widest">{t('qrcode.please_wait')}</p>
                            </div>
                        </div>
                    ) : (status === 'FAILED' || status === 'STOPPED' || status === 'UNKNOWN') && !qrCodeUrl ? (
                        <div className="text-center space-y-8">
                            <div className="w-20 h-20 bg-red-500/5 rounded-full flex items-center justify-center mx-auto border border-red-500/10">
                                <AlertCircle strokeWidth={1.5} size={40} className="text-red-500/50" />
                            </div>
                            <div>
                                <h4 className="text-lg font-medium text-zinc-200 mb-2">{t('qrcode.disconnected_title')}</h4>
                                <p className="text-zinc-500 text-sm max-w-[200px] mx-auto">{t('qrcode.disconnected_msg')}</p>
                            </div>
                            <div className="flex flex-col gap-3 w-full max-w-[240px] mx-auto">
                                <button
                                    onClick={handleStartSession}
                                    className="w-full px-4 py-3 bg-zinc-100 hover:bg-white text-black rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 font-medium text-sm"
                                >
                                    <RefreshCw size={16} />
                                    <RefreshCw size={16} />
                                    {t('qrcode.start_session')}
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-lg border border-red-500/10 hover:border-red-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 font-medium text-sm"
                                >
                                    <LogOut size={16} />
                                    {t('qrcode.reset_session')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center w-full flex flex-col items-center">
                            <div className="bg-white p-3 rounded-xl shadow-2xl shadow-black/50 mb-8 relative group">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-zinc-500/20 to-transparent rounded-2xl blur-sm opacity-50"></div>
                                {qrCodeUrl ? (
                                    <img src={qrCodeUrl} alt="WhatsApp QR Code" className="w-60 h-60 object-contain relative z-10" />
                                ) : (
                                    <div className="w-60 h-60 bg-zinc-50 flex items-center justify-center text-zinc-300 relative z-10">
                                        <Loader2 size={32} className="animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1 mb-8">
                                <h4 className="text-lg font-bold text-zinc-100">{t('qrcode.scan_instruction')}</h4>
                            </div>

                            <button
                                onClick={fetchQRCode}
                                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2 uppercase tracking-wider font-medium group"
                            >
                                <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                                Refresh Code
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
