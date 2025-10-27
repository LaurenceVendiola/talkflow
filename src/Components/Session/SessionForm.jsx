import React from 'react';
import './Session.css';
import Sidebar from '../Sidebar/Sidebar';

export default function SessionForm() {
  const text = `When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow. The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon. There is, according to legend, a boiling pot of gold at one end. People look, but no one ever finds it. When a man looks for something beyond his reach, his friends say he is looking for the pot of gold at the end of the rainbow. Throughout the centuries people have explained the rainbow in various ways. Some have accepted it as a miracle without physical explanation. To the Hebrews it was a token that there would be no more universal floods.`;

  const results = [
    { label: 'Sound Repetition', value: 5 },
    { label: 'Word Repetition', value: 9 },
    { label: 'Prolongation', value: 9 },
    { label: 'Blocks', value: 9 }
  ];

  return (
    <div className="with-sidebar">
      <Sidebar />
      <div className="session-root">
      <header className="session-header">
        <div>
          <h1>Speech Analysis</h1>
          <p className="session-sub">Start their journey to confident speech — upload or record a sample.</p>
        </div>
        <div className="session-avatar"><div className="avatar-circle">M</div></div>
      </header>

      <main>
        <section className="transcript">
          <div className="transcript-card">
            <p>{text}</p>
          </div>
        </section>

        <section className="results">
          <h3>Results</h3>
          <div className="results-grid">
            {results.map((r) => (
              <div className="result-card" key={r.label}>
                <div className="result-label">{r.label}</div>
                <div className="result-value">{r.value}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
      </div>
    </div>
  );
}
