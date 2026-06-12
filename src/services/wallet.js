import { withLatency } from './api.js';

/**
 * Mock Stellar wallet service.
 * Pretends to connect to a browser wallet (e.g. Freighter) but just returns
 * a deterministic fake account after a short delay.
 */

const MOCK_ACCOUNT = {
  address: 'GCQYWQ3LSTREAMPAYDEMOACCOUNT00000000000000000000000000XQ',
  network: 'TESTNET',
  balances: [
    { token: 'XLM', amount: 4210.5 },
    { token: 'USDC', amount: 12500 },
    { token: 'EURC', amount: 3200 },
    { token: 'yXLM', amount: 980.25 },
  ],
};

const STORAGE_KEY = 'streampay.wallet.connected';

/**
 * Connect the mock wallet. Persists a flag so reloads stay connected.
 * @returns {Promise<typeof MOCK_ACCOUNT>}
 */
export async function connectWallet() {
  const account = await withLatency(MOCK_ACCOUNT, 500);
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch (e) {
    /* ignore storage errors */
  }
  return account;
}

/**
 * Disconnect the mock wallet and clear persistence.
 * @returns {Promise<void>}
 */
export async function disconnectWallet() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    /* ignore */
  }
  return withLatency(undefined, 200);
}

/**
 * Whether a previous session left the wallet connected.
 * @returns {boolean}
 */
export function wasConnected() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch (e) {
    return false;
  }
}

/**
 * Re-read the mock account (used on reload when wasConnected is true).
 * @returns {Promise<typeof MOCK_ACCOUNT>}
 */
export async function restoreWallet() {
  return withLatency(MOCK_ACCOUNT, 300);
}
