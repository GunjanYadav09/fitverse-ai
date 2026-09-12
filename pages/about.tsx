import Layout from '@/components/Layout';

export default function About() {
  return (
    <Layout title="About - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container">
          <h1 className="section-title">About FitVerse AI</h1>
          <div className="vision-grid">
            <div>
              <h2>Our Vision</h2>
              <p style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>
                We believe everyone deserves access to a personal trainer, nutritionist, meal planner, and wellness coach. 
                FitVerse AI combines Artificial Intelligence with personalized health guidance to help you eat smarter, 
                train better, sleep well, and build lifelong habits.
              </p>
            </div>
            <div className="glass" style={{ padding: '32px', borderRadius: '32px' }}>
              <h3>Why FitVerse AI?</h3>
              <p>Most fitness apps only count calories. Most diet apps only create meal plans. Most workout apps only show exercises.</p>
              <p style={{ marginTop: '16px' }}>FitVerse AI combines all of these into one intelligent platform that understands you, learns from you, and grows with you.</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}