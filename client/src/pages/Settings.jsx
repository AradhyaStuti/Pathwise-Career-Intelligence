import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../store/auth.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const nav = useNavigate();
  const p = user?.profile || {};

  const [profile, setProfile] = useState({
    phone: p.phone || '',
    location: p.location || '',
    linkedin: p.linkedin || '',
    github: p.github || '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ text: '', ok: false });
  const [pwLoading, setPwLoading] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErr, setDeleteErr] = useState('');

  async function saveProfile(e) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');
    try {
      await updateProfile(profile);
      setProfileMsg('Profile updated.');
    } catch (e) {
      setProfileMsg(e.message);
    } finally {
      setProfileLoading(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwMsg({ text: '', ok: false });
    if (pw.newPassword !== pw.confirm) {
      setPwMsg({ text: 'New passwords do not match.', ok: false });
      return;
    }
    if (pw.newPassword.length < 8) {
      setPwMsg({ text: 'New password must be at least 8 characters.', ok: false });
      return;
    }
    setPwLoading(true);
    try {
      await api.changePassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setPwMsg({ text: 'Password changed successfully.', ok: true });
    } catch (e) {
      setPwMsg({ text: e.message, ok: false });
    } finally {
      setPwLoading(false);
    }
  }

  async function confirmDeleteAccount() {
    setDeleteErr('');
    setDeleteLoading(true);
    try {
      await api.deleteAccount({ password: deletePassword });
      logout();
      nav('/');
    } catch (e) {
      setDeleteErr(e.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-slate-600">Manage your account and preferences.</p>

      <section className="card mt-8 p-6">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-slate-500">Name</div>
            <div className="mt-1">{user?.name}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Email</div>
            <div className="mt-1">{user?.email}</div>
          </div>
        </div>
      </section>

      <form onSubmit={saveProfile} className="card mt-6 p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="mb-1 block text-xs font-medium text-slate-500">Phone</label>
            <input id="phone" className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </div>
          <div>
            <label htmlFor="location" className="mb-1 block text-xs font-medium text-slate-500">Location</label>
            <input id="location" className="input" placeholder="City, Country" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
          </div>
          <div>
            <label htmlFor="linkedin" className="mb-1 block text-xs font-medium text-slate-500">LinkedIn URL</label>
            <input id="linkedin" className="input" value={profile.linkedin} onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })} />
          </div>
          <div>
            <label htmlFor="github" className="mb-1 block text-xs font-medium text-slate-500">GitHub URL</label>
            <input id="github" className="input" value={profile.github} onChange={(e) => setProfile({ ...profile, github: e.target.value })} />
          </div>
        </div>
        {profileMsg && (
          <p className={`mt-3 text-sm ${profileMsg.includes('updated') ? 'text-green-600' : 'text-red-600'}`}>
            {profileMsg}
          </p>
        )}
        <button className="btn-primary mt-4 text-sm" disabled={profileLoading}>
          {profileLoading ? 'Saving...' : 'Save profile'}
        </button>
      </form>

      <form onSubmit={changePassword} className="card mt-6 p-6">
        <h2 className="text-lg font-semibold">Change password</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="curPw" className="mb-1 block text-xs font-medium text-slate-500">Current password</label>
            <input id="curPw" type="password" autoComplete="current-password" className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="newPw" className="mb-1 block text-xs font-medium text-slate-500">New password (min 8 chars)</label>
            <input id="newPw" type="password" autoComplete="new-password" className="input" minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="cfmPw" className="mb-1 block text-xs font-medium text-slate-500">Confirm new password</label>
            <input id="cfmPw" type="password" autoComplete="new-password" className="input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
          </div>
        </div>
        {pwMsg.text && (
          <p className={`mt-3 text-sm ${pwMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{pwMsg.text}</p>
        )}
        <button className="btn-primary mt-4 text-sm" disabled={pwLoading}>
          {pwLoading ? 'Changing...' : 'Change password'}
        </button>
      </form>

      <section className="card mt-6 border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-700">Danger zone</h2>
        <p className="mt-2 text-sm text-slate-600">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <button className="btn-danger mt-4 text-sm" onClick={() => setShowDelete(true)}>
          Delete my account
        </button>
      </section>

      {showDelete && (
        <div className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setShowDelete(false)}>
          <div className="slide-up w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-red-700">Delete account</h2>
            <p className="mt-2 text-sm text-slate-600">
              All your roadmaps, progress, and data will be permanently removed. Enter your password to confirm.
            </p>
            <input
              type="password"
              className="input mt-4"
              placeholder="Your password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoFocus
            />
            {deleteErr && <p className="mt-2 text-sm text-red-600">{deleteErr}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost text-sm" onClick={() => setShowDelete(false)} disabled={deleteLoading}>
                Cancel
              </button>
              <button
                className="btn-danger text-sm"
                onClick={confirmDeleteAccount}
                disabled={!deletePassword || deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
