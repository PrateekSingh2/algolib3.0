import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { firestoreDB } from '@/lib/firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { Settings as SettingsIcon, Sun, Moon, Shield, User, ChevronRight, ArrowLeft, Trash2, Zap, CreditCard, BarChart2 } from 'lucide-react';
import { Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import AppFooter from '@/components/AppFooter';
import { toast } from 'sonner';

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { tab } = useParams();

  const currentTab = tab || 'general';
  const validTabs = ['general', 'vectoris', 'billing'];

  if (!validTabs.includes(currentTab)) {
    return <Navigate to="/settings/general" replace />;
  }

  // Settings states
  const [saveHistory, setSaveHistory] = useState(profile?.vectoris_save_history !== false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isUpdatingDeletion, setIsUpdatingDeletion] = useState(false);

  // Prevent scroll jumping/autoscroll from previous page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTab]);

  const handleToggleHistory = async () => {
    if (!user) return;
    const newValue = !saveHistory;
    setSaveHistory(newValue);
    setIsUpdating(true);
    try {
      const token = await user.getIdToken();
      await fetch('/.netlify/functions/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vectoris_save_history: newValue })
      });
      await refreshProfile();
    } catch (e) {
      setSaveHistory(!newValue); // revert
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearChatHistory = () => {
    if (!user) return;

    toast("Are you sure you want to delete all Vectoris AI chat history?", {
      description: "This cannot be undone.",
      action: {
        label: "Delete All",
        onClick: async () => {
          setIsDeleting(true);
          try {
            const q = collection(firestoreDB, "users", user.uid, "analysis_history");
            const snapshot = await getDocs(q);
            const batch = writeBatch(firestoreDB);
            snapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            localStorage.removeItem("vectoris_widget_chat");
            localStorage.removeItem("vectoris_widget_chatId");

            toast.success("Chat history deleted successfully.");
          } catch (e: any) {
            console.error(e);
            toast.error("Failed to delete chat history: " + (e.message || String(e)));
          } finally {
            setIsDeleting(false);
          }
        }
      },
      cancel: {
        label: "Cancel",
        onClick: () => { }
      }
    });
  };

  const handleDeleteRequest = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error("Please type DELETE to confirm.");
      return;
    }
    
    setIsUpdatingDeletion(true);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 2); // 2 days from now
      
      const res = await fetch('/.netlify/functions/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deletion_scheduled_at: scheduledDate.toISOString() })
      });
      
      if (!res.ok) throw new Error("Failed to schedule deletion");
      
      await refreshProfile();
      toast.success("Account deletion scheduled. You have 2 days to cancel.");
      setIsConfirmingDelete(false);
      setDeleteConfirmText('');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong.");
    } finally {
      setIsUpdatingDeletion(false);
    }
  };

  const handleCancelDeletion = async () => {
    setIsUpdatingDeletion(true);
    try {
      if (!user) return;
      const token = await user.getIdToken();
      
      const res = await fetch('/.netlify/functions/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deletion_scheduled_at: null })
      });
      
      if (!res.ok) throw new Error("Failed to cancel deletion");
      
      await refreshProfile();
      toast.success("Account deletion cancelled.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong.");
    } finally {
      setIsUpdatingDeletion(false);
    }
  };

  // Usage stats
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7);

  const dailyCount = profile?.vectoris_last_active_day?.startsWith(today) ? (profile?.vectoris_daily_count || 0) : 0;
  const monthlyCount = profile?.vectoris_last_active_month?.startsWith(thisMonth) ? (profile?.vectoris_monthly_count || 0) : 0;

  const dailyLimit = 21;
  const monthlyLimit = 630;
  const dailyPct = Math.min((dailyCount / dailyLimit) * 100, 100);
  const monthlyPct = Math.min((monthlyCount / monthlyLimit) * 100, 100);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 dark:bg-[#0c0c0e] text-slate-800 dark:text-zinc-100 font-sans pt-28 pb-20">
        <Helmet>
          <title>Settings | AlgoLib</title>
        </Helmet>

        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <button
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all duration-300 text-xs sm:text-sm font-bold shadow-sm cursor-pointer shrink-0 mb-6"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner shrink-0">
              <SettingsIcon size={24} className="text-indigo-500" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Settings</h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">Manage your account preferences, subscriptions, and AI settings.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Navigation Sidebar */}
            <div className="hidden md:flex flex-col gap-2 sticky top-28 h-fit">
              <Link to="/settings/general" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentTab === 'general' ? 'bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-indigo-600 dark:text-indigo-400 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-md' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-zinc-400'}`}>
                <User size={18} /> General
              </Link>
              <Link to="/settings/vectoris" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentTab === 'vectoris' ? 'bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-blue-500 dark:text-blue-400 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-md' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-zinc-400'}`}>
                <Zap size={18} /> Vectoris AI
              </Link>
              <Link to="/settings/billing" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentTab === 'billing' ? 'bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-purple-600 dark:text-purple-400 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-md' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-zinc-400'}`}>
                <CreditCard size={18} /> Usage & Billing
              </Link>
            </div>

            <div className="md:col-span-3 flex flex-col gap-8">

              {currentTab === 'general' && (
                <>
                  {/* Appearance */}
                  <section className="bg-white/60 dark:bg-white/[0.02] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.08] rounded-[2rem] p-6 sm:p-8 shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                      <Sun size={20} className="text-amber-500" /> Appearance
                    </h2>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50/80 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-zinc-200 text-[15px]">Theme Preference</h3>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 font-medium">Switch between light and dark mode.</p>
                      </div>
                      <button
                        onClick={toggleTheme}
                        className="px-5 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/20 transition-all shadow-sm shrink-0"
                      >
                        {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      </button>
                    </div>
                  </section>

                  {/* Account Link */}
                  <section className="bg-white/60 dark:bg-white/[0.02] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.08] rounded-[2rem] p-6 sm:p-8 shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                      <Shield size={20} className="text-emerald-500" /> Account
                    </h2>
                    <Link to="/edit-profile" className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50/80 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-colors gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-zinc-200 text-[15px] group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">Edit Profile</h3>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 font-medium">Update your display name, bio, and social links.</p>
                      </div>
                      <ChevronRight size={20} className="text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors shrink-0 hidden sm:block" />
                    </Link>
                  </section>

                  {/* Danger Zone */}
                  <section className="bg-white/60 dark:bg-white/[0.02] backdrop-blur-3xl border border-red-200 dark:border-red-500/20 rounded-[2rem] p-6 sm:p-8 shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                      <Trash2 size={20} className="text-red-500" /> Danger Zone
                    </h2>

                    <div className="flex flex-col p-5 bg-red-50/50 dark:bg-red-500/5 rounded-2xl border border-red-100 dark:border-red-500/10 gap-4">
                      {profile?.deletion_scheduled_at ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-red-600 dark:text-red-400 text-[15px]">Account Deletion Scheduled</h3>
                            <p className="text-sm text-red-500/80 dark:text-red-400/80 mt-1 font-medium">
                              Your account is scheduled to be deleted on {new Date(profile.deletion_scheduled_at).toLocaleDateString()}.
                            </p>
                          </div>
                          <button
                            onClick={handleCancelDeletion}
                            disabled={isUpdatingDeletion}
                            className="px-5 py-2.5 w-full sm:w-auto rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/20 text-sm font-bold shadow-sm transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
                          >
                            {isUpdatingDeletion ? "Cancelling..." : "Changed my mind"}
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-red-600 dark:text-red-400 text-[15px]">Delete Account</h3>
                              <p className="text-sm text-red-500/80 dark:text-red-400/80 mt-1 font-medium">Permanently delete your account and all associated data. This action cannot be undone.</p>
                            </div>
                            {!isConfirmingDelete && (
                              <button
                                onClick={() => setIsConfirmingDelete(true)}
                                className="px-5 py-2.5 w-full sm:w-auto rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold shadow-sm transition-colors whitespace-nowrap shrink-0"
                              >
                                Delete Account
                              </button>
                            )}
                          </div>
                          
                          {isConfirmingDelete && (
                            <div className="mt-2 pt-4 border-t border-red-200 dark:border-red-500/20 flex flex-col sm:flex-row gap-3 items-center">
                              <input 
                                type="text"
                                placeholder="Type DELETE to confirm"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-black/40 border border-red-200 dark:border-red-500/30 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm font-medium"
                              />
                              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                                <button
                                  onClick={() => {
                                    setIsConfirmingDelete(false);
                                    setDeleteConfirmText('');
                                  }}
                                  disabled={isUpdatingDeletion}
                                  className="px-4 py-2.5 w-full sm:w-auto rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-zinc-300 text-sm font-bold transition-colors disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleDeleteRequest}
                                  disabled={isUpdatingDeletion || deleteConfirmText !== 'DELETE'}
                                  className="px-5 py-2.5 w-full sm:w-auto rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-400 dark:disabled:bg-red-500/50 text-white text-sm font-bold shadow-sm transition-colors shrink-0"
                                >
                                  {isUpdatingDeletion ? "Processing..." : "Confirm Deletion"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}

              {currentTab === 'vectoris' && (
                <>
                  {/* Vectoris AI Preferences */}
                  <section className="bg-white/60 dark:bg-white/[0.02] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.08] rounded-[2rem] p-6 sm:p-8 shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                      <Zap size={20} className="text-blue-500 fill-blue-500/20" /> Vectoris AI Preferences
                    </h2>

                    <div className="flex flex-col gap-4">
                      {/* Save History Toggle */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50/80 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-zinc-200 text-[15px]">Save Chat History On Device</h3>
                          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 font-medium">Automatically save all your AI interactions to your account.</p>
                        </div>
                        <button
                          disabled={isUpdating}
                          onClick={handleToggleHistory}
                          className={`w-12 h-6 rounded-full transition-colors relative shrink-0 shadow-inner ${saveHistory ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-zinc-700'}`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${saveHistory ? 'translate-x-6' : 'translate-x-0.5'}`} style={{ transform: saveHistory ? 'translateX(26px)' : 'translateX(2px)' }} />
                        </button>
                      </div>

                      {/* Delete Chats Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50/80 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-zinc-200 text-[15px]">Delete Chat History</h3>
                          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 font-medium">Permanently clear all Vectoris AI conversation history.</p>
                        </div>
                        <button
                          disabled={isDeleting}
                          onClick={handleClearChatHistory}
                          className="px-5 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-bold shadow-sm transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
                        >
                          {isDeleting ? "Deleting..." : "Delete All Chats"}
                        </button>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {currentTab === 'billing' && (
                <>
                  {/* Subscription & Usage */}
                  <section className="bg-white/60 dark:bg-white/[0.02] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.08] rounded-[2rem] p-6 sm:p-8 shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                      <CreditCard size={20} className="text-purple-500" /> Subscription & Usage
                    </h2>

                    <div className="flex flex-col gap-4">
                      {/* Current Plan */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/10 dark:to-blue-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-[16px]">AlgoLib Free Tier</h3>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">Current</span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-zinc-400 font-medium">Basic access to compiler, tools, and limited Vectoris AI usage.</p>
                        </div>
                        <button
                          onClick={() => toast.info("Pro upgrades are coming soon!")}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white text-sm font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all whitespace-nowrap shrink-0"
                        >
                          Upgrade to Pro
                        </button>
                      </div>

                      {/* Token Usage Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <div className="p-5 bg-slate-50/80 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-300 font-semibold text-sm">
                              <BarChart2 size={16} className="text-blue-500" /> Daily AI Usage
                            </div>
                            <span className="text-xs font-bold text-slate-500 dark:text-zinc-500">{dailyCount} / {dailyLimit} chats</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${dailyPct}%` }} />
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-3 font-semibold text-right">Resets at midnight UTC</p>
                        </div>

                        <div className="p-5 bg-slate-50/80 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-300 font-semibold text-sm">
                              <BarChart2 size={16} className="text-purple-500" /> Monthly AI Usage
                            </div>
                            <span className="text-xs font-bold text-slate-500 dark:text-zinc-500">{monthlyCount} / {monthlyLimit} chats</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full transition-all duration-1000" style={{ width: `${monthlyPct}%` }} />
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-3 font-semibold text-right">Resets in 12 days</p>
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <AppFooter />
    </>
  );
};

export default Settings;
