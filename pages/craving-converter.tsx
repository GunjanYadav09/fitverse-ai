import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';

export default function CravingConverter() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [craving, setCraving] = useState('');
  const [result, setResult] = useState<any>(null);
  const [entryId, setEntryId] = useState('');
  const [savedEntries, setSavedEntries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'convert' | 'saved'>('convert');
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchSaved();
  }, [status, router]);

  const fetchSaved = async () => {
    try {
      const res = await fetch('/api/craving-converter');
      const data = await res.json();
      if (res.ok) setSavedEntries(data.entries || []);
    } catch (error) {
      console.error('Error fetching saved:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (e?: React.FormEvent, customCraving?: string) => {
    e?.preventDefault();
    const query = customCraving || craving;
    if (!query.trim()) {
      toast.error('Please enter your craving');
      return;
    }

    setConverting(true);
    setResult(null);

    try {
      const response = await fetch('/api/craving-converter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ craving: query }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.conversion);
        setEntryId(data.entryId);

        // 🎉 Trigger confetti if calories saved > 150
        if (data.conversion.caloriesSaved >= 150) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2500);
        }

        toast.success(`✨ ${data.conversion.healthyAlternative} ready!`);
      } else {
        toast.error(data.message || 'Error converting');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setConverting(false);
    }
  };

  const saveResult = async () => {
    if (!entryId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/craving-converter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', entryId }),
      });
      if (res.ok) {
        toast.success('Saved to your collection! 💾');
        fetchSaved();
      }
    } catch (error) {
      toast.error('Error saving');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this saved recipe?')) return;
    try {
      const res = await fetch('/api/craving-converter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', entryId: id }),
      });
      if (res.ok) {
        toast.success('Deleted');
        fetchSaved();
      }
    } catch (error) {
      toast.error('Error deleting');
    }
  };

  const quickCravings = [
    { name: 'Pizza', emoji: '🍕' },
    { name: 'Burger', emoji: '🍔' },
    { name: 'Chocolate', emoji: '🍫' },
    { name: 'Ice Cream', emoji: '🍦' },
    { name: 'Fries', emoji: '🍟' },
    { name: 'Samosa', emoji: '🥟' },
    { name: 'Pasta', emoji: '🍝' },
    { name: 'Cake', emoji: '🎂' },
    { name: 'Cold Drink', emoji: '🥤' },
    { name: 'Chips', emoji: '🍿' },
    { name: 'Donut', emoji: '🍩' },
    { name: 'Noodles', emoji: '🍜' },
  ];

  if (status === 'loading' || loading) {
    return (
      <Layout title="Craving Converter">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '20px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: '4rem' }}
          >
            🍕
          </motion.div>
          <p style={{ opacity: 0.7 }}>Loading deliciousness...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <Layout title="Craving Converter - FitVerse AI">
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 9999,
            }}
          >
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: -50,
                  x: Math.random() * window.innerWidth,
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  y: window.innerHeight + 100,
                  rotate: Math.random() * 720 - 360,
                  opacity: 0,
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.5,
                  ease: 'easeOut',
                }}
                style={{
                  position: 'absolute',
                  fontSize: ['🎉', '✨', '💪', '🥗', '⭐', '🔥'][i % 6],
                }}
              >
                {['🎉', '✨', '💪', '🥗', '⭐', '🔥'][i % 6]}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container">
          {/* Animated Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: '32px' }}
          >
            <motion.h1
              className="section-title"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}
            >
              <motion.span
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                🍕
              </motion.span>
              Craving Converter
              <motion.span
                animate={{
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.1, 1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 0.5 }}
              >
                🥗
              </motion.span>
            </motion.h1>
            <p style={{ opacity: 0.7 }}>
              Turn your unhealthy cravings into delicious healthy alternatives ✨
            </p>
          </motion.div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '24px',
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              paddingBottom: '12px',
              flexWrap: 'wrap',
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('convert')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: activeTab === 'convert' ? '#EF4444' : 'transparent',
                color: activeTab === 'convert' ? 'white' : '#0F172A',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background 0.3s',
              }}
            >
              🔄 Convert Craving
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('saved')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: activeTab === 'saved' ? '#EF4444' : 'transparent',
                color: activeTab === 'saved' ? 'white' : '#0F172A',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background 0.3s',
              }}
            >
              💾 Saved Recipes ({savedEntries.length})
            </motion.button>
          </div>

          {/* ============ CONVERT TAB ============ */}
          <AnimatePresence mode="wait">
            {activeTab === 'convert' && (
              <motion.div
                key="convert"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Input Card */}
                <motion.div
                  className="glass"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    padding: '32px',
                    borderRadius: '24px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Background decorative emoji */}
                  <motion.div
                    animate={{
                      y: [0, -20, 0],
                      rotate: [0, 10, 0],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    style={{
                      position: 'absolute',
                      top: '20px',
                      right: '20px',
                      fontSize: '4rem',
                      opacity: 0.08,
                      pointerEvents: 'none',
                    }}
                  >
                    🍔
                  </motion.div>

                  <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>
                    What are you craving right now? 🤤
                  </h3>

                  <form onSubmit={handleConvert}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        type="text"
                        placeholder="e.g., pizza, burger, chocolate, ice cream..."
                        value={craving}
                        onChange={(e) => setCraving(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: '250px',
                          padding: '16px',
                          borderRadius: '12px',
                          border: '2px solid rgba(0,0,0,0.1)',
                          background: 'rgba(255,255,255,0.5)',
                          fontSize: '1rem',
                          transition: 'border 0.2s',
                        }}
                      />
                      <motion.button
                        type="submit"
                        className="btn-primary"
                        disabled={converting}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          padding: '16px 32px',
                          opacity: converting ? 0.7 : 1,
                          cursor: converting ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {converting ? (
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{ display: 'inline-block' }}
                          >
                            🔄
                          </motion.span>
                        ) : '🔄'} {converting ? ' Converting...' : ' Convert'}
                      </motion.button>
                    </div>
                  </form>

                  {/* Quick cravings with playful animation */}
                  <div>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '12px' }}>
                      ⚡ Or pick a common craving:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {quickCravings.map((c, i) => (
                        <motion.button
                          key={c.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          whileHover={{ scale: 1.1, y: -3 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setCraving(c.name);
                            handleConvert(undefined, c.name);
                          }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: craving === c.name ? '2px solid #EF4444' : '1px solid rgba(239,68,68,0.3)',
                            background: craving === c.name ? '#EF4444' : 'transparent',
                            color: craving === c.name ? 'white' : '#0F172A',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>{c.emoji}</span>
                          {c.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Loading animation while converting */}
                <AnimatePresence>
                  {converting && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="glass"
                      style={{
                        marginTop: '24px',
                        padding: '40px',
                        borderRadius: '24px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
                        {['🍕', '🍔', '🍫', '🍟'].map((emoji, i) => (
                          <motion.span
                            key={i}
                            animate={{
                              y: [0, -20, 0],
                              scale: [1, 1.2, 1],
                            }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.15,
                            }}
                            style={{ fontSize: '2.5rem' }}
                          >
                            {emoji}
                          </motion.span>
                        ))}
                      </div>
                      <motion.p
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ fontSize: '1.1rem', fontWeight: '500' }}
                      >
                        Finding a healthy alternative... 🧠
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Result */}
                <AnimatePresence>
                  {result && !converting && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ duration: 0.5 }}
                      style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                    >
                      {/* Comparison Card */}
                      <motion.div
                        className="glass"
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                        style={{ padding: '32px', borderRadius: '24px' }}
                      >
                        <motion.h2
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          style={{ fontSize: '1.6rem', marginBottom: '20px' }}
                        >
                          ✨ Healthy Alternative: <span style={{ color: '#22C55E' }}>{result.healthyAlternative}</span>
                        </motion.h2>

                        {/* Calorie Comparison */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto 1fr',
                            gap: '16px',
                            alignItems: 'center',
                            marginBottom: '24px',
                          }}
                        >
                          {/* Original */}
                          <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            whileHover={{ scale: 1.03 }}
                            style={{
                              textAlign: 'center',
                              padding: '20px',
                              borderRadius: '16px',
                              background: 'rgba(239,68,68,0.08)',
                              border: '2px solid rgba(239,68,68,0.2)',
                            }}
                          >
                            <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>❌ Original</p>
                            <p
                              style={{
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                margin: '6px 0',
                                textTransform: 'capitalize',
                              }}
                            >
                              {result.craving}
                            </p>
                            <motion.p
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                              style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: '#EF4444' }}
                            >
                              {result.originalCalories}
                            </motion.p>
                            <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '4px 0 0' }}>kcal / 100g</p>
                          </motion.div>

                          {/* Animated Arrow */}
                          <motion.div
                            animate={{ x: [0, 10, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            style={{ fontSize: '2rem', textAlign: 'center' }}
                          >
                            →
                          </motion.div>

                          {/* Healthy */}
                          <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            whileHover={{ scale: 1.03 }}
                            style={{
                              textAlign: 'center',
                              padding: '20px',
                              borderRadius: '16px',
                              background: 'rgba(34,197,94,0.08)',
                              border: '2px solid rgba(34,197,94,0.2)',
                            }}
                          >
                            <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>✅ Healthy</p>
                            <p style={{ fontSize: '0.95rem', fontWeight: '600', margin: '6px 0' }}>
                              {result.healthyAlternative.split('(')[0].trim()}
                            </p>
                            <motion.p
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                              style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: '#22C55E' }}
                            >
                              {result.healthyCalories}
                            </motion.p>
                            <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '4px 0 0' }}>kcal / 100g</p>
                          </motion.div>
                        </div>

                        {/* Savings Banner with pulse */}
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                          style={{
                            padding: '20px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #22C55E20, #10B98120)',
                            border: '2px solid #22C55E60',
                            textAlign: 'center',
                            marginBottom: '20px',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          <motion.div
                            animate={{
                              x: ['-100%', '200%'],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 1,
                              ease: 'easeInOut',
                            }}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '50%',
                              height: '100%',
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                              pointerEvents: 'none',
                            }}
                          />
                          <motion.p
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: '#22C55E' }}
                          >
                            🎉 You save {result.caloriesSaved} calories!
                          </motion.p>
                          <p style={{ fontSize: '0.9rem', opacity: 0.7, margin: '6px 0 0' }}>
                            That's{' '}
                            <strong>
                              {Math.round((result.caloriesSaved / result.originalCalories) * 100)}%
                            </strong>{' '}
                            fewer calories 💪
                          </p>
                        </motion.div>

                        {/* Meta Info */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '12px',
                            marginBottom: '20px',
                          }}
                        >
                          {[
                            { icon: '⏱️', label: 'Cooking Time', value: `${result.cookingTime} min`, delay: 0.7 },
                            { icon: '💪', label: 'Protein', value: `${result.nutrition.protein}g`, delay: 0.8 },
                            { icon: '🍞', label: 'Carbs', value: `${result.nutrition.carbs}g`, delay: 0.9 },
                            { icon: '🌾', label: 'Fiber', value: `${result.nutrition.fiber}g`, delay: 1.0 },
                          ].map((item, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: item.delay }}
                              whileHover={{ scale: 1.05, y: -3 }}
                              style={{
                                textAlign: 'center',
                                padding: '12px',
                                background: 'rgba(0,0,0,0.03)',
                                borderRadius: '12px',
                              }}
                            >
                              <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>
                                {item.icon} {item.label}
                              </p>
                              <p style={{ fontSize: '1.2rem', fontWeight: '700', margin: '4px 0 0' }}>
                                {item.value}
                              </p>
                            </motion.div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={saveResult}
                            className="btn-primary"
                            disabled={saving}
                          >
                            {saving ? 'Saving...' : '💾 Save Recipe'}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setResult(null);
                              setCraving('');
                            }}
                            className="btn-outline"
                          >
                            🔄 Convert Another
                          </motion.button>
                        </div>
                      </motion.div>

                      {/* Ingredients with staggered animation */}
                      <motion.div
                        className="glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{ padding: '32px', borderRadius: '24px' }}
                      >
                        <h3 style={{ marginBottom: '16px', fontSize: '1.3rem' }}>🛒 Ingredients</h3>
                        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '2.2' }}>
                          {result.ingredients.map((ing: string, i: number) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + i * 0.05 }}
                              style={{ fontSize: '0.95rem' }}
                            >
                              {ing}
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>

                      {/* Steps with staggered animation */}
                      <motion.div
                        className="glass"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        style={{ padding: '32px', borderRadius: '24px' }}
                      >
                        <h3 style={{ marginBottom: '16px', fontSize: '1.3rem' }}>👨‍🍳 Recipe Steps</h3>
                        <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '2' }}>
                          {result.steps.map((step: string, i: number) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6 + i * 0.06 }}
                              style={{ fontSize: '0.95rem', marginBottom: '10px' }}
                            >
                              {step}
                            </motion.li>
                          ))}
                        </ol>
                      </motion.div>

                      {/* Tips with border animation */}
                      {result.tips.length > 0 && (
                        <motion.div
                          className="glass"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                          style={{
                            padding: '32px',
                            borderRadius: '24px',
                            borderLeft: '4px solid #22C55E',
                          }}
                        >
                          <h3 style={{ marginBottom: '16px', fontSize: '1.3rem' }}>💡 Pro Tips</h3>
                          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '2.2' }}>
                            {result.tips.map((tip: string, i: number) => (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + i * 0.06 }}
                                style={{ fontSize: '0.95rem' }}
                              >
                                {tip}
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ============ SAVED TAB ============ */}
            {activeTab === 'saved' && (
              <motion.div
                key="saved"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="glass"
                style={{ padding: '32px', borderRadius: '24px' }}
              >
                <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>📁 Your Saved Recipes</h2>

                {savedEntries.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: 'center', padding: '60px 20px' }}
                  >
                    <motion.div
                      animate={{ y: [0, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ fontSize: '5rem', marginBottom: '16px' }}
                    >
                      🍽️
                    </motion.div>
                    <p style={{ opacity: 0.7, fontSize: '1.05rem' }}>
                      No saved recipes yet.
                    </p>
                    <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>
                      Convert a craving and save the healthy alternative!
                    </p>
                  </motion.div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '16px',
                    }}
                  >
                    {savedEntries.map((entry: any, i: number) => (
                      <motion.div
                        key={entry._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                        className="glass"
                        style={{
                          padding: '20px',
                          borderRadius: '16px',
                          borderLeft: '4px solid #22C55E',
                          cursor: 'pointer',
                        }}
                      >
                        <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>
                          You craved:{' '}
                          <strong style={{ textTransform: 'capitalize' }}>{entry.craving}</strong>
                        </p>
                        <h4 style={{ fontSize: '1.05rem', margin: '6px 0 12px' }}>
                          ✨ {entry.healthyAlternative}
                        </h4>
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap',
                            marginBottom: '12px',
                            fontSize: '0.85rem',
                          }}
                        >
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              background: '#EF444420',
                              color: '#EF4444',
                            }}
                          >
                            {entry.originalCalories} → {entry.healthyCalories} kcal
                          </span>
                          <motion.span
                            animate={{ scale: [1, 1.08, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              background: '#22C55E20',
                              color: '#22C55E',
                              fontWeight: '600',
                            }}
                          >
                            -{entry.caloriesSaved} cal
                          </motion.span>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              background: 'rgba(0,0,0,0.05)',
                            }}
                          >
                            ⏱️ {entry.cookingTime}m
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setResult(entry);
                              setEntryId(entry._id);
                              setActiveTab('convert');
                            }}
                            className="btn-outline"
                            style={{ padding: '6px 16px', fontSize: '0.85rem', flex: 1 }}
                          >
                            View Recipe
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteEntry(entry._id)}
                            className="btn-outline"
                            style={{
                              padding: '6px 16px',
                              fontSize: '0.85rem',
                              borderColor: '#EF4444',
                              color: '#EF4444',
                            }}
                          >
                            🗑
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fun Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{
              textAlign: 'center',
              marginTop: '40px',
              opacity: 0.6,
              fontSize: '0.9rem',
            }}
          >
            <motion.p
              animate={{
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              💡 Tip: Even healthy alternatives should be eaten in moderation!
            </motion.p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}