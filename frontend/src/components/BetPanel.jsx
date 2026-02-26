import { useMemo, useState } from 'react';
import { APP_CONFIG } from '../config';
import { calcPayoutPreview, parseTokenInput } from '../utils/format';

const QUICK_AMOUNTS = ['0.1', '0.5', '1'];

export function BetPanel({
  wallet,
  market,
  status,
  totalPool,
  onBet,
  isActionRunning,
}) {
  const [yesAmount, setYesAmount] = useState('');
  const [noAmount, setNoAmount] = useState('');
  const [pendingSide, setPendingSide] = useState('');

  const isBetDisabled = !wallet.isConnected || !wallet.isCorrectNetwork || status !== 'open' || isActionRunning;

  const yesPreview = useMemo(() => {
    const wei = parseTokenInput(yesAmount);
    if (!wei) return '0.0000';
    const sidePool = (market.yesPool || 0n) + wei;
    const afterTotal = (totalPool || 0n) + wei;
    return calcPayoutPreview(wei, sidePool, afterTotal);
  }, [yesAmount, market.yesPool, totalPool]);

  const noPreview = useMemo(() => {
    const wei = parseTokenInput(noAmount);
    if (!wei) return '0.0000';
    const sidePool = (market.noPool || 0n) + wei;
    const afterTotal = (totalPool || 0n) + wei;
    return calcPayoutPreview(wei, sidePool, afterTotal);
  }, [noAmount, market.noPool, totalPool]);

  const placeYes = async () => {
    setPendingSide('yes');
    try {
      const result = await onBet('yes', yesAmount);
      if (result?.success) setYesAmount('');
    } finally {
      setPendingSide('');
    }
  };

  const placeNo = async () => {
    setPendingSide('no');
    try {
      const result = await onBet('no', noAmount);
      if (result?.success) setNoAmount('');
    } finally {
      setPendingSide('');
    }
  };

  return (
    <section className="card">
      <h3>Bet Panel</h3>
      <p className="subtle-text">Choose a side, size your position, and review potential payout.</p>

      {!wallet.isConnected && <div className="notice">Connect wallet to place bets.</div>}
      {wallet.isConnected && !wallet.isCorrectNetwork && (
        <div className="notice warn">Wrong network. Switch to {APP_CONFIG.chainName} first.</div>
      )}
      {status === 'awaiting_resolution' && (
        <div className="notice">Market closed for new bets. Waiting for owner resolution.</div>
      )}
      {status === 'resolved' && (
        <div className="notice">Market already resolved. No new bets allowed.</div>
      )}

      <div className="bet-columns">
        <article className="bet-card yes">
          <header>
            <h4>Buy YES</h4>
            <small>Long the outcome</small>
          </header>

          <input
            type="number"
            min="0"
            step="0.0001"
            value={yesAmount}
            onChange={(event) => setYesAmount(event.target.value)}
            placeholder={`Amount in ${APP_CONFIG.currencySymbol}`}
            disabled={isBetDisabled}
          />

          <div className="chip-row">
            {QUICK_AMOUNTS.map((chip) => (
              <button
                type="button"
                key={`yes-${chip}`}
                className="chip"
                onClick={() => setYesAmount(chip)}
                disabled={isBetDisabled}
              >
                {chip}
              </button>
            ))}
          </div>

          <p className="payout-text">
            Potential payout: <strong>{yesPreview} {APP_CONFIG.currencySymbol}</strong>
          </p>

          <button
            type="button"
            className="btn yes"
            onClick={placeYes}
            disabled={isBetDisabled || !parseTokenInput(yesAmount)}
          >
            {isActionRunning && pendingSide === 'yes' ? (
              <span className="btn-with-spinner"><span className="spinner tiny" /> Processing...</span>
            ) : (
              'Buy YES'
            )}
          </button>
        </article>

        <article className="bet-card no">
          <header>
            <h4>Buy NO</h4>
            <small>Short the outcome</small>
          </header>

          <input
            type="number"
            min="0"
            step="0.0001"
            value={noAmount}
            onChange={(event) => setNoAmount(event.target.value)}
            placeholder={`Amount in ${APP_CONFIG.currencySymbol}`}
            disabled={isBetDisabled}
          />

          <div className="chip-row">
            {QUICK_AMOUNTS.map((chip) => (
              <button
                type="button"
                key={`no-${chip}`}
                className="chip"
                onClick={() => setNoAmount(chip)}
                disabled={isBetDisabled}
              >
                {chip}
              </button>
            ))}
          </div>

          <p className="payout-text">
            Potential payout: <strong>{noPreview} {APP_CONFIG.currencySymbol}</strong>
          </p>

          <button
            type="button"
            className="btn no"
            onClick={placeNo}
            disabled={isBetDisabled || !parseTokenInput(noAmount)}
          >
            {isActionRunning && pendingSide === 'no' ? (
              <span className="btn-with-spinner"><span className="spinner tiny" /> Processing...</span>
            ) : (
              'Buy NO'
            )}
          </button>
        </article>
      </div>
    </section>
  );
}
