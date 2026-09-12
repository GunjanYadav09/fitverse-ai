import Layout from '@/components/Layout';
import Link from 'next/link';

export default function AICoach() {
  return (
    <Layout title="AI Coach - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container">
          <h1 className="section-title">Meet Your AI Coach: Aura</h1>
          <div className="glass" style={{ padding: '40px', borderRadius: '32px', maxWidth: '700px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '2rem', marginBottom: '16px' }}>🧠 Aura</h3>
            <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
              Your Personal AI Health Coach. Aura remembers your goals, allergies, favorite foods, workout history, and even your mood patterns.
            </p>
            <div style={{ background: '#16A34A10', padding: '20px', borderRadius: '20px' }}>
              <p><strong>User:</strong> "I skipped gym today."</p>
              <p><strong>Aura:</strong> "No worries. You've completed five workouts this week. Recovery is just as important. Tomorrow we continue."</p>
            </div>
            <div style={{ marginTop: '20px' }}>
              <Link href="/chat" className="btn-primary" style={{ display: 'inline-block' }}>
                💬 Chat with Aura Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}