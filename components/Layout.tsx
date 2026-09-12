import Link from 'next/link';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.96,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
  exit: {
    opacity: 0,
    y: -30,
    scale: 0.96,
    transition: {
      duration: 0.4,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
};

export default function Layout({ children, title = 'FitVerse AI' }: LayoutProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const toggleDark = () => {
    document.body.classList.toggle('dark');
    const toggle = document.querySelector('.dark-toggle');
    if (toggle) {
      toggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
    }
  };

  return (
    <>
      {/* Navigation */}
      <nav>
        <div className="container nav-inner">
          <Link href="/" className="logo">FitVerse AI</Link>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/features">Features</Link>
            <Link href="/ai-coach">AI Coach</Link>
            <Link href="/nutrition">Nutrition</Link>
            <Link href="/workout">Workout</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/about">About</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
            {/* Only show Explore, Dashboard, and Aura to authenticated users */}
            {isAuthenticated && (
              <>
                <Link href="/explore" style={{ color: '#16A34A', fontWeight: '600' }}>Explore</Link>
                <Link href="/dashboard" style={{ color: '#16A34A' }}>Dashboard</Link>
                <Link href="/chat" style={{ color: '#22C55E', fontWeight: '600' }}>💬 Aura</Link>
              </>
            )}
          </div>
          <div className="nav-actions">
            {isAuthenticated ? (
              <>
                <Link href="/profile" style={{ fontWeight: '500' }}>Profile</Link>
                <Link href="/api/auth/signout" className="btn-outline" style={{ padding: '8px 20px' }}>
                  Logout
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" style={{ fontWeight: '500' }}>Login</Link>
                <Link href="/signup" className="btn-primary" style={{ padding: '8px 20px' }}>Sign Up</Link>
              </>
            )}
            <button className="dark-toggle" onClick={toggleDark} aria-label="Toggle dark mode">🌙</button>
          </div>
        </div>
      </nav>

      {/* Page Content with Animation */}
      <motion.main
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
      >
        {children}
      </motion.main>

      {/* Footer */}
      <footer>
        <div className="container footer-grid">
          <div>
            <Link href="/" className="logo" style={{ fontSize: '2rem' }}>FitVerse AI</Link>
            <p style={{ marginTop: '8px', opacity: '0.6' }}>Your Personal AI Health Companion.</p>
          </div>
          <div className="footer-links">
            <strong>Quick</strong>
            <Link href="/">Home</Link>
            <Link href="/features">Features</Link>
            <Link href="/pricing">Pricing</Link>
            {isAuthenticated && <Link href="/explore">Explore</Link>}
            {isAuthenticated && <Link href="/chat">💬 Chat with Aura</Link>}
          </div>
          <div className="footer-links">
            <strong>Legal</strong>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms</Link>
          </div>
          <div className="footer-links">
            <strong>Social</strong>
            <a href="#">Instagram</a>
            <a href="#">LinkedIn</a>
            <a href="#">GitHub</a>
            <a href="#">Twitter</a>
          </div>
        </div>
        <div className="container" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '24px', marginTop: '24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <span>© 2026 FitVerse AI. All rights reserved.</span>
          <span>Made with ❤️ and AI</span>
        </div>
      </footer>
    </>
  );
}