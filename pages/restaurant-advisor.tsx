import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';

export default function RestaurantAdvisor() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisineType, setCuisineType] = useState('mixed');
  const [menuText, setMenuText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchHistory();
  }, [status, router]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/restaurant-advisor');
      const data = await res.json();
      if (res.ok) setAnalyses(data.analyses || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!restaurantName.trim()) {
      toast.error('Please enter a restaurant name');
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);

    try {
      const res = await fetch('/api/restaurant-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName,
          cuisineType,
          menuText,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAnalysis(data.analysis);
        toast.success('Menu analyzed! 🏥');
        fetchHistory();
      } else {
        toast.error(data.message || 'Error analyzing');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setAnalyzing(false);
    }
  };

  const deleteAnalysis = async (id: string) => {
    if (!confirm('Delete this analysis?')) return;
    try {
      const res = await fetch('/api/restaurant-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', analysisId: id }),
      });
      if (res.ok) {
        toast.success('Deleted');
        fetchHistory();
      }
    } catch (error) {
      toast.error('Error deleting');
    }
  };

  const quickRestaurants = [
    { name: 'Domino\'s Pizza', emoji: '🍕' },
    { name: 'McDonald\'s', emoji: '🍔' },
    { name: 'Subway', emoji: '🥪' },
    { name: 'Indian Restaurant', emoji: '🍛' },
    { name: 'Chinese Wok', emoji: '🥢' },
    { name: 'Cafe Coffee', emoji: '☕' },
  ];

  const verdictConfig: any = {
    excellent: { color: '#22C55E', label: 'Excellent', icon: '✅' },
    good: { color: '#3B82F6', label: 'Good', icon: '👍' },
    moderate: { color: '#F59E0B', label: 'Moderate', icon: '⚠️' },
    avoid: { color: '#EF4444', label: 'Avoid', icon: '❌' },
  };

  if (status === 'loading' || loading) {
    return (
      <Layout title="Restaurant Advisor">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '20px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: '4rem' }}
          >
            🏥
          </motion.div>
          <p style={{ opacity: 0.7 }}>Loading advisor...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <Layout title="Restaurant Health Advisor - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
            <motion.h1 className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
              <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                🏥
              </motion.span>
              Restaurant Health Advisor
            </motion.h1>
            <p style={{ opacity: 0.7 }}>Let AI find the healthiest options on any menu</p>
          </motion.div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '12px', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('analyze')}
              style={{
                padding: '8px 20px', borderRadius: '20px', border: 'none',
                background: activeTab === 'analyze' ? '#10B981' : 'transparent',
                color: activeTab === 'analyze' ? 'white' : '#0F172A',
                cursor: 'pointer', fontWeight: '500',
              }}
            >
              🔍 Analyze Menu
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('history')}
              style={{
                padding: '8px 20px', borderRadius: '20px', border: 'none',
                background: activeTab === 'history' ? '#10B981' : 'transparent',
                color: activeTab === 'history' ? 'white' : '#0F172A',
                cursor: 'pointer', fontWeight: '500',
              }}
            >
              📁 History ({analyses.length})
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'analyze' && (
              <motion.div
                key="analyze"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Input Card */}
                <div className="glass" style={{ padding: '32px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                  <motion.div
                    animate={{ y: [0, -15, 0], rotate: [0, 8, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    style={{
                      position: 'absolute', top: '20px', right: '20px',
                      fontSize: '4rem', opacity: 0.08, pointerEvents: 'none',
                    }}
                  >
                    🍽️
                  </motion.div>

                  <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>
                    Which restaurant are you visiting? 🍴
                  </h3>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', fontSize: '0.9rem' }}>
                      Restaurant Name *
                    </label>
                    <input
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      placeholder="e.g., Domino's Pizza, McDonald's, local Indian restaurant..."
                      style={{
                        width: '100%', padding: '14px', borderRadius: '12px',
                        border: '2px solid rgba(0,0,0,0.1)',
                        background: 'rgba(255,255,255,0.5)', fontSize: '1rem',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', fontSize: '0.9rem' }}>
                      Cuisine Type (optional)
                    </label>
                    <select
                      value={cuisineType}
                      onChange={(e) => setCuisineType(e.target.value)}
                      style={{
                        width: '100%', padding: '14px', borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        background: 'rgba(255,255,255,0.5)', fontSize: '1rem',
                      }}
                    >
                      <option value="mixed">Mixed</option>
                      <option value="italian">Italian</option>
                      <option value="fast-food">Fast Food</option>
                      <option value="indian">Indian</option>
                      <option value="chinese">Chinese</option>
                      <option value="continental">Continental</option>
                      <option value="cafe">Cafe</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px', fontSize: '0.9rem' }}>
                      Paste Menu (optional)
                    </label>
                    <textarea
                      rows={4}
                      value={menuText}
                      onChange={(e) => setMenuText(e.target.value)}
                      placeholder="Paste menu items here (one per line) for more accurate analysis..."
                      style={{
                        width: '100%', padding: '12px', borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        background: 'rgba(255,255,255,0.5)', fontSize: '0.95rem',
                        resize: 'vertical', fontFamily: 'inherit',
                      }}
                    />
                    <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '4px' }}>
                      💡 We'll use our built-in database if no menu is pasted.
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAnalyze}
                    className="btn-primary"
                    disabled={analyzing}
                    style={{
                      width: '100%', padding: '16px', fontSize: '1.05rem',
                      opacity: analyzing ? 0.7 : 1,
                      cursor: analyzing ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {analyzing ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          style={{ display: 'inline-block', marginRight: '8px' }}
                        >
                          🔄
                        </motion.span>
                        Analyzing...
                      </>
                    ) : '🏥 Analyze Menu'}
                  </motion.button>

                  {/* Quick Restaurants */}
                  <div style={{ marginTop: '20px' }}>
                    <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '10px' }}>
                      ⚡ Or try a common restaurant:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {quickRestaurants.map((r) => (
                        <motion.button
                          key={r.name}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setRestaurantName(r.name);
                            setTimeout(() => handleAnalyze(), 100);
                          }}
                          style={{
                            padding: '8px 14px', borderRadius: '20px',
                            border: '1px solid rgba(16,185,129,0.3)',
                            background: 'transparent', cursor: 'pointer',
                            fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px',
                          }}
                        >
                          <span>{r.emoji}</span> {r.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Loading state */}
                <AnimatePresence>
                  {analyzing && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="glass"
                      style={{ marginTop: '24px', padding: '40px', borderRadius: '24px', textAlign: 'center' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
                        {['🍽️', '🥗', '🥑', '🍗'].map((emoji, i) => (
                          <motion.span
                            key={i}
                            animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
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
                        Analyzing menu for healthy options... 🧠
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Analysis Result */}
                <AnimatePresence>
                  {analysis && !analyzing && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                    >
                      {/* Summary Card */}
                      <div
                        className="glass"
                        style={{
                          padding: '32px', borderRadius: '24px',
                          background: 'linear-gradient(135deg, #10B98115, transparent)',
                          border: '2px solid #10B98140',
                        }}
                      >
                        <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>
                          🏥 {analysis.restaurantName}
                        </h2>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '16px' }}>
                          Cuisine: {analysis.cuisineType} | Goal: {analysis.userGoal?.replace(/-/g, ' ')}
                        </p>
                        <p style={{ fontSize: '1.05rem', lineHeight: '1.6', margin: 0 }}>
                          {analysis.summary}
                        </p>
                      </div>

                      {/* Recommended */}
                      {analysis.recommended?.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="glass"
                          style={{ padding: '28px', borderRadius: '24px', borderLeft: '4px solid #22C55E' }}
                        >
                          <h3 style={{ marginBottom: '16px', fontSize: '1.25rem', color: '#22C55E' }}>
                            ✅ Recommended for you ({analysis.recommended.length})
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {analysis.recommended.map((item: any, i: number) => (
                              <MenuItemCard key={i} item={item} verdictConfig={verdictConfig} index={i} />
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Alternatives */}
                      {analysis.alternatives?.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="glass"
                          style={{ padding: '28px', borderRadius: '24px', borderLeft: '4px solid #F59E0B' }}
                        >
                          <h3 style={{ marginBottom: '16px', fontSize: '1.25rem', color: '#F59E0B' }}>
                            ⚠️ Okay occasionally ({analysis.alternatives.length})
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {analysis.alternatives.map((item: any, i: number) => (
                              <MenuItemCard key={i} item={item} verdictConfig={verdictConfig} index={i} />
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Avoid */}
                      {analysis.avoid?.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="glass"
                          style={{ padding: '28px', borderRadius: '24px', borderLeft: '4px solid #EF4444' }}
                        >
                          <h3 style={{ marginBottom: '16px', fontSize: '1.25rem', color: '#EF4444' }}>
                            ❌ Avoid ({analysis.avoid.length})
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {analysis.avoid.map((item: any, i: number) => (
                              <MenuItemCard key={i} item={item} verdictConfig={verdictConfig} index={i} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass"
                style={{ padding: '32px', borderRadius: '24px' }}
              >
                <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>📁 Past Analyses</h2>
                {analyses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <motion.div
                      animate={{ y: [0, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ fontSize: '5rem', marginBottom: '16px' }}
                    >
                      🏥
                    </motion.div>
                    <p style={{ opacity: 0.7 }}>No analyses yet.</p>
                    <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>
                      Analyze a restaurant menu to see it here!
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {analyses.map((a: any, i: number) => (
                      <motion.div
                        key={a._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ x: 4 }}
                        className="glass"
                        style={{
                          padding: '16px 20px', borderRadius: '16px',
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', flexWrap: 'wrap', gap: '12px',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <p style={{ fontWeight: '600', margin: 0 }}>🏥 {a.restaurantName}</p>
                          <p style={{ opacity: 0.7, fontSize: '0.85rem', margin: '4px 0 0' }}>
                            {a.cuisineType} • {a.recommended?.length || 0} recommended •{' '}
                            {new Date(a.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setAnalysis(a);
                              setActiveTab('analyze');
                            }}
                            className="btn-outline"
                            style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                          >
                            View
                          </button>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteAnalysis(a._id)}
                            className="btn-outline"
                            style={{ padding: '6px 16px', fontSize: '0.85rem', borderColor: '#EF4444', color: '#EF4444' }}
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
        </div>
      </section>
    </Layout>
  );
}

// ============================================================
// MENU ITEM CARD COMPONENT
// ============================================================

function MenuItemCard({ item, verdictConfig, index }: any) {
  const config = verdictConfig[item.verdict] || verdictConfig.moderate;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ scale: 1.01 }}
      style={{
        padding: '16px 20px',
        borderRadius: '14px',
        background: `${config.color}0D`,
        border: `1px solid ${config.color}30`,
        borderLeft: `4px solid ${config.color}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <p style={{ margin: 0, fontWeight: '600', fontSize: '1rem' }}>
            {config.icon} {item.name}
          </p>
          <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '0.85rem' }}>
            {item.reason}
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px', fontSize: '0.85rem', opacity: 0.85 }}>
            <span>🔥 {item.calories} kcal</span>
            <span>💪 {item.protein}g protein</span>
            <span>🍞 {item.carbs}g carbs</span>
            <span>🥑 {item.fat}g fat</span>
            {item.fiber > 0 && <span>🌾 {item.fiber}g fiber</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>Health Score</p>
          <p style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: '800', color: config.color }}>
            {item.healthScore}
          </p>
        </div>
      </div>
    </motion.div>
  );
}