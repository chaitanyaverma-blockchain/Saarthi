import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already authenticated, redirect to student dashboard
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/app/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      if (err.data?.message) {
        setErrorMessage(err.data.message);
      } else if (err.data?.errors?.non_field_errors) {
        setErrorMessage(err.data.errors.non_field_errors[0]);
      } else if (err.message) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Unable to connect to the backend server. Please verify the API is running.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12 relative">
      
      <div className="w-full max-w-md">
        {/* Logo & Headline */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text">Welcome back</h1>
          <p className="text-brand-text-secondary text-sm mt-1.5">
            Sign in to continue your learning journey
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-brand-surface border border-brand-border rounded-card p-6 sm:p-8 shadow-card">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-btn bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-sm text-brand-danger">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="University Email"
              type="email"
              placeholder="alex.johnson@university.edu"
              icon={Mail}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              required
              disabled={isSubmitting}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              icon={Lock}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              required
              disabled={isSubmitting}
            />

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-brand-text-secondary text-xs sm:text-sm">Remember me</span>
              </label>
              <button
                type="button"
                className="text-brand-primary hover:text-brand-primary-hover hover:underline text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full shadow-sm font-semibold mt-2"
              size="lg"
              icon={isSubmitting ? Loader2 : ArrowRight}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In to SAARTHI'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-brand-text-secondary mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-primary font-semibold hover:underline">
            Create an account
          </Link>
        </p>

        <div className="text-center mt-4">
          <Link
            to="/"
            className="text-xs font-medium text-brand-text-secondary hover:text-brand-primary transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
