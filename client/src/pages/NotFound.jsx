import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-8xl font-extrabold text-slate-200">404</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="btn-primary text-sm">
            Go home
          </Link>
          <Link to="/dashboard" className="btn-ghost text-sm">
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
