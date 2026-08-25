import { WcaUser } from '../../lib/types';

interface WcaAuthButtonProps {
  isConfigured: boolean;
  isLoading: boolean;
  user: WcaUser | null;
  onLogin: () => void;
  onLogout: () => void;
}

export function WcaAuthButton({
  isConfigured,
  isLoading,
  user,
  onLogin,
  onLogout,
}: WcaAuthButtonProps) {
  if (user) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="hidden text-gray-600 sm:inline">{user.name}</span>
        <button
          className="focus-ring rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 transition hover:bg-gray-50"
          type="button"
          onClick={onLogout}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      className="focus-ring rounded-md border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
      disabled={!isConfigured || isLoading}
      title={
        isConfigured
          ? 'Sign in with your WCA account'
          : 'WCA login is not configured'
      }
      onClick={onLogin}>
      {isLoading ? 'Signing in…' : 'Sign in with WCA'}
    </button>
  );
}
