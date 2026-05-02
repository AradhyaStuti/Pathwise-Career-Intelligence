import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-[70vh] items-center justify-center px-4 py-20">
          <div className="card slide-up max-w-md p-8 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-100 text-3xl">
              !
            </div>
            <h1 className="mt-5 text-2xl font-bold text-slate-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600">
              {this.state.error.message || 'An unexpected error occurred.'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                className="btn-ghost text-sm"
                onClick={() => {
                  this.setState({ error: null });
                  window.location.reload();
                }}
              >
                Try again
              </button>
              <button
                className="btn-primary text-sm"
                onClick={() => {
                  this.setState({ error: null });
                  window.location.href = '/';
                }}
              >
                Back to home
              </button>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
