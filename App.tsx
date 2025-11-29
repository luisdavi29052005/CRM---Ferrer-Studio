import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, MessageSquare, Database, Zap, Bell, ChevronDown, Activity, ArrowRight, Lock, Mail, LogOut, Settings, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dashboard } from './components/Dashboard';
import { Leads } from './components/Leads';
import { Chat } from './components/Chat';
import { ApifyImports } from './components/ApifyImports';
import { Automation } from './components/Automation';
import { UserManagement } from './components/UserManagement';
import { Lead, ApifyLead, WahaChat, AutomationFlow, ActivityItem } from './types';
import { fetchLeads, fetchApifyLeads, fetchWahaChats, fetchAutomations, authActions, fetchChartData, checkWahaStatus, updateProfile, fetchRecentActivity } from './services/supabaseService';
import { supabase } from './supabaseClient';
import { GridBackground } from './components/GridBackground';

type View = 'dashboard' | 'leads' | 'chat' | 'apify' | 'automation' | 'users';

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
      setError('Please enter both email and password.');
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
          setError('Account created! Please check your email to confirm.');
          setLoading(false);
          return;
        }
        data = signUpData;
      }

      if (data.session) {
        // Check profile status
        const profile = await authActions.getCurrentProfile();
        if (profile && profile.status === 'pending') {
          setError('Your account is pending approval by an admin.');
          await authActions.signOut();
        } else if (profile && profile.status === 'blocked') {
          setError('Access denied.');
          await authActions.signOut();
        } else {
          onLogin();
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
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
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedLeadForChat, setSelectedLeadForChat] = useState<string | undefined>(undefined);
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>(undefined);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [apifyLeads, setApifyLeads] = useState<ApifyLead[]>([]);
  const [wahaChats, setWahaChats] = useState<WahaChat[]>([]);
  const [automations, setAutomations] = useState<AutomationFlow[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const [wahaStatus, setWahaStatus] = useState<'WORKING' | 'FAILED' | 'STOPPED' | 'STARTING' | 'UNKNOWN'>('UNKNOWN');

  const [userAvatar, setUserAvatar] = useState<string>('https://ui-avatars.com/api/?name=User&background=random');
  const [userName, setUserName] = useState<string>('User');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('User');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
      console.log("Auth event:", event, "Has session:", !!session);

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

          const profile = await authActions.getCurrentProfile(session.user.id);

          if (profile) {
            setUserRole(profile.role === 'admin' ? 'Administrator' : 'Team Member');

            // Sync Avatar URL to Profile if different
            if (avatarUrl && profile.avatar_url !== avatarUrl) {
              await updateProfile(profile.id, { avatar_url: avatarUrl });
            }

            if (profile.status === 'blocked') {
              await authActions.signOut();
              setIsAuthenticated(false);
              alert("Access Denied: Your account is blocked.");
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
        const [fetchedLeads, fetchedApify, fetchedChats, fetchedAutos, fetchedChart, fetchedActivity] = await Promise.all([
          fetchLeads(),
          fetchApifyLeads(),
          fetchWahaChats(),
          fetchAutomations(),
          fetchChartData(),
          fetchRecentActivity()
        ]);
        setLeads(fetchedLeads);
        setApifyLeads(fetchedApify);
        setWahaChats(fetchedChats);
        setAutomations(fetchedAutos);
        setChartData(fetchedChart || []);
        setActivity(fetchedActivity);
      };
      loadData();
    }
  }, [isAuthenticated]);

  const handleOpenChat = (lead: Lead) => {
    setSelectedLeadForChat(lead.chat_id);
    setSelectedLead(lead);
    setActiveView('chat');
  };

  const SidebarItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-300 group relative ${activeView === view
        ? 'text-zinc-100'
        : 'text-zinc-500 hover:text-zinc-300'
        }`}
    >
      {activeView === view && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-zinc-100 rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
      )}
      <Icon strokeWidth={1.5} size={18} className={`transition-transform duration-300 ${activeView === view ? 'text-zinc-100 scale-105' : 'group-hover:scale-105'}`} />
      <span className="tracking-wide">{label}</span>
    </button>
  );

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
    <>
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <LoginScreen key="login" onLogin={() => setIsAuthenticated(true)} />
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, filter: 'blur(20px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-[#050505] h-screen w-screen flex text-zinc-200 font-sans selection:bg-zinc-800 overflow-hidden relative"
          >
            <GridBackground />

            {/* Minimalist Dark Sidebar */}
            <aside className="w-64 h-full flex flex-col z-20 bg-black/40 border-r border-white/5 relative backdrop-blur-xl">
              <div className="p-6">
                {/* Premium Logo Area */}
                <div className="flex items-center gap-3 mb-12 pl-2">
                  <div className="flex flex-col">
                    <span className="font-bold tracking-tighter text-zinc-100 text-lg leading-none">FERRER</span>
                    <span className="text-[10px] text-zinc-500 font-medium tracking-[0.3em] uppercase mt-1">Studio</span>
                  </div>
                </div>

                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveView('dashboard')}
                    className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-300 group relative ${activeView === 'dashboard'
                      ? 'text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                  >
                    {activeView === 'dashboard' && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-zinc-100 rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
                    )}
                    <LayoutDashboard strokeWidth={1.5} size={18} className={`transition-transform duration-300 ${activeView === 'dashboard' ? 'text-zinc-100 scale-105' : 'group-hover:scale-105'}`} />
                    <span className="tracking-wide">{t('sidebar.dashboard')}</span>
                  </button>
                  <button
                    onClick={() => setActiveView('leads')}
                    className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-300 group relative ${activeView === 'leads'
                      ? 'text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                  >
                    {activeView === 'leads' && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-zinc-100 rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
                    )}
                    <Users strokeWidth={1.5} size={18} className={`transition-transform duration-300 ${activeView === 'leads' ? 'text-zinc-100 scale-105' : 'group-hover:scale-105'}`} />
                    <span className="tracking-wide">{t('sidebar.leads')}</span>
                  </button>
                  <button
                    onClick={() => setActiveView('chat')}
                    className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-300 group relative ${activeView === 'chat'
                      ? 'text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                  >
                    {activeView === 'chat' && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-zinc-100 rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
                    )}
                    <MessageSquare strokeWidth={1.5} size={18} className={`transition-transform duration-300 ${activeView === 'chat' ? 'text-zinc-100 scale-105' : 'group-hover:scale-105'}`} />
                    <span className="tracking-wide">{t('sidebar.chat')}</span>
                  </button>
                  <button
                    onClick={() => setActiveView('apify')}
                    className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-300 group relative ${activeView === 'apify'
                      ? 'text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                  >
                    {activeView === 'apify' && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-zinc-100 rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
                    )}
                    <Database strokeWidth={1.5} size={18} className={`transition-transform duration-300 ${activeView === 'apify' ? 'text-zinc-100 scale-105' : 'group-hover:scale-105'}`} />
                    <span className="tracking-wide">{t('sidebar.imports')}</span>
                  </button>
                  <button
                    onClick={() => setActiveView('automation')}
                    className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-300 group relative ${activeView === 'automation'
                      ? 'text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                  >
                    {activeView === 'automation' && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-zinc-100 rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
                    )}
                    <Zap strokeWidth={1.5} size={18} className={`transition-transform duration-300 ${activeView === 'automation' ? 'text-zinc-100 scale-105' : 'group-hover:scale-105'}`} />
                    <span className="tracking-wide">{t('sidebar.automation')}</span>
                  </button>
                  {isAdmin && (
                    <>
                      <div className="my-8 border-t border-white/5 mx-4"></div>
                      <button
                        onClick={() => setActiveView('users')}
                        className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-300 group relative ${activeView === 'users'
                          ? 'text-zinc-100'
                          : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                      >
                        {activeView === 'users' && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-zinc-100 rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
                        )}
                        <Users strokeWidth={1.5} size={18} className={`transition-transform duration-300 ${activeView === 'users' ? 'text-zinc-100 scale-105' : 'group-hover:scale-105'}`} />
                        <span className="tracking-wide">{t('sidebar.team')}</span>
                      </button>
                    </>
                  )}
                </nav>
              </div>

              <div className="mt-auto p-6">
                <div className="px-4 py-4">
                  <div className="flex items-center gap-2 mb-4 opacity-40">
                    <Activity size={12} className="text-zinc-500" />
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">{t('sidebar.system_status')}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs group">
                      <span className="text-zinc-500 font-medium group-hover:text-zinc-300 transition-colors">{t('sidebar.waha_api')}</span>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/50 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        <span className="font-medium text-zinc-400 text-[10px] uppercase tracking-wide">{t('sidebar.online')}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs group">
                      <span className="text-zinc-500 font-medium group-hover:text-zinc-300 transition-colors">{t('sidebar.n8n_workflow')}</span>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        <span className="font-medium text-zinc-400 text-[10px] uppercase tracking-wide">{t('sidebar.active')}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs group">
                      <span className="text-zinc-500 font-medium group-hover:text-zinc-300 transition-colors">WhatsApp</span>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${wahaStatus === 'WORKING' ? 'bg-emerald-500/50' : 'bg-red-500/50'}`}></span>
                          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${wahaStatus === 'WORKING' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        </span>
                        <span className="font-medium text-zinc-400 text-[10px] uppercase tracking-wide">
                          {wahaStatus === 'WORKING' ? t('sidebar.online') : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-full relative z-10">

              {/* Minimalist Header */}
              <header className="h-14 border-b border-white/5 sticky top-0 z-10 px-6 flex items-center justify-between backdrop-blur-md bg-black/40 transition-all duration-300">
                <div className="flex items-center text-xs font-medium tracking-wide">
                  <span className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-default">{t('header.overview')}</span>
                  <span className="mx-2 text-zinc-700">/</span>
                  <span className="text-zinc-200 capitalize">{activeView}</span>
                </div>

                <div className="flex items-center gap-6">
                  {/* WAHA Status Indicator */}
                  {/* WAHA Status Indicator Removed */}

                  <div className="h-4 w-px bg-white/5"></div>

                  <button className="relative group p-1">
                    <Bell strokeWidth={1.5} size={16} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                    <span className="absolute top-1 right-0.5 w-1.5 h-1.5 bg-bronze-500 rounded-full border-2 border-black"></span>
                  </button>

                  {/* Premium Mini-Profile */}
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-white/5 transition-all duration-200 group border border-transparent hover:border-white/5"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 ring-1 ring-white/10 group-hover:ring-white/20 transition-all overflow-hidden shadow-lg">
                        <img src={userAvatar} alt="User" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex flex-col items-start mr-2">
                        <span className="text-xs font-medium text-zinc-200 leading-none mb-0.5">{userName}</span>
                        <span className="text-[10px] text-zinc-500 font-medium leading-none">{userEmail}</span>
                        <span className="text-[9px] text-zinc-600 font-medium leading-none mt-0.5 uppercase tracking-wider">{userRole}</span>
                      </div>
                      <ChevronDown size={12} className={`text-zinc-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
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
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute right-0 top-full mt-2 w-56 bg-[#0B0B0B] border border-white/10 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-xl z-50 overflow-hidden"
                          >
                            <div className="p-1">
                              <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-lg transition-colors group">
                                <User size={14} className="text-zinc-500 group-hover:text-zinc-300" />
                                {t('profile_dropdown.view_profile')}
                              </button>
                              <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-lg transition-colors group">
                                <Settings size={14} className="text-zinc-500 group-hover:text-zinc-300" />
                                {t('profile_dropdown.account_settings')}
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    setActiveView('users');
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
              </header>

              {/* Page Content Scrollable Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="h-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeView}
                      initial={{ opacity: 0, y: 10, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.99 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="h-full"
                    >
                      {activeView === 'dashboard' && <Dashboard leads={leads} chartData={chartData} activity={activity} />}
                      {activeView === 'leads' && <Leads leads={leads} onOpenChat={handleOpenChat} isAdmin={isAdmin} />}
                      {activeView === 'chat' && (
                        <Chat
                          chats={wahaChats}
                          leads={leads}
                          apifyLeads={apifyLeads}
                          initialChatId={selectedLeadForChat}
                          initialLead={selectedLead}
                          key={selectedLeadForChat}
                          onConnectClick={() => setIsQRModalOpen(true)}
                          isAdmin={isAdmin}
                        />
                      )}
                      {activeView === 'apify' && <ApifyImports
                        items={apifyLeads}
                        onOpenChat={handleOpenChat}
                        onImport={async () => {
                          const refreshedData = await fetchApifyLeads();
                          setApifyLeads(refreshedData);
                        }}
                      />}
                      {activeView === 'automation' && <Automation flows={automations} isAdmin={isAdmin} />}
                      {activeView === 'users' && isAdmin && <UserManagement />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
};

export default App;
