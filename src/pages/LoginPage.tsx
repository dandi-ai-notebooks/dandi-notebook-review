import { useState, FormEvent } from 'react';

interface LoginPageProps {
  onLogin: (token: string) => Promise<void>;
  isAdminLogin?: boolean;
}

function LoginPage({ onLogin, isAdminLogin = false }: LoginPageProps) {
  const [apiToken, setApiToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await onLogin(apiToken);
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid API token. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit}>
        <h2>{isAdminLogin ? 'Admin Login' : 'User Login'}</h2>
        <div className="form-group">
          <label htmlFor="apiToken">{isAdminLogin ? 'Admin Token:' : 'API Token:'}</label>
          <input
            type="text"
            id="apiToken"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder={isAdminLogin ? 'Enter admin token' : 'Enter your API token'}
            required
          />
        </div>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {!isAdminLogin && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <a href="/dandi-notebook-review/admin" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
            Admin Login
          </a>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
