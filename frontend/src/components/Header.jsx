import { NavLink } from 'react-router-dom';
import { APP_CONFIG } from '../config';
import { explorerAddressUrl, formatAddress } from '../utils/format';

export function Header({ wallet, onConnect, onSwitchNetwork }) {
  const addressHref = wallet.account ? explorerAddressUrl(wallet.account) : '#';

  return (
    <header className="topbar">
      <div className="brand-block">
        <span className="brand-kicker">Quai Network</span>
        <h1>Market Command Center</h1>
      </div>

      <nav className="nav-links">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Home
        </NavLink>
        <NavLink to="/market" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Market
        </NavLink>
        <NavLink to="/portfolio" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Portfolio
        </NavLink>
      </nav>

      <div className="wallet-block">
        {wallet.isConnected && (
          <button
            type="button"
            className={`status-pill ${wallet.isCorrectNetwork ? 'ok' : 'warn'}`}
            onClick={wallet.isCorrectNetwork ? undefined : onSwitchNetwork}
          >
            {wallet.isCorrectNetwork ? wallet.networkName : 'Wrong Network'}
          </button>
        )}

        {!wallet.isConnected ? (
          <button
            type="button"
            className="btn primary"
            onClick={onConnect}
            disabled={wallet.isConnecting || !wallet.isWalletInstalled}
          >
            {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <a className="wallet-chip" href={addressHref} target="_blank" rel="noreferrer">
            <span>{formatAddress(wallet.account)}</span>
            <small>View</small>
          </a>
        )}
      </div>

      <div className="contract-strip">
        <span>Contract:</span>
        <code>{APP_CONFIG.contractAddress || 'Not configured'}</code>
      </div>
    </header>
  );
}
