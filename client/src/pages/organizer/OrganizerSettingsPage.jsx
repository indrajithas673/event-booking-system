import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import * as authService from '../../services/authService';
import ImageUpload from '../../components/ui/ImageUpload';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const SECTIONS = [
  { key: 'profile', label: 'Profile', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
  { key: 'password', label: 'Password', icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z' },
  { key: 'appearance', label: 'Appearance', icon: 'M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z' },
  { key: 'danger', label: 'Danger Zone', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' },
];

const ROLE_STYLES = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  organizer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  attendee: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};

const PASSWORD_STRENGTH_LEVELS = [
  { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' },
  { label: 'Fair', color: 'bg-orange-500', width: 'w-2/4' },
  { label: 'Good', color: 'bg-yellow-500', width: 'w-3/4' },
  { label: 'Strong', color: 'bg-green-500', width: 'w-full' },
];

const calculatePasswordStrength = (password) => {
  if (!password) return -1;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score - 1, 3);
};

const ProfileSection = ({ user, updateUser }) => {
  const [formData, setFormData] = useState({ fullName: '', bio: '', phone: '', avatar: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || user.name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await authService.updateProfile(formData);
      updateUser(response.data || formData);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Avatar</label>
        <div className="max-w-xs">
          {formData.avatar && (
            <div className="relative group">
              <img src={formData.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" />
              <button
                type="button"
                onClick={() => handleChange('avatar', '')}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                &times;
              </button>
            </div>
          )}
          <div className="mt-3">
            <ImageUpload value={formData.avatar} onChange={(url) => handleChange('avatar', url)} />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="orgFullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
        <input
          id="orgFullName"
          type="text"
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        />
      </div>

      <div>
        <label htmlFor="orgBio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
        <textarea
          id="orgBio"
          rows={4}
          value={formData.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          placeholder="Tell attendees about yourself or your organization..."
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
        />
      </div>

      <div>
        <label htmlFor="orgPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
        <input
          id="orgPhone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
        <input
          type="email"
          value={user?.email || ''}
          readOnly
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${ROLE_STYLES[user?.role] || ROLE_STYLES.attendee}`}>
          {user?.role || 'attendee'}
        </span>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          Save Changes
        </button>
      </div>
    </form>
  );
};

const PasswordSection = () => {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const strength = calculatePasswordStrength(formData.newPassword);

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const toggleVisibility = (field) => setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword === formData.currentPassword) {
      toast.error('New password must be different from current password');
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setSaving(true);
      await authService.changePassword({ currentPassword: formData.currentPassword, newPassword: formData.newPassword });
      toast.success('Password updated');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const renderPasswordInput = (id, label, field, visibilityKey) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={showPasswords[visibilityKey] ? 'text' : 'password'}
          value={formData[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          required
          className="w-full px-4 py-2.5 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
        />
        <button
          type="button"
          onClick={() => toggleVisibility(visibilityKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {showPasswords[visibilityKey] ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            ) : (
              <>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </>
            )}
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {renderPasswordInput('orgCurrentPassword', 'Current Password', 'currentPassword', 'current')}
      <div>
        {renderPasswordInput('orgNewPassword', 'New Password', 'newPassword', 'new')}
        {formData.newPassword && strength >= 0 && (
          <div className="mt-2 space-y-1">
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${PASSWORD_STRENGTH_LEVELS[strength].color} ${PASSWORD_STRENGTH_LEVELS[strength].width}`} />
            </div>
            <p className={`text-xs font-medium ${strength <= 0 ? 'text-red-500' : strength === 1 ? 'text-orange-500' : strength === 2 ? 'text-yellow-600' : 'text-green-500'}`}>
              {PASSWORD_STRENGTH_LEVELS[strength].label}
            </p>
          </div>
        )}
      </div>
      {renderPasswordInput('orgConfirmPassword', 'Confirm New Password', 'confirmPassword', 'confirm')}
      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          Update Password
        </button>
      </div>
    </form>
  );
};

const AppearanceSection = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { key: 'light', label: 'Light', icon: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z', preview: 'bg-white border-gray-200', previewBar: 'bg-gray-100', previewDots: 'bg-gray-300' },
    { key: 'dark', label: 'Dark', icon: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z', preview: 'bg-gray-900 border-gray-700', previewBar: 'bg-gray-800', previewDots: 'bg-gray-600' },
    { key: 'system', label: 'System', icon: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25', preview: 'bg-gradient-to-r from-white to-gray-900 border-gray-300', previewBar: 'bg-gradient-to-r from-gray-100 to-gray-800', previewDots: 'bg-gray-400' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {themes.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => setTheme(t.key)}
          className={`group relative p-4 rounded-xl border-2 transition-all text-left ${theme === t.key ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
        >
          <div className={`rounded-lg overflow-hidden mb-3 h-20 ${t.preview} border`}>
            <div className={`h-4 ${t.previewBar} flex items-center px-2 gap-1`}>
              <span className={`w-1.5 h-1.5 rounded-full ${t.previewDots}`} />
              <span className={`w-1.5 h-1.5 rounded-full ${t.previewDots}`} />
              <span className={`w-1.5 h-1.5 rounded-full ${t.previewDots}`} />
            </div>
            <div className="p-2 space-y-1">
              <div className={`h-1.5 ${t.previewDots} rounded w-3/4`} />
              <div className={`h-1.5 ${t.previewDots} rounded w-1/2`} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
            </svg>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{t.label}</span>
          </div>
          {theme === t.key && (
            <div className="absolute top-2 right-2">
              <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

const DangerZoneSection = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }
    try {
      setDeleting(true);
      await authService.deleteAccount({ password });
      logout();
      navigate('/');
      toast.success('Account deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border-2 border-red-200 dark:border-red-900/50 p-6">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Delete Account</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Once you delete your account, all of your events, registrations, and data will be permanently removed. This action cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="mt-4 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Delete Account
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setShowModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Account</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This will permanently delete your account, all your events, registrations, and associated data. Please enter your password to confirm.
            </p>
            <div>
              <label htmlFor="orgDeletePassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                id="orgDeletePassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setShowModal(false); setPassword(''); }}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || !password.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                I understand, delete my account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const OrganizerSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useDocumentTitle('Organizer Settings');

  const currentSection = SECTIONS.find((s) => s.key === activeSection);

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection user={user} updateUser={updateUser} />;
      case 'password':
        return <PasswordSection />;
      case 'appearance':
        return <AppearanceSection />;
      case 'danger':
        return <DangerZoneSection />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Manage your account settings and preferences.</p>
      </div>

      {/* Mobile Section Dropdown */}
      <div className="lg:hidden mb-6">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-left"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={currentSection?.icon} />
            </svg>
            <span className="font-medium text-gray-900 dark:text-white">{currentSection?.label}</span>
          </div>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {mobileMenuOpen && (
          <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-lg">
            {SECTIONS.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => { setActiveSection(section.key); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeSection === section.key ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'} ${section.key === 'danger' ? 'text-red-600 dark:text-red-400' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                </svg>
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <nav className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 space-y-1">
            {SECTIONS.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${activeSection === section.key ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'} ${section.key === 'danger' && activeSection !== section.key ? 'text-red-500! dark:text-red-400!' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                </svg>
                <span className="text-sm">{section.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{currentSection?.label}</h2>
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerSettingsPage;
