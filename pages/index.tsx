import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '@/components/Layout';

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  return (
    <Layout title="FitVerse AI - Your AI Health Companion">
      <section className="hero" style={{ paddingTop: '120px', minHeight: '80vh' }}>
        <div className="container hero-grid">
          <div>
            <h1>
              Your AI Fitness Coach,<br />
              <span style={{ color: '#16A34A' }}>Nutritionist &amp; Wellness</span> Companion.
            </h1>
            <p style={{ fontSize: '1.2rem', margin: '20px 0 32px', opacity: 0.7 }}>
              Track calories, scan meals, generate personalized meal plans, build workout routines, 
              monitor health, and chat with your own AI coach — all in one platform.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {isAuthenticated ? (
                <Link href="/dashboard" className="btn-primary">
                  Go to Dashboard
                </Link>
              ) : (
                <Link href="/signup" className="btn-primary">
                  Get Started
                </Link>
              )}
              <Link href="/features" className="btn-outline">
                Learn More
              </Link>
            </div>
            <div style={{ marginTop: '32px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <span className="badge">⭐ 100K+ Future Users</span>
              <span className="badge">🧠 AI Powered</span>
              <span className="badge">⏰ 24/7 Smart Coach</span>
              <span className="badge">📸 Meal Scanner</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card" style={{ 
              padding: '0', 
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #0F172A, #1a2a3a)',
              maxWidth: '480px'
            }}>
              <div style={{ position: 'relative', width: '100%', height: '400px' }}>
                <img 
                  src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop&crop=center"
                  alt="Fitness Motivation"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.85
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '30px 24px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                  color: 'white'
                }}>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
                    Train Like a Champion
                  </h3>
                  <p style={{ opacity: 0.9, fontSize: '0.95rem' }}>
                    Your journey to greatness starts here
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    marginTop: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      background: 'rgba(34,197,94,0.3)',
                      backdropFilter: 'blur(4px)',
                      padding: '4px 16px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      border: '1px solid rgba(34,197,94,0.3)'
                    }}>💪 Never Give Up</span>
                    <span style={{
                      background: 'rgba(34,197,94,0.3)',
                      backdropFilter: 'blur(4px)',
                      padding: '4px 16px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      border: '1px solid rgba(34,197,94,0.3)'
                    }}>🔥 Stay Consistent</span>
                    <span style={{
                      background: 'rgba(34,197,94,0.3)',
                      backdropFilter: 'blur(4px)',
                      padding: '4px 16px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      border: '1px solid rgba(34,197,94,0.3)'
                    }}>🏆 Achieve Greatness</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}