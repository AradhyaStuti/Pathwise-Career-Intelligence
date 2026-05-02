import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-slate-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded bg-brand-600 text-[10px] font-bold text-white">P</span>
          <span>Pathwise</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-4">
          <Link to="/resources" className="hover:text-slate-900">Resources</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-900">GitHub</a>
          <span className="cursor-default" title="No personal data sold or shared">Privacy</span>
          <span className="cursor-default" title="Free for personal use">Terms</span>
        </nav>
        <div className="text-slate-400">
          Built with React, Node.js & MongoDB
        </div>
      </div>
    </footer>
  );
}
