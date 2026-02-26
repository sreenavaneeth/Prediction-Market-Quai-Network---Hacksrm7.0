import { useState } from 'react';

export function HowItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <section className="card">
      <button type="button" className="accordion-trigger" onClick={() => setOpen((v) => !v)}>
        <span>How this market works</span>
        <strong>{open ? '-' : '+'}</strong>
      </button>

      {open && (
        <div className="accordion-body">
          <p>
            This market is binary. You buy YES or NO before deadline. After deadline, owner resolves
            the outcome on-chain.
          </p>
          <ul>
            <li>Winners claim original stake plus share of losing pool.</li>
            <li>Payout formula: <code>yourBet * totalPool / winningPool</code>.</li>
            <li>No off-chain custody. Funds remain in contract logic until claim.</li>
          </ul>
        </div>
      )}
    </section>
  );
}
