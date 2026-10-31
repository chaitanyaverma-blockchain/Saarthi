import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Shield,
  BookOpen,
  Camera,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  LogOut,
  AlertTriangle,
  Languages,
  Sparkles,
  Target,
  Mail,
  GraduationCap,
  Calendar,
  Check,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Avatar from '../components/common/Avatar';
import Modal from '../components/common/Modal';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { cn } from '../utils/helpers';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateProfile, uploadProfilePicture, removeProfilePicture, changePassword, deleteAccount, logout } = useAuth();

  // Active Tab: 'profile' | 'preferences' | 'notifications' | 'security'
  const [activeTab, setActiveTab] = useState('profile');

  // Feedback states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    bio: '',
    university: '',
    major: '',
    year: '',
    preferred_language: 'English',
  });

  // Photo Upload State
  const fileInputRef = useRef(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Security / Password State
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: '',
  });

  // Account Deletion Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState({
    notifications_enabled: true,
    notif_study_reminders: true,
    notif_task_reminders: true,
    notif_deadline_alerts: true,
    notif_goal_progress: true,
    notif_quiz_summaries: true,
  });
  const [browserPermission, setBrowserPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );

  // Study Preferences State
  const [studyPrefs, setStudyPrefs] = useState({
    preferred_language: 'English',
    explanation_style: 'detailed',
    preferred_subjects: 'Computer Science, Mathematics, Machine Learning',
    daily_goal_minutes: 120,
  });

  // Initialize from user object
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        university: user.university || '',
        major: user.major || '',
        year: user.year || '',
        preferred_language: user.preferred_language || 'English',
      });

      setNotifPrefs({
        notifications_enabled: user.notifications_enabled ?? true,
        notif_study_reminders: user.notif_study_reminders ?? true,
        notif_task_reminders: user.notif_task_reminders ?? true,
        notif_deadline_alerts: user.notif_deadline_alerts ?? true,
        notif_goal_progress: user.notif_goal_progress ?? true,
        notif_quiz_summaries: user.notif_quiz_summaries ?? true,
      });

      setStudyPrefs({
        preferred_language: user.preferred_language || 'English',
        explanation_style: user.explanation_style || 'detailed',
        preferred_subjects: user.preferred_subjects || 'Computer Science, Mathematics, Machine Learning',
        daily_goal_minutes: user.daily_goal_minutes || 120,
      });
    }
  }, [user]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 6000);
  };

  // 1. Profile Picture Handling
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('File size exceeds 5 MB. Please select a smaller photo.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      showError('Unsupported format. Please select a JPG, PNG, or WEBP image.');
      return;
    }

    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!selectedImageFile) return;
    setIsUploadingPhoto(true);
    try {
      await uploadProfilePicture(selectedImageFile);
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      showSuccess('Profile picture updated successfully!');
    } catch (err) {
      showError(err.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;
    setIsUploadingPhoto(true);
    try {
      await removeProfilePicture();
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      showSuccess('Profile picture removed. Default avatar restored.');
    } catch (err) {
      showError(err.message || 'Failed to remove profile picture.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const cancelImagePreview = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 2. Profile Details Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(profileForm);
      showSuccess('Profile details saved successfully.');
    } catch (err) {
      showError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Notification Settings Save
  const handleToggleNotification = async (key) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    try {
      await api.patch('/accounts/preferences/notifications/', updated);
      showSuccess('Notification preference updated.');
    } catch (err) {
      setNotifPrefs(notifPrefs); // revert
      showError(err.message || 'Failed to save notification preference.');
    }
  };

  const handleRequestBrowserNotifications = async () => {
    if (!('Notification' in window)) {
      showError('Browser notifications are not supported by your browser.');
      return;
    }
    const perm = await Notification.requestPermission();
    setBrowserPermission(perm);
    if (perm === 'granted') {
      showSuccess('Browser notifications successfully enabled.');
      new Notification('SAARTHI Smart Learning', {
        body: 'Study notifications and task reminders are active!',
        icon: '/favicon.ico',
      });
    } else {
      showError('Notification permission was denied. You can re-enable it in browser site settings.');
    }
  };

  // 5. Study Preferences Save
  const handleSaveStudyPrefs = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.patch('/accounts/preferences/study/', studyPrefs);
      showSuccess('Study preferences updated and synced with AI Assistant.');
    } catch (err) {
      showError(err.message || 'Failed to save study preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  // 6. Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      showError('New passwords do not match.');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      showError('New password must be at least 8 characters long.');
      return;
    }
    setIsSaving(true);
    try {
      await changePassword(passwordForm);
      setPasswordForm({ current_password: '', new_password: '', confirm_new_password: '' });
      showSuccess('Password updated successfully.');
    } catch (err) {
      showError(err.message || 'Failed to update password.');
    } finally {
      setIsSaving(false);
    }
  };

  // 7. Account Deletion
  const handleDeleteAccountSubmit = async (e) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE') {
      showError("Please type 'DELETE' exactly to confirm.");
      return;
    }
    setIsDeletingAccount(true);
    try {
      await deleteAccount({ password: deletePassword, confirm_text: deleteConfirmText });
      navigate('/login');
    } catch (err) {
      showError(err.message || 'Failed to delete account. Please verify your password.');
      setIsDeletingAccount(false);
    }
  };

  const currentAvatarSrc = imagePreviewUrl || user?.profile_picture || user?.avatar;
  const currentDisplayName = user?.name || profileForm.name || 'Alex Johnson';

  return (
    <div className="space-y-4 max-w-4xl pb-10">
      {/* Top Banner Header */}
      <PageHeader
        title="Settings"
        description="Manage your student account, profile, notifications, and AI study preferences."
      />

      {/* Global Toast Feedback */}
      {successMsg && (
        <div className="p-3 rounded-btn bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between transition-base animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-xs hover:underline text-emerald-700 dark:text-emerald-400 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-btn bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center justify-between transition-base animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-xs hover:underline text-red-600 dark:text-red-400 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-brand-surface border border-brand-border rounded-card overflow-x-auto">
        {[
          { id: 'profile', label: 'My Profile', icon: User },
          { id: 'preferences', label: 'Study Preferences', icon: BookOpen },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'security', label: 'Security & Account', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-btn text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                isActive
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-brand-text-secondary hover:text-brand-text hover:bg-brand-primary-light/50'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: MY PROFILE */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          {/* Profile Picture Card */}
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar name={currentDisplayName} src={currentAvatarSrc} size="lg" className="w-16 h-16 text-lg border-2 border-brand-border" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                    title="Change picture"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-text">{currentDisplayName}</h4>
                  <p className="text-xs text-brand-text-secondary">{profileForm.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-primary-light px-2 py-0.5 rounded-full border border-brand-primary/15">
                      Verified Student
                    </span>
                    <span className="text-xs text-brand-text-secondary">
                      Max file size: 5 MB (JPG, PNG, WEBP)
                    </span>
                  </div>
                </div>
              </div>

              {/* Photo Controls */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                {imagePreviewUrl ? (
                  <>
                    <Button
                      size="sm"
                      onClick={handleUploadPhoto}
                      disabled={isUploadingPhoto}
                      icon={isUploadingPhoto ? Loader2 : Upload}
                    >
                      {isUploadingPhoto ? 'Uploading...' : 'Save Photo'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelImagePreview}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      icon={Camera}
                    >
                      Change Photo
                    </Button>
                    {user?.profile_picture && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRemovePhoto}
                        disabled={isUploadingPhoto}
                        className="text-brand-danger hover:bg-red-50 dark:hover:bg-red-950/30"
                        icon={Trash2}
                      >
                        Remove
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Profile Form Card */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-brand-text mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-primary" />
              Academic & Personal Details
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  label="Full Name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  icon={User}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={profileForm.email}
                  disabled
                  icon={Mail}
                  className="opacity-75 cursor-not-allowed bg-brand-bg/50"
                />
                <Input
                  label="College / University"
                  placeholder="e.g. Stanford University"
                  value={profileForm.university}
                  onChange={(e) => setProfileForm({ ...profileForm, university: e.target.value })}
                  icon={GraduationCap}
                />
                <Input
                  label="Course / Degree"
                  placeholder="e.g. B.Tech Computer Science"
                  value={profileForm.major}
                  onChange={(e) => setProfileForm({ ...profileForm, major: e.target.value })}
                  icon={BookOpen}
                />
                <Input
                  label="Current Year of Study"
                  placeholder="e.g. 3rd Year"
                  value={profileForm.year}
                  onChange={(e) => setProfileForm({ ...profileForm, year: e.target.value })}
                  icon={Calendar}
                />
                <div>
                  <label className="block text-xs font-semibold text-brand-text mb-1 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-brand-primary" />
                    Preferred Language
                  </label>
                  <select
                    value={profileForm.preferred_language}
                    onChange={(e) => setProfileForm({ ...profileForm, preferred_language: e.target.value })}
                    className="w-full text-xs rounded-btn border border-brand-border bg-brand-surface text-brand-text px-3 py-2.5 focus:outline-none focus:border-brand-primary cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="Hinglish">Hinglish (Bilingual)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">
                  Short Academic Bio
                </label>
                <textarea
                  rows={2}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Share a short bio about your academic focus, exam preparations, or research interests..."
                  className="w-full text-xs rounded-btn border border-brand-border bg-brand-surface text-brand-text p-2.5 focus:outline-none focus:border-brand-primary resize-none"
                  maxLength={500}
                />
                <p className="text-[11px] text-brand-text-secondary text-right mt-0.5">
                  {profileForm.bio.length} / 500 characters
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" size="sm" disabled={isSaving} icon={isSaving ? Loader2 : undefined}>
                  {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 2: STUDY PREFERENCES */}
      {activeTab === 'preferences' && (
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-brand-text mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              AI Learning & Study Customization
            </h3>
            <p className="text-xs text-brand-text-secondary">
              Personalize how the AI Study Assistant explains concepts and adapts to your academic pacing.
            </p>
          </div>

          <form onSubmit={handleSaveStudyPrefs} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Language Choice */}
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">
                  AI Teaching Language
                </label>
                <select
                  value={studyPrefs.preferred_language}
                  onChange={(e) => setStudyPrefs({ ...studyPrefs, preferred_language: e.target.value })}
                  className="w-full text-xs rounded-btn border border-brand-border bg-brand-surface text-brand-text px-3 py-2 focus:outline-none focus:border-brand-primary cursor-pointer"
                >
                  <option value="English">English (Standard Academic)</option>
                  <option value="Hindi">Hindi (सरल हिन्दी)</option>
                  <option value="Hinglish">Hinglish (Conversational Bilingual)</option>
                </select>
              </div>

              {/* Explanation Style */}
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">
                  Explanation Depth & Style
                </label>
                <select
                  value={studyPrefs.explanation_style}
                  onChange={(e) => setStudyPrefs({ ...studyPrefs, explanation_style: e.target.value })}
                  className="w-full text-xs rounded-btn border border-brand-border bg-brand-surface text-brand-text px-3 py-2 focus:outline-none focus:border-brand-primary cursor-pointer"
                >
                  <option value="simple">Simple (Analogies, intuitive examples, plain terms)</option>
                  <option value="detailed">Detailed (In-depth proofs, derivations, comprehensive)</option>
                </select>
              </div>

              {/* Preferred Study Subjects */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-brand-text mb-1">
                  Primary Study Subjects (comma-separated)
                </label>
                <Input
                  value={studyPrefs.preferred_subjects}
                  onChange={(e) => setStudyPrefs({ ...studyPrefs, preferred_subjects: e.target.value })}
                  placeholder="e.g. Computer Science, Mathematics, Machine Learning"
                />
              </div>

              {/* Daily Target Minutes */}
              <div className="sm:col-span-2 bg-brand-bg/50 p-3.5 rounded-card border border-brand-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-brand-primary" />
                    <span className="text-xs font-bold text-brand-text">Daily Study Target</span>
                  </div>
                  <span className="text-xs font-bold text-brand-primary font-mono">
                    {studyPrefs.daily_goal_minutes} mins ({(studyPrefs.daily_goal_minutes / 60).toFixed(1)} hrs/day)
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="480"
                  step="15"
                  value={studyPrefs.daily_goal_minutes}
                  onChange={(e) => setStudyPrefs({ ...studyPrefs, daily_goal_minutes: Number(e.target.value) })}
                  className="w-full accent-brand-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-brand-text-secondary mt-1">
                  <span>30 mins</span>
                  <span>2 hours (Recommended)</span>
                  <span>4 hours</span>
                  <span>8 hours</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" size="sm" disabled={isSaving} icon={isSaving ? Loader2 : undefined}>
                {isSaving ? 'Saving Preferences...' : 'Save Study Preferences'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-brand-text mb-1 flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-primary" />
                Notification Preferences
              </h3>
              <p className="text-xs text-brand-text-secondary">
                Configure real-time alerts for scheduled study sessions, upcoming task deadlines, and quiz summaries.
              </p>
            </div>
            {browserPermission !== 'granted' && (
              <Button size="sm" variant="outline" onClick={handleRequestBrowserNotifications}>
                Enable Browser Alerts
              </Button>
            )}
          </div>

          <div className="divide-y divide-brand-border/60">
            {[
              {
                key: 'notif_study_reminders',
                label: 'Study Session Reminders',
                desc: 'Alert 15 minutes before timetable sessions and scheduled tasks start.',
              },
              {
                key: 'notif_task_reminders',
                label: 'Task Deadline Warnings',
                desc: 'Notify when tasks are due today or approaching their deadlines.',
              },
              {
                key: 'notif_goal_progress',
                label: 'Daily Study Goal Updates',
                desc: 'Track remaining minutes towards completing your daily study goal.',
              },
              {
                key: 'notif_quiz_summaries',
                label: 'Quiz Mastery & Recommendations',
                desc: 'Post-quiz review notifications and personalized AI topic review suggestions.',
              },
            ].map((item) => (
              <div key={item.key} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-brand-text">{item.label}</p>
                  <p className="text-[11px] text-brand-text-secondary">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={Boolean(notifPrefs[item.key])}
                    onChange={() => handleToggleNotification(item.key)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 5: SECURITY & ACCOUNT */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          {/* Change Password Card */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-brand-text mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-primary" />
              Update Account Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-3 max-w-lg">
              <Input
                label="Current Password"
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                required
              />
              <Input
                label="New Password"
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                placeholder="At least 8 characters"
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirm_new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_new_password: e.target.value })}
                required
              />

              <div className="pt-2">
                <Button type="submit" size="sm" disabled={isSaving} icon={isSaving ? Loader2 : undefined}>
                  {isSaving ? 'Updating Password...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Session & Danger Zone */}
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-brand-text">Active Session</h4>
                <p className="text-xs text-brand-text-secondary">
                  Logged in as <span className="font-semibold text-brand-text">{profileForm.email}</span>.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                icon={LogOut}
              >
                Log Out of SAARTHI
              </Button>
            </div>

            <div className="pt-4 border-t border-brand-border">
              <h4 className="text-xs font-bold text-brand-danger uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Danger Zone
              </h4>
              <p className="text-xs text-brand-text-secondary mb-3">
                Permanently delete your SAARTHI account, saved documents, chat histories, quizzes, and planner tasks.
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
              >
                Delete Account...
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Account Deletion"
      >
        <form onSubmit={handleDeleteAccountSubmit} className="space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-card text-xs text-red-800 dark:text-red-300">
            <strong>Warning:</strong> This action is irreversible. All your study notes, quizzes, documents, and progress records will be permanently erased.
          </div>

          <Input
            label="Verify Your Current Password"
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={isDeletingAccount || deleteConfirmText !== 'DELETE' || !deletePassword}
              icon={isDeletingAccount ? Loader2 : undefined}
            >
              {isDeletingAccount ? 'Deleting Account...' : 'Permanently Delete Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
