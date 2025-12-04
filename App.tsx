// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, BrowserRouter as Router } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, MessageSquare, Database, Zap, Bell, ChevronDown, Activity, ArrowRight, Lock, Mail, LogOut, Settings as SettingsIcon, User, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dashboard } from './components/Dashboard';
import { Leads } from './components/Leads';
import { Chat } from './components/Chat';
import { ApifyImports } from './components/ApifyImports';
import { Automation } from './components/Automation';
import { UserManagement } from './components/UserManagement';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { SystemSettings } from './components/SystemSettings';
import { ApifyBlastPage } from './components/ApifyBlastPage';

import { Lead, ApifyLead, WahaChat, AutomationFlow, ActivityItem } from './types';
import { fetchLeads, fetchApifyLeads, fetchWahaChats, fetchAutomations, authActions, fetchChartData, checkWahaStatus, updateProfile, fetchRecentActivity, fetchContactProfilePic, updateLead } from './services/supabaseService';
import { wahaService } from './services/wahaService';
import { supabase } from './supabaseClient';
import { GridBackground } from './components/GridBackground';

type View = 'dashboard' | 'leads' | 'chat' | 'apify' | 'automation' | 'users' | 'profile' | 'settings';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, insira o email e a senha.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Try to sign in
      let { data, error: signInError } = await authActions.signIn(email, password);

      if (signInError) {
        // If sign in fails, try to sign up (fallback)
        console.log("Sign in failed, trying sign up...", signInError.message);
        const { data: signUpData, error: signUpError } = await authActions.signUp(email, password);

        if (signUpError) {
          setError(signInError.message || signUpError.message);
          setLoading(false);
          return;
        }

        // If signup successful, we might need to wait for email confirmation or it might auto-login depending on Supabase settings.
        // For this dev environment, assuming auto-confirm is OFF usually, but let's see.
        // If session is null, tell user to check email.
        if (!signUpData.session) {
          setError('Conta criada! Por favor, verifique seu email para confirmar.');
          setLoading(false);
          return;
        }
        data = signUpData;
      }

      if (data.session) {
        // Check profile status
        const profile = await authActions.getCurrentProfile();
        if (profile && profile.status === 'pending') {
          setError('Sua conta está aguardando aprovação de um administrador.');
          await authActions.signOut();
        } else if (profile && profile.status === 'blocked') {
          setError('Acesso negado.');
          await authActions.signOut();
        } else {
          onLogin();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#050505] flex items-center justify-center relative overflow-hidden selection:bg-zinc-800 text-zinc-200 font-sans">
      {/* Interactive Background */}
      <GridBackground />

      {/* Subtle Ambient Glow - Cool & Minimalist */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 blur-[100px] rounded-full pointer-events-none z-0 opacity-50"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        // @ts-ignore
        className="w-full max-w-[380px] relative z-10 px-6"
      >
        <div className="flex flex-col items-center mb-10">
          {/* Minimalist Logo */}


          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">{t('login.title')}</h1>
            <p className="text-sm text-zinc-500 font-medium">{t('login.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/5 border border-red-500/10 text-red-400 px-4 py-2.5 rounded-lg text-xs text-center font-medium"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-3">
            <div className="group">
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">{t('login.email_label')}</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder={t('login.email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 text-zinc-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 transition-all placeholder:text-zinc-700 text-sm hover:border-white/20"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">{t('login.password_label')}</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder={t('login.password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-black/20 border border-white/10 text-zinc-200 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-500/50 transition-all placeholder:text-zinc-700 text-sm hover:border-white/20"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-zinc-100 hover:bg-white text-black font-semibold py-2.5 rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-zinc-400 border-t-black rounded-full animate-spin"></div>
            ) : (
              <>
                {t('login.sign_in')} <ArrowRight size={16} className="opacity-50" />
              </>
            )}
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-[10px] text-zinc-600 bg-[#050505] uppercase tracking-widest font-medium">{t('login.or_continue_with')}</span>
            </div>
          </div>

          <button
            onClick={() => authActions.signInWithGoogle()}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-zinc-300 font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2.5 group text-sm"
          >
            <GoogleIcon />
            <span className="group-hover:text-zinc-100 transition-colors">{t('login.google_button')}</span>
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-zinc-600">
            {t('login.terms_prefix')} <a href="#" className="text-zinc-500 hover:text-zinc-300 underline decoration-zinc-700 underline-offset-2 transition-colors">{t('login.terms_link')}</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const App = () => {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedLeadForChat, setSelectedLeadForChat] = useState<string | undefined>(undefined);
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Apify Pagination State
  const [apifyPage, setApifyPage] = useState(0);
  const [apifyHasMore, setApifyHasMore] = useState(true);
  const [apifyLoadingMore, setApifyLoadingMore] = useState(false);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [apifyLeads, setApifyLeads] = useState<ApifyLead[]>([]);
  const [wahaChats, setWahaChats] = useState<WahaChat[]>([]);
  const [automations, setAutomations] = useState<AutomationFlow[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [wahaStatus, setWahaStatus] = useState<'WORKING' | 'FAILED' | 'STOPPED' | 'STARTING' | 'UNKNOWN'>('UNKNOWN');

  const [userAvatar, setUserAvatar] = useState<string>('https://ui-avatars.com/api/?name=User&background=random');
  const [userName, setUserName] = useState<string>('User');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('User');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const profile = await authActions.getCurrentProfile(session.user.id);
      if (profile) {
        setUserName(profile.full_name || session.user.email?.split('@')[0] || 'User');
        setUserAvatar(profile.avatar_url || session.user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}&background=random`);
        setUserRole(profile.role === 'admin' ? 'Administrador' : 'Membro da Equipe');
        setUserId(profile.id);
      }
    }
  };

  // Track if we've already initialized auth - prevents repeated checks
  const authInitialized = useRef(false);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkWahaStatus();
      setWahaStatus(status);
    };

    // Check immediately
    checkStatus();

    // Poll every 10 seconds
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {


      // Handle initial session check
      if (event === 'INITIAL_SESSION' && !authInitialized.current) {
        authInitialized.current = true;

        if (session) {
          setAuthChecking(true);

          // Set User Avatar & Name
          const avatarUrl = session.user.user_metadata.avatar_url || session.user.user_metadata.picture;
          const name = session.user.user_metadata.full_name || session.user.user_metadata.name;
          const email = session.user.email || '';

          if (avatarUrl) setUserAvatar(avatarUrl);
          else if (email) setUserAvatar(`https://ui-avatars.com/api/?name=${email}&background=random&color=fff`);

          if (name) setUserName(name);
          else if (email) setUserName(email.split('@')[0]);

          setUserEmail(email);
          setUserId(session.user.id);

          const profile = await authActions.getCurrentProfile(session.user.id);

          if (profile) {
            setUserRole(profile.role === 'admin' ? 'Administrador' : 'Membro da Equipe');

            // Sync Avatar URL to Profile if different
            if (avatarUrl && profile.avatar_url !== avatarUrl) {
              await updateProfile(profile.id, { avatar_url: avatarUrl });
            }

            if (profile.status === 'blocked') {
              await authActions.signOut();
              setIsAuthenticated(false);
              alert("Acesso Negado: Sua conta está bloqueada.");
            } else if (profile.status === 'pending') {
              setIsPending(true);
              setIsAuthenticated(false);
            } else {
              // Approved (or default active)
              setIsAuthenticated(true);
              setIsAdmin(profile.role === 'admin');
              setIsPending(false);
            }
          } else {
            console.error("Profile not found.");
            setIsPending(true);
            setIsAuthenticated(false);
          }
          setAuthChecking(false);
        } else {
          // No session on initial load
          setIsAuthenticated(false);
          setIsPending(false);
          setAuthChecking(false);
        }
        return;
      }

      // Handle sign out - immediately show login screen
      if (event === 'SIGNED_OUT') {
        console.log("User signed out - resetting state");
        authInitialized.current = false;
        setIsAuthenticated(false);
        setIsPending(false);
        setIsAdmin(false);
        setAuthChecking(false);
        setUserAvatar('https://ui-avatars.com/api/?name=User&background=random');
        setUserName('User');
        setUserEmail('');
        setUserRole('User');
        return;
      }

      // Handle any other event where session becomes null (e.g., session expired)
      if (!session && authInitialized.current) {
        console.log("Session lost - showing login");
        authInitialized.current = false;
        setIsAuthenticated(false);
        setIsPending(false);
        setIsAdmin(false);
        setAuthChecking(false);
        return;
      }
    });


    return () => {
      subscription.unsubscribe();
    };
  }, []);



  useEffect(() => {
    if (isAuthenticated) {
      const loadData = async () => {
        setIsLoadingData(true);
        try {
          const [fetchedLeads, fetchedApify, fetchedChats, fetchedAutos, fetchedChart, fetchedActivity, wahaLiveChats] = await Promise.all([
            fetchLeads(),
            fetchApifyLeads(0), // Fetch first page only
            fetchWahaChats(),
            fetchAutomations(),
            fetchChartData(),
            fetchRecentActivity(),
            wahaService.getChats('default').catch(() => [])
          ]);

          // --- Chat Merging Logic (Moved from Chat.tsx) ---
          const mappedSupabaseChats: WahaChat[] = (fetchedChats || []).map(c => ({
            id: c.chatID,
            name: c.push_name,
            push_name: c.push_name,
            timestamp: c.last_timestamp / 1000,
            unreadCount: c.unreadCount,
            isGroup: c.chatID.endsWith('@g.us'),
            lastMessage: {
              content: c.last_text,
              timestamp: c.last_timestamp / 1000
            },
            last_text: c.last_text,
            last_timestamp: c.last_timestamp,
            status: 'read',
            _persisted: true
          }));

          const chatMap = new Map<string, WahaChat>();
          mappedSupabaseChats.forEach(c => chatMap.set(c.id, c));
          (wahaLiveChats || []).forEach((c: any) => chatMap.set(c.id, { ...chatMap.get(c.id), ...c }));

          const mergedChats = Array.from(chatMap.values());

          // Enrich with Lead data
          const enrichedChats = mergedChats.map(chat => {
            const lead = (fetchedLeads || []).find(l => l.chat_id === chat.id || l.phone === chat.id.replace('@c.us', ''));
            return { ...chat, lead };
          });

          // Add Virtual Chats
          (fetchedLeads || []).forEach(lead => {
            const chatId = lead.chat_id || `${lead.phone}@c.us`;
            if (!chatMap.has(chatId)) {
              const alreadyExists = enrichedChats.some(c => c.id === chatId);
              if (!alreadyExists) {
                enrichedChats.push({
                  id: chatId,
                  name: lead.name,
                  push_name: lead.name,
                  timestamp: new Date(lead.last_interaction || Date.now()).getTime() / 1000,
                  unreadCount: 0,
                  isGroup: false,
                  lead: lead,
                  last_text: 'Iniciar uma conversa',
                  status: 'read'
                } as WahaChat);
              }
            }
          });

          enrichedChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          // ------------------------------------------------

          setLeads(fetchedLeads || []);
          if ((fetchedLeads || []).length < 50) {
            setHasMore(false);
          } else {
            setHasMore(true);
          }

          setApifyLeads(fetchedApify || []);
          if ((fetchedApify || []).length < 50) {
            setApifyHasMore(false);
          } else {
            setApifyHasMore(true);
          }

          setWahaChats(enrichedChats);
          setAutomations(fetchedAutos || []);
          setChartData(fetchedChart || []);
          setActivity(fetchedActivity || []);
        } catch (error) {
          console.error("Error loading data:", error);
        } finally {
          setIsLoadingData(false);
        }
      };
      loadData();

      // Realtime Subscription for Chats (Sidebar Updates)
      const chatSubscription = supabase
        .channel('public:whatsapp_waha_chats')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'whatsapp_waha_chats' },
          (payload) => {
            console.log('Chat update received:', payload);
            if (payload.eventType === 'INSERT') {
              setWahaChats(prev => {
                const newChat = payload.new as any;
                const mappedChat: WahaChat = {
                  id: newChat.id.toString(),
                  chatID: newChat.chat_jid,
                  push_name: newChat.name || newChat.chat_jid,
                  last_text: newChat.last_message || '',
                  last_from_me: newChat.last_message_from_me || false,
                  last_timestamp: newChat.last_message_at ? new Date(newChat.last_message_at).getTime() : Date.now(),
                  status: 'received', // Default status for new chat
                  unreadCount: newChat.unread_count || 0
                };
                return [mappedChat, ...prev];
              });
            } else if (payload.eventType === 'UPDATE') {
              setWahaChats(prev => prev.map(c => {
                if (c.id === payload.new.id.toString()) {
                  const updated = payload.new as any;
                  return {
                    ...c,
                    chatID: updated.chat_jid,
                    push_name: updated.name || c.push_name,
                    last_text: updated.last_message || c.last_text,
                    last_from_me: updated.last_message_from_me !== undefined ? updated.last_message_from_me : c.last_from_me,
                    last_timestamp: updated.last_message_at ? new Date(updated.last_message_at).getTime() : c.last_timestamp,
                    unreadCount: updated.unread_count !== undefined ? updated.unread_count : c.unreadCount
                  };
                }
                return c;
              }));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(chatSubscription);
      };
    }
  }, [isAuthenticated]);



  const handleOpenChat = (lead: Lead) => {
    setSelectedLeadForChat(lead.chat_id);
    setSelectedLead(lead);
    navigate('/chat');
  };

  const handleLeadUpdate = async (leadId: string, newStage: Stage) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
    try {
      await updateLead(leadId, { stage: newStage });
    } catch (error) {
      console.error("Failed to update lead stage", error);
    }
  };

  const loadMoreLeads = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const newLeads = await fetchLeads(nextPage);
    if (newLeads.length < 50) {
      setHasMore(false);
    }
    setLeads(prev => [...prev, ...newLeads]);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const loadMoreApifyLeads = async () => {
    if (apifyLoadingMore || !apifyHasMore) return;
    setApifyLoadingMore(true);
    const nextPage = apifyPage + 1;
    const newItems = await fetchApifyLeads(nextPage);
    if (newItems.length < 50) {
      setApifyHasMore(false);
    }
    setApifyLeads(prev => [...prev, ...newItems]);
    setApifyPage(nextPage);
    setApifyLoadingMore(false);
  };

  const SidebarItem = ({ path, icon: Icon, label }: any) => {
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    return (
      <button
        onClick={() => {
          navigate(path);
          setIsSidebarOpen(false);
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
        <Icon strokeWidth={1.5} size={20} className={`transition-transform duration-300 ${isActive ? 'text-zinc-100 scale-105' : 'group-hover:scale-105'}`} />
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="tracking-wide whitespace-nowrap overflow-hidden"
          >
            {label}
          </motion.span>
        )}
      </button>
    );
  };

  if (authChecking) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-zinc-100 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
        <div className="glass-panel p-10 rounded-2xl border border-white/5 shadow-2xl shadow-black/50 backdrop-blur-2xl max-w-md text-center relative z-10">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/5">
            <Lock strokeWidth={1.5} size={24} className="text-zinc-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mb-3 tracking-tight">{t('pending.title')}</h2>
          <p className="text-zinc-500 mb-8 text-sm leading-relaxed">{t('pending.message')}</p>
          <button
            onClick={() => authActions.signOut()}
            className="px-6 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-black font-medium transition-all text-sm"
          >
            {t('pending.sign_out_button')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/login" element={
          !isAuthenticated ? (
            <LoginScreen onLogin={() => setIsAuthenticated(true)} />
          ) : (
            <Navigate to="/" replace />
          )
        } />

        <Route path="/*" element={
          isAuthenticated ? (
            <motion.div
              key="app"
              initial={{ opacity: 0, filter: 'blur(20px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-[#050505] h-screen w-screen flex text-zinc-200 font-sans selection:bg-zinc-800 overflow-hidden relative"
            >
              <GridBackground />

              {/* Mobile Sidebar Overlay */}
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                  />
                )}
              </AnimatePresence>

              {/* Minimalist Dark Sidebar */}
              <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 256 }}
                className={`
                fixed md:static inset-y-0 left-0 z-40 h-full flex flex-col bg-black/95 md:bg-black/40 border-r border-white/5 backdrop-blur-xl transition-all duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
              `}>
                <div className={`p-6 ${isCollapsed ? 'px-2' : ''}`}>
                  {/* Premium Logo Area */}
                  <div className={`flex items-center mb-12 ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between pl-2'}`}>
                    <div className="flex flex-col items-center">
                      {isCollapsed ? (
                        <span className="font-bold tracking-tighter text-zinc-100 text-xl leading-none">F</span>
                      ) : (
                        <>
                          <span className="font-bold tracking-tighter text-zinc-100 text-lg leading-none">FERRER</span>
                          <span className="text-[10px] text-zinc-500 font-medium tracking-[0.3em] uppercase mt-1">Studio</span>
                        </>
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
                      onClick={() => setIsSidebarOpen(false)}
                      className="md:hidden p-1 text-zinc-500 hover:text-zinc-300"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <nav className="space-y-1">
                    <SidebarItem path="/dashboard" icon={LayoutDashboard} label={t('sidebar.dashboard')} />
                    <SidebarItem path="/leads" icon={Users} label={t('sidebar.leads')} />
                    <SidebarItem path="/chat" icon={MessageSquare} label={t('sidebar.chat')} />
                    <SidebarItem path="/apify" icon={Database} label={t('sidebar.imports')} />
                    <SidebarItem path="/automation" icon={Zap} label={t('sidebar.automation')} />

                    {isAdmin && (
                      <>
                        <div className="my-8 border-t border-white/5 mx-4"></div>
                        <SidebarItem path="/users" icon={Users} label={t('sidebar.team')} />
                        <SidebarItem path="/system-settings" icon={SettingsIcon} label={t('sidebar.system_settings') || 'Configurações do Sistema'} />
                      </>
                    )}
                  </nav>
                </div>

                <div className={`mt-auto p-6 ${isCollapsed ? 'px-2' : ''}`}>
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className={`w-full flex items-center gap-3 py-1 rounded-full hover:bg-white/5 transition-all duration-200 group border border-transparent hover:border-white/5 ${isCollapsed ? 'justify-center px-0' : 'pl-2 pr-1'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 ring-1 ring-white/10 group-hover:ring-white/20 transition-all overflow-hidden shadow-lg flex-shrink-0">
                        <img src={userAvatar} alt="User" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {!isCollapsed && (
                        <>
                          <div className="flex flex-col items-start mr-auto overflow-hidden">
                            <span className="text-xs font-medium text-zinc-200 leading-none mb-0.5 truncate w-full text-left">{userName}</span>
                            <span className="text-[9px] text-zinc-600 font-medium leading-none mt-0.5 uppercase tracking-wider">{userRole}</span>
                          </div>
                          <ChevronDown size={12} className={`text-zinc-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                        </>
                      )}
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
                                onClick={() => authActions.signOut()}
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

              {/* Main Content */}
              <main className="flex-1 flex flex-col min-w-0 h-full relative z-10">

                {/* Minimalist Header */}
                <header className="h-14 border-b border-white/5 sticky top-0 z-10 px-4 md:px-6 flex items-center justify-between backdrop-blur-md bg-black/40 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="md:hidden p-1 -ml-1 text-zinc-400 hover:text-zinc-100"
                    >
                      <Menu size={20} />
                    </button>
                    <div className="flex items-center text-xs font-medium tracking-wide">
                      <span className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-default hidden md:inline">{t('header.overview')}</span>
                      <span className="mx-2 text-zinc-700 hidden md:inline">/</span>
                      <span className="text-zinc-200 capitalize">{location.pathname === '/' ? 'dashboard' : location.pathname.replace('/', '')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="h-4 w-px bg-white/5"></div>

                    <button className="relative group p-1">
                      <Bell strokeWidth={1.5} size={16} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      <span className="absolute top-1 right-0.5 w-1.5 h-1.5 bg-bronze-500 rounded-full border-2 border-black"></span>
                    </button>


                  </div>
                </header>

                {/* Page Content Scrollable Area */}
                <div className={`flex-1 ${location.pathname === '/chat' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
                  <div className="h-full">
                    <AnimatePresence mode="wait">
                      <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.99 }}
                            className="h-full"
                          >
                            <Dashboard leads={leads} chartData={chartData} activity={activity} isLoading={isLoadingData} />
                          </motion.div>
                        } />
                        <Route path="/leads" element={
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.99 }}
                            className="h-full"
                          >
                            <Leads leads={leads} onOpenChat={handleOpenChat} onLeadUpdate={handleLeadUpdate} isAdmin={isAdmin} isLoading={isLoadingData} onLoadMore={loadMoreLeads} hasMore={hasMore} loadingMore={loadingMore} />
                          </motion.div>
                        } />
                        <Route path="/chat" element={
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.99 }}
                            className="h-full"
                          >
                            <Chat
                              chats={wahaChats}
                              leads={leads}
                              apifyLeads={apifyLeads}
                              initialChatId={selectedLeadForChat}
                              initialLead={selectedLead}
                              key={selectedLeadForChat} // Force remount if selected lead changes? Maybe better to handle inside Chat
                              onConnectClick={() => setIsQRModalOpen(true)}
                              isAdmin={isAdmin}
                              profilePics={{}} // Handled internally by Chat
                              isLoading={isLoadingData}
                              onNavigate={(path) => navigate(path)}
                            />
                          </motion.div>
                        } />
                        <Route path="/apify" element={
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.99 }}
                            className="h-full"
                          >
                            <ApifyImports
                              items={apifyLeads}
                              onOpenChat={handleOpenChat}
                              onImport={async () => {
                                // Refresh logic - reset to first page
                                const fresh = await fetchApifyLeads(0);
                                setApifyLeads(fresh);
                                setApifyPage(0);
                                setApifyHasMore(fresh.length === 50);
                              }}
                              onLoadMore={loadMoreApifyLeads}
                              hasMore={apifyHasMore}
                              loadingMore={apifyLoadingMore}
                            />
                          </motion.div>
                        } />
                        <Route path="/automation" element={
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.99 }}
                            className="h-full"
                          >
                            <Automation flows={automations} isAdmin={isAdmin} isLoading={isLoadingData} />
                          </motion.div>
                        } />
                        <Route path="/automation/apifyblast" element={
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.99 }}
                            className="h-full"
                          >
                            <ApifyBlastPage />
                          </motion.div>
                        } />
                        <Route path="/users" element={
                          isAdmin ? (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.99 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.99 }}
                              className="h-full"
                            >
                              <UserManagement />
                            </motion.div>
                          ) : <Navigate to="/" />
                        } />
                        <Route path="/profile" element={
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.99 }}
                            className="h-full"
                          >
                            <Profile
                              user={{
                                name: userName,
                                email: userEmail,
                                avatar: userAvatar,
                                role: userRole
                              }}
                              leads={leads}
                              activity={activity}
                            />
                          </motion.div>
                        } />
                        <Route path="/settings" element={
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.99 }}
                            className="h-full"
                          >
                            <Settings
                              user={{
                                id: userId,
                                name: userName,
                                email: userEmail,
                                avatar: userAvatar
                              }}
                              wahaStatus={wahaStatus}
                              onUpdateProfile={checkUser}
                            />
                          </motion.div>
                        } />
                        <Route path="/system-settings" element={
                          isAdmin ? (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.99 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.99 }}
                              className="h-full"
                            >
                              <SystemSettings isAdmin={isAdmin} wahaStatus={wahaStatus} />
                            </motion.div>
                          ) : <Navigate to="/" />
                        } />
                        <Route path="*" element={<Navigate to="/" />} />
                      </Routes>
                    </AnimatePresence>

                  </div>
                </div>
              </main>
            </motion.div >
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </AnimatePresence>
  );
};

export default App;
