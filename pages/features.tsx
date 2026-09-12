import Layout from '@/components/Layout';

export default function Features() {
  return (
    <Layout title="Features - FitVerse AI">
      <section className="features" style={{ paddingTop: '120px' }}>
        <div className="container">
          <h1 className="section-title">AI-Powered Features</h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '40px' }}>
            Discover all the intelligent features that make FitVerse AI your ultimate health companion.
          </p>
          <div className="feature-grid">
            <div className="feature-card"><div className="feature-icon">🧠</div><h3>AI Fitness Coach</h3><p>Chat like your personal trainer.</p></div>
            <div className="feature-card"><div className="feature-icon">📸</div><h3>Meal Scanner</h3><p>Upload meal photos, AI identifies food &amp; nutrition.</p></div>
            <div className="feature-card"><div className="feature-icon">🍽️</div><h3>Personal Meal Planner</h3><p>Based on age, weight, goals, allergies &amp; more.</p></div>
            <div className="feature-card"><div className="feature-icon">🏋️</div><h3>Workout Generator</h3><p>Gym, home, weight loss, muscle building.</p></div>
            <div className="feature-card"><div className="feature-icon">💧</div><h3>Water Tracker</h3><p>Stay hydrated with smart reminders.</p></div>
            <div className="feature-card"><div className="feature-icon">😴</div><h3>Sleep Tracker</h3><p>Monitor and improve your sleep.</p></div>
            <div className="feature-card"><div className="feature-icon">📊</div><h3>Progress Analytics</h3><p>Beautiful charts &amp; insights.</p></div>
            <div className="feature-card"><div className="feature-icon">🍕</div><h3>Craving Converter</h3><p>Pizza → Healthy wheat pizza recipe.</p></div>
            <div className="feature-card"><div className="feature-icon">🛒</div><h3>AI Grocery Planner</h3><p>Auto-generates shopping lists.</p></div>
            <div className="feature-card"><div className="feature-icon">🏥</div><h3>Restaurant Health Advisor</h3><p>Upload menu, AI recommends healthiest meal.</p></div>
            <div className="feature-card"><div className="feature-icon">🎤</div><h3>Voice AI Coach</h3><p>Talk to Aura hands-free.</p></div>
            <div className="feature-card"><div className="feature-icon">🔮</div><h3>Body Transformation</h3><p>Predict your future self.</p></div>
          </div>
        </div>
      </section>
    </Layout>
  );
}