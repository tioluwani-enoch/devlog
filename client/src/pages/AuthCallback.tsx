import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginWithCode } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('No authorization code received.');
      return;
    }

    loginWithCode(code)
      .then((res) => {
        setUser(res.data.user);
        navigate('/');
      })
      .catch(() => setError('Authentication failed. Please try again.'));
  }, [searchParams, navigate, setUser]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center">
        <p className="text-red-400">{error}</p>
        <a href="/" className="text-accent hover:underline text-sm">
          Back to login
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted">Signing you in...</p>
    </div>
  );
}
