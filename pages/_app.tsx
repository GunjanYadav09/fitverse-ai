import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter();

  return (
    <SessionProvider session={session}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0F172A',
            color: '#F8FAFC',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            style: {
              border: '1px solid #16A34A',
            },
          },
          error: {
            style: {
              border: '1px solid #ef4444',
            },
          },
        }}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={router.route}
          initial="initialState"
          animate="animateState"
          exit="exitState"
          transition={{
            duration: 0.75,
          }}
          variants={{
            initialState: {
              opacity: 0,
              y: 20,
            },
            animateState: {
              opacity: 1,
              y: 0,
            },
            exitState: {
              opacity: 0,
              y: -20,
            },
          }}
        >
          <Component {...pageProps} />
        </motion.div>
      </AnimatePresence>
    </SessionProvider>
  );
}