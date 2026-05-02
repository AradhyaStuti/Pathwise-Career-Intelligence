import { useState } from 'react';
import { Routes, Route, Navigate, Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/auth.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import RoadmapView from './pages/RoadmapView.jsx';
import Insights from './pages/Insights.jsx';
import SkillGap from './pages/SkillGap.jsx';
import Resume from './pages/Resume.jsx';
import Resources from './pages/Resources.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';
import { Footer } from './components/Footer.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Nav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/insights', label: 'Insights' },
    { to: '/skill-gap', label: 'Skill Gap' },
    { to: '/resume', label: 'ATS Scan' },
    { to: '/resources', label: 'Resources' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/settings', label: 'Settings' },
  ];

  const linkCls = ({ isActive }) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-50 text-brand-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5 text-lg font-bold" onClick={() => setOpen(false)}>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-extrabold text-white shadow-sm">
            P
          </span>
          <span className="tracking-tight">
            Path<span className="text-brand-600">wise</span>
          </span>
        </Link>

        {user && (
          <nav className="hidden items-center gap-0.5 lg:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkCls}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/onboarding" className="btn-primary hidden text-sm sm:inline-flex">
                + New roadmap
              </Link>
              <button
                className="btn-ghost text-sm"
                onClick={() => {
                  logout();
                  setOpen(false);
                  nav('/');
                }}
              >
                Logout
              </button>
              <button
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
                onClick={() => setOpen((s) => !s)}
                aria-label="Toggle menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {open ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary text-sm">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>

      {user && open && (
        <nav className="fade-in border-t border-slate-100 bg-white px-4 pb-4 pt-2 lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={linkCls}
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/onboarding"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 justify-center text-sm sm:hidden"
            >
              + New roadmap
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
      <Nav />
      <div className="flex-1">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/onboarding"
          element={
            <Protected>
              <Onboarding />
            </Protected>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/roadmap/:id"
          element={
            <Protected>
              <RoadmapView />
            </Protected>
          }
        />
        <Route
          path="/insights"
          element={
            <Protected>
              <Insights />
            </Protected>
          }
        />
        <Route
          path="/skill-gap"
          element={
            <Protected>
              <SkillGap />
            </Protected>
          }
        />
        <Route
          path="/resume"
          element={
            <Protected>
              <Resume />
            </Protected>
          }
        />
        <Route path="/resources" element={<Resources />} />
        <Route
          path="/leaderboard"
          element={
            <Protected>
              <Leaderboard />
            </Protected>
          }
        />
        <Route
          path="/settings"
          element={
            <Protected>
              <Settings />
            </Protected>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </div>
      <Footer />
      </div>
    </AuthProvider>
  );
}
