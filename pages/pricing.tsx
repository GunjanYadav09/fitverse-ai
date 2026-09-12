import Link from 'next/link';
import Layout from '@/components/Layout';

export default function Pricing() {
  return (
    <Layout title="Pricing - FitVerse AI">
      <section className="pricing" style={{ paddingTop: '120px' }}>
        <div className="container">
          <h1 className="section-title" style={{ textAlign: 'center' }}>Choose Your Plan</h1>
          <div className="pricing-grid">
            <div className="pricing-card"><h3>Free</h3><p style={{ fontSize: '2rem' }}>$0</p><p>Basic AI coach, meal scanner, 5 workouts</p><Link href="/signup" className="btn-outline" style={{ marginTop: '16px', display: 'inline-block' }}>Start Free</Link></div>
            <div className="pricing-card premium"><h3>Premium</h3><p style={{ fontSize: '2rem' }}>$12</p><p>Full AI, meal planner, advanced analytics, voice coach</p><Link href="/signup" className="btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>Go Premium</Link></div>
            <div className="pricing-card"><h3>Family</h3><p style={{ fontSize: '2rem' }}>$19</p><p>Up to 5 profiles, family challenges, group insights</p><Link href="/signup" className="btn-outline" style={{ marginTop: '16px', display: 'inline-block' }}>Choose Family</Link></div>
          </div>
        </div>
      </section>
    </Layout>
  );
}