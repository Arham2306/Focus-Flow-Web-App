import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

interface EditProfileViewProps {
  onBack: () => void;
}

const EditProfileView: React.FC<EditProfileViewProps> = ({ onBack }) => {
  const { currentUser, updateUserProfile, userMetadata, updateUserMetadata } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(userMetadata.bio || '');
  const [role, setRole] = useState(userMetadata.role || '');
  const [dailyGoal, setDailyGoal] = useState(userMetadata.dailyGoal || 5);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await updateUserProfile(displayName, currentUser?.photoURL || '');
      updateUserMetadata({ bio, role, dailyGoal: Number(dailyGoal) });
      onBack(); // Return to profile after save
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 pb-32 sm:pb-40 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Edit Profile</h1>
          </div>
        </header>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="Preview"
                    className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl object-cover relative z-10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl relative z-10">
                    <span className="text-primary text-4xl font-black">
                      {(displayName[0] || 'U').toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Profile Picture</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl text-sm font-bold placeholder-slate-400 focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Professional Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Product Designer, Developer"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl text-sm font-bold placeholder-slate-400 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Bio / Tagline</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a bit about your flow..."
                  rows={3}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl text-sm font-bold placeholder-slate-400 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Daily Task Goal</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">flag</span>
                  <input
                    type="number"
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(Number(e.target.value))}
                    min="1"
                    className="w-full pl-14 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl text-sm font-bold placeholder-slate-400 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl">
                <p className="text-xs font-bold text-red-500 flex items-center gap-2">
                  <span className="material-symbols-outlined !text-[18px]">error</span>
                  {error}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`flex-1 py-4 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSaving ? (
                  <span className="material-symbols-outlined animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined">save</span>
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfileView;
