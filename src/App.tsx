import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, getAccessToken } from './lib/firebase';
import AdminPortal from './components/AdminPortal';
import DoctorPortal from './components/DoctorPortal';
import PatientPortal from './components/PatientPortal';
import NotificationCenter from './components/NotificationCenter';
import { 
  HeartPulse, 
  User as UserIcon, 
  Settings, 
  ShieldCheck, 
  Calendar, 
  Bell, 
  LogOut, 
  Stethoscope, 
  Sparkles 
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [calendarSyncStatus, setCalendarSyncStatus] = useState<string>('checking');

  useEffect(() => {
    const unsubscribe = initAuth(
      async (loggedInUser, token) => {
        setUser(loggedInUser);
        setNeedsAuth(false);
        setLoading(false);
        checkCalendarToken();
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const checkCalendarToken = async () => {
    const token = await getAccessToken();
    if (token) {
      setCalendarSyncStatus('synced');
    } else {
      setCalendarSyncStatus('disabled');
    }
  };

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        setCalendarSyncStatus('synced');
      }
    } catch (err) {
      console.error('Google Sign-in failed:', err);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      setUser(null);
      setNeedsAuth(true);
      setCalendarSyncStatus('disabled');
    }
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/70 flex flex-col items-center justify-center space-y-4 p-4">
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-xl max-w-sm w-full flex flex-col items-center text-center space-y-4 animate-fade-in">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full animate-pulse">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-gray-950 text-base">Securing Clinic Gateway</h3>
            <p className="text-xs text-gray-400 mt-1 font-sans">Connecting real-time storage & scheduling calendars...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col text-gray-800 font-sans antialiased">
      
      {/* Top Navigation Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100/80 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo and title */}
          <div className="flex items-center space-x-3 group">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/10 group-hover:scale-105 transition duration-300">
              <HeartPulse className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base sm:text-lg text-gray-950 tracking-tight leading-tight">Clinic Care</h1>
              <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">Enterprise Scheduler</p>
            </div>
          </div>

          {/* User Profile and Google Calendar connection indicator */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {user ? (
              <div className="flex items-center space-x-3 bg-white px-3.5 py-1.5 rounded-2xl border border-gray-100/90 shadow-xs">
                <img 
                  src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                  alt={user.displayName || 'User'} 
                  className="w-7 h-7 rounded-full border-2 border-blue-50"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-950 leading-tight">{user.displayName || 'Patient Account'}</p>
                  <p className="text-[10px] text-gray-400 font-mono truncate max-w-[140px] mt-0.5">{user.email}</p>
                </div>
                {calendarSyncStatus === 'synced' && (
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-100/80 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Google Calendar Live</span>
                  </span>
                )}
                <div className="h-4 w-[1px] bg-gray-100"></div>
                <button 
                  onClick={handleLogout}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Logout Profile"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* If Not Authenticated: Beautiful Entrance Splash Screen */}
        {needsAuth ? (
          <div className="relative py-12 my-6">
            {/* Soft decorative background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative max-w-md mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-gray-100/90 shadow-xl space-y-7 text-center animate-fade-in">
              <div className="mx-auto w-16 h-16 bg-blue-50/80 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                <HeartPulse className="w-9 h-9" />
              </div>

              <div className="space-y-3">
                <h2 className="font-display text-2xl font-bold text-gray-950 tracking-tight">Clinic Care Portal</h2>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                  An intelligent clinic scheduler powered by server-side Gemini AI symptom evaluation, Google Calendar sync, and transaction protection.
                </p>
              </div>

              {/* Unique feature checklist */}
              <div className="bg-slate-50/50 rounded-2xl p-4.5 text-left border border-slate-100 space-y-3">
                <div className="flex items-start space-x-2.5">
                  <div className="mt-0.5 p-0.5 bg-blue-50 text-blue-600 rounded">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900">Gemini AI Symptoms Pre-visit Analysis</h4>
                    <p className="text-[10px] text-gray-400">Receive precise urgency assessments and interview prompts for your doctor.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2.5">
                  <div className="mt-0.5 p-0.5 bg-emerald-50 text-emerald-600 rounded">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900">Google Calendar Attendance Sync</h4>
                    <p className="text-[10px] text-gray-400">Events are automatically mapped to your google calendar on real-time slots.</p>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                {/* Google sign in button */}
                <button 
                  onClick={handleLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm py-3.5 px-4 rounded-xl shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/15 transition-all flex items-center justify-center space-x-3 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 48 48">
                    <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" fill="#EA4335"></path>
                    <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" fill="#4285F4"></path>
                    <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" fill="#FBBC05"></path>
                    <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" fill="#34A853"></path>
                  </svg>
                  <span>Continue with Google Account</span>
                </button>
              </div>

              <div className="border-t border-gray-100 pt-4 text-[10px] text-gray-400 leading-relaxed">
                We respect your privacy. Google Calendar synchronization is initialized purely to invite you and your provider to the medical meeting slot.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Simulation Header and Role Switcher */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h2 className="font-display text-sm font-semibold text-gray-900 flex items-center justify-center md:justify-start space-x-1.5">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>Reviewer Simulation Panel</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">Simulate role perspectives instantly without changing logins to verify the medical workflow.</p>
              </div>

              {/* Role Select Buttons */}
              <div className="bg-slate-100/80 p-1 rounded-2xl flex items-center space-x-1 border border-slate-200/50">
                <button
                  onClick={() => setActiveRole('patient')}
                  className={`px-4.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center space-x-1.5 ${
                    activeRole === 'patient' 
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200/20' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Patient</span>
                </button>
                <button
                  onClick={() => setActiveRole('doctor')}
                  className={`px-4.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center space-x-1.5 ${
                    activeRole === 'doctor' 
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200/20' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Physician</span>
                </button>
                <button
                  onClick={() => setActiveRole('admin')}
                  className={`px-4.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center space-x-1.5 ${
                    activeRole === 'admin' 
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200/20' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Administrator</span>
                </button>
              </div>
            </div>

            {/* Active Portal Panel */}
            <div className="transition duration-300">
              {activeRole === 'admin' && (
                <AdminPortal onNotificationTriggered={triggerRefresh} />
              )}
              {activeRole === 'doctor' && (
                <DoctorPortal onNotificationTriggered={triggerRefresh} />
              )}
              {activeRole === 'patient' && (
                <PatientPortal user={user} onNotificationTriggered={triggerRefresh} />
              )}
            </div>

            {/* Notification Center Monitor Log Panel */}
            <div className="pt-4 border-t border-gray-100">
              <NotificationCenter key={refreshTrigger} />
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12 py-8 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-medium text-gray-500">Clinic Care Scheduler Gateway</p>
          <p>© 2026 Clinic Care Inc. Engineered with transactional Firestore consistency & Google Calendar sync pipelines.</p>
        </div>
      </footer>
    </div>
  );
}
