import { useWallet } from '../hooks/useWallet.js';
import { shortAddress } from '../utils/format.js';
import Button from './Button.jsx';
import './WalletButton.css';

/**
 * Connect / disconnect button for the mock Stellar wallet.
 * Shows the truncated address once connected.
 */
export default function WalletButton() {
  const { account, isConnected, connecting, connect, disconnect } = useWallet();

  if (isConnected) {
    return (
      <div className="wallet-button">
        <span className="wallet-button__addr" title={account.address}>
          <span className="wallet-button__dot" role="img" aria-label="Connected status" />
          {shortAddress(account.address)}
        </span>
        <Button variant="ghost" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={connect} loading={connecting}>
      Connect Wallet
    </Button>
  );
}
