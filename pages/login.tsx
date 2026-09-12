import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password');
        setLoading(false);
        return;
      }

      toast.success('Login successful!');

      // Get session to check onboarding status
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();

      if (session?.user?.onboardingCompleted) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  return (
    <Layout title="Login - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div className="glass" style={{ padding: '40px', borderRadius: '32px' }}>
            <h1 className="section-title" style={{ textAlign: 'center', fontSize: '2rem' }}>
              Welcome Back
            </h1>
            <p style={{ textAlign: 'center', marginBottom: '24px', opacity: 0.7 }}>
              Login to your FitVerse AI account
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: errors.email ? '1px solid #ef4444' : '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.5)',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s',
                  }}
                />
                {errors.email && (
                  <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px' }}>
                    {errors.email}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: errors.password ? '1px solid #ef4444' : '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.5)',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s',
                  }}
                />
                {errors.password && (
                  <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px' }}>
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '16px' }}>
              Don't have an account?{' '}
              <Link href="/signup" style={{ color: '#16A34A', fontWeight: '600' }}>
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}