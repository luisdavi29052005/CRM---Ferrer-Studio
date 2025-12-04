import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    Database,
    Zap,
    Settings as SettingsIcon,
    ChevronRight,
    ChevronLeft,
    X,
    ChevronDown,
    User,
    LogOut
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isAdmin: boolean;
    user: {
        name: string;
        role: string;
        avatar: string;
    };
    onSignOut: () => void;
}

interface SidebarItemProps {
    path: string;
    icon: any;
    label: string;
    isCollapsed: boolean;
    onClose: () => void;
}

const SidebarItem = ({ path, icon: Icon, label, isCollapsed, onClose }: SidebarItemProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

    return (
        <button
            onClick={() => {
                navigate(path);
                onClose(); // Close mobile sidebar on navigation
            }}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-300 group relative ${isActive
                ? 'text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
            title={isCollapsed ? label : ''}
        >
            {isActive && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-zinc-100 rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.3)] ${isCollapsed ? 'h-4' : ''}`}></div>
            )}

            {/* Fixed width container for icon to prevent jitter */}
            <div className="min-w-[20px] flex items-center justify-center">
                <Icon strokeWidth={1.5} size={20} className={`transition-transform duration-300 ${isActive ? 'text-zinc-100 scale-105' : 'group-hover:scale-105'}`} />
            </div>

            <AnimatePresence>
                {!isCollapsed && (
                    <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }} // Faster text exit
                        className="tracking-wide whitespace-nowrap overflow-hidden"
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>
        </button>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    isAdmin,
    user,
    onSignOut
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Persist collapsed state in localStorage
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved ? JSON.parse(saved) : false;
    });

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
    }, [isCollapsed]);

    return (
        <>
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Minimalist Dark Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: isMobile ? 256 : (isCollapsed ? 80 : 256),
                    x: isMobile ? (isOpen ? 0 : '-100%') : 0
                }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }} // Custom bezier for natural feel
                className={`
        fixed md:static inset-y-0 left-0 z-40 h-full flex flex-col bg-black/95 md:bg-black/40 border-r border-white/5 backdrop-blur-xl
      `}>
                <div className={`p-6 ${isCollapsed && !isMobile ? 'px-2' : ''}`}>
                    {/* Premium Logo Area */}
                    <div className={`flex items-center mb-12 min-h-[40px] ${isCollapsed && !isMobile ? 'justify-center flex-col gap-4' : 'justify-between pl-2'}`}>
                        <div className="flex flex-col items-center overflow-hidden whitespace-nowrap">
                            {isCollapsed && !isMobile ? (
                                <span className="font-bold tracking-tighter text-zinc-100 text-xl leading-none">F</span>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col"
                                >
                                    <span className="font-bold tracking-tighter text-zinc-100 text-lg leading-none">FERRER</span>
                                    <span className="text-[10px] text-zinc-500 font-medium tracking-[0.3em] uppercase mt-1">Studio</span>
                                </motion.div>
                            )}
                        </div>

                        {/* Desktop Collapse Toggle */}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`hidden md:flex p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors ${isCollapsed ? 'mt-2' : ''}`}
                        >
                            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </button>

                        {/* Mobile Close */}
                        <button
                            onClick={onClose}
                            className="md:hidden p-1 text-zinc-500 hover:text-zinc-300"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="space-y-1">
                        <SidebarItem path="/dashboard" icon={LayoutDashboard} label={t('sidebar.dashboard')} isCollapsed={isCollapsed && !isMobile} onClose={onClose} />
                        <SidebarItem path="/leads" icon={Users} label={t('sidebar.leads')} isCollapsed={isCollapsed && !isMobile} onClose={onClose} />
                        <SidebarItem path="/chat" icon={MessageSquare} label={t('sidebar.chat')} isCollapsed={isCollapsed && !isMobile} onClose={onClose} />
                        <SidebarItem path="/apify" icon={Database} label={t('sidebar.imports')} isCollapsed={isCollapsed && !isMobile} onClose={onClose} />
                        <SidebarItem path="/automation" icon={Zap} label={t('sidebar.automation')} isCollapsed={isCollapsed && !isMobile} onClose={onClose} />

                        {isAdmin && (
                            <>
                                <div className="my-8 border-t border-white/5 mx-4"></div>
                                <SidebarItem path="/users" icon={Users} label={t('sidebar.team')} isCollapsed={isCollapsed && !isMobile} onClose={onClose} />
                                <SidebarItem path="/system-settings" icon={SettingsIcon} label={t('sidebar.system_settings') || 'Configurações do Sistema'} isCollapsed={isCollapsed && !isMobile} onClose={onClose} />
                            </>
                        )}
                    </nav>
                </div>

                <div className={`mt-auto p-6 ${isCollapsed && !isMobile ? 'px-2' : ''}`}>
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className={`w-full flex items-center gap-3 py-1 rounded-full hover:bg-white/5 transition-all duration-200 group border border-transparent hover:border-white/5 ${isCollapsed && !isMobile ? 'justify-center px-0' : 'pl-2 pr-1'}`}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 ring-1 ring-white/10 group-hover:ring-white/20 transition-all overflow-hidden shadow-lg flex-shrink-0">
                                <img src={user.avatar} alt="User" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <AnimatePresence>
                                {(!isCollapsed || isMobile) && (
                                    <motion.div
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="flex items-center flex-1 overflow-hidden whitespace-nowrap"
                                    >
                                        <div className="flex flex-col items-start mr-auto overflow-hidden">
                                            <span className="text-xs font-medium text-zinc-200 leading-none mb-0.5 truncate w-full text-left">{user.name}</span>
                                            <span className="text-[9px] text-zinc-600 font-medium leading-none mt-0.5 uppercase tracking-wider">{user.role}</span>
                                        </div>
                                        <ChevronDown size={12} className={`text-zinc-500 transition-transform duration-200 flex-shrink-0 ml-2 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>

                        {/* Profile Dropdown */}
                        <AnimatePresence>
                            {isProfileOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProfileOpen(false)}
                                    ></div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        className="absolute left-0 bottom-full mb-2 w-full bg-[#0B0B0B] border border-white/10 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-xl z-50 overflow-hidden"
                                    >
                                        <div className="p-1">
                                            <button
                                                onClick={() => {
                                                    navigate('/profile');
                                                    setIsProfileOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-lg transition-colors group">
                                                <User size={14} className="text-zinc-500 group-hover:text-zinc-300" />
                                                {t('profile_dropdown.view_profile')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigate('/settings');
                                                    setIsProfileOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-lg transition-colors group">
                                                <SettingsIcon size={14} className="text-zinc-500 group-hover:text-zinc-300" />
                                                {t('profile_dropdown.account_settings')}
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => {
                                                        navigate('/users');
                                                        setIsProfileOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-lg transition-colors group"
                                                >
                                                    <Users size={14} className="text-zinc-500 group-hover:text-zinc-300" />
                                                    {t('profile_dropdown.team_management')}
                                                </button>
                                            )}
                                        </div>
                                        <div className="h-px bg-white/5 mx-1 my-1"></div>
                                        <div className="p-1">
                                            <button
                                                onClick={onSignOut}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors group"
                                            >
                                                <LogOut size={14} className="text-red-500/70 group-hover:text-red-400" />
                                                {t('profile_dropdown.sign_out')}
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.aside>
        </>
    );
};
