import Layout from '@/components/Layout';
import { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { q: 'What is FitVerse AI?', a: 'FitVerse AI is your personal AI health companion that combines fitness coaching, nutrition planning, and wellness tracking in one platform.' },
    { q: 'Is FitVerse AI free?', a: 'Yes, we offer a free plan with basic features. Premium plans start at $12/month for advanced features.' },
    { q: 'How does the meal scanner work?', a: 'Simply upload a photo of your meal, and our AI identifies the food and calculates calories, protein, carbs, and more.' },
    { q: 'Can I use FitVerse AI for weight loss?', a: 'Absolutely! FitVerse AI creates personalized meal plans and workout routines tailored to your weight loss goals.' },
    { q: 'Does FitVerse AI support Indian food?', a: 'Yes! We have a comprehensive Indian food database including Rajma Chawal, Poha, Idli, Dosa, and many more.' },
    { q: 'What is Aura?', a: 'Aura is your personal AI health coach that remembers your goals, preferences, and progress to provide personalized guidance.' },
  ];

  return (
    <Layout title="FAQ - FitVerse AI">
      <section style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container">
          <h1 className="section-title" style={{ textAlign: 'center' }}>Frequently Asked Questions</h1>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="glass" 
                style={{ 
                  padding: '20px 24px', 
                  marginBottom: '16px', 
                  borderRadius: '16px',
                  cursor: 'pointer'
                }}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {faq.q}
                  <span>{openIndex === index ? '▲' : '▼'}</span>
                </h3>
                {openIndex === index && (
                  <p style={{ marginTop: '12px', opacity: '0.8' }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}