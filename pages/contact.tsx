import Layout from '@/components/Layout';

export default function Contact() {
  return (
    <Layout title="Contact - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container">
          <h1 className="section-title" style={{ textAlign: 'center' }}>Get in Touch</h1>
          <div className="vision-grid" style={{ marginTop: '40px' }}>
            <div>
              <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
                <h3>Send us a message</h3>
                <form style={{ marginTop: '20px' }}>
                  <input 
                    type="text" 
                    placeholder="Your Name" 
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      marginBottom: '12px', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.5)',
                      fontSize: '1rem'
                    }} 
                  />
                  <input 
                    type="email" 
                    placeholder="Your Email" 
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      marginBottom: '12px', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.5)',
                      fontSize: '1rem'
                    }} 
                  />
                  <textarea 
                    placeholder="Your Message" 
                    rows={4}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      marginBottom: '12px', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.5)',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }} 
                  />
                  <button className="btn-primary" style={{ width: '100%' }}>Send Message</button>
                </form>
              </div>
            </div>
            <div>
              <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
                <h3>Contact Information</h3>
                <p style={{ marginTop: '16px' }}>📧 support@fitverseai.com</p>
                <p>📱 +1 (555) 123-4567</p>
                <p>📍 San Francisco, CA</p>
                <div style={{ marginTop: '24px' }}>
                  <h4>Follow us</h4>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                    <a href="#" style={{ fontSize: '1.5rem' }}>📷</a>
                    <a href="#" style={{ fontSize: '1.5rem' }}>🔗</a>
                    <a href="#" style={{ fontSize: '1.5rem' }}>🐙</a>
                    <a href="#" style={{ fontSize: '1.5rem' }}>🐦</a>
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