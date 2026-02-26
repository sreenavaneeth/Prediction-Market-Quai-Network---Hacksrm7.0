import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ethers } from 'ethers';
import { APP_CONFIG, CHAIN_HEX } from '../config';

const CONNECT_TIMEOUT_MS = 45000;
const REQUEST_TIMEOUT_MS = 12000;
const ACCOUNTS_TIMEOUT_MS = 3500;
const CHAIN_TIMEOUT_MS = 5000;

const QUAI_FALLBACKS = {
  eth_accounts: ['quai_accounts', 'eth_accounts'],
  eth_requestAccounts: ['quai_requestAccounts', 'eth_requestAccounts'],
  eth_chainId: ['quai_chainId', 'eth_chainId'],
  eth_blockNumber: ['quai_blockNumber', 'eth_blockNumber'],
  eth_getBalance: ['quai_getBalance', 'eth_getBalance'],
  eth_getTransactionCount: ['quai_getTransactionCount', 'eth_getTransactionCount'],
  eth_getCode: ['quai_getCode', 'eth_getCode'],
  eth_call: ['quai_call', 'eth_call'],
  eth_estimateGas: ['quai_estimateGas', 'eth_estimateGas'],
  eth_gasPrice: ['quai_gasPrice', 'eth_gasPrice'],
  eth_maxPriorityFeePerGas: ['quai_maxPriorityFeePerGas', 'eth_maxPriorityFeePerGas'],
  eth_getBlockByNumber: ['quai_getBlockByNumber', 'eth_getBlockByNumber'],
  eth_getTransactionByHash: ['quai_getTransactionByHash', 'eth_getTransactionByHash'],
  eth_getTransactionReceipt: ['quai_getTransactionReceipt', 'eth_getTransactionReceipt'],
  eth_getLogs: ['quai_getLogs', 'eth_getLogs'],
  eth_sendTransaction: ['quai_sendTransaction', 'eth_sendTransaction'],
};

function parseChainId(rawChainId) {
  if (rawChainId === null || rawChainId === undefined) return null;
  if (typeof rawChainId === 'number') return Number.isFinite(rawChainId) ? rawChainId : null;

  const value = String(rawChainId).trim().toLowerCase();
  if (!value) return null;

  if (value.startsWith('0x')) {
    const parsedHex = Number.parseInt(value, 16);
    return Number.isFinite(parsedHex) ? parsedHex : null;
  }

  if (/^\d+$/.test(value)) {
    const parsedDec = Number.parseInt(value, 10);
    return Number.isFinite(parsedDec) ? parsedDec : null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function createPelagusShim(provider) {
  return {
    ...provider,
    isPelagus: true,
    request: async ({ method, params = [] }) => {
      const methods = QUAI_FALLBACKS[method] || [method];
      let lastError = null;

      for (const m of methods) {
        try {
          return await provider.request({ method: m, params });
        } catch (error) {
          lastError = error;
          const code = Number(error?.code);
          const msg = String(error?.message || '').toLowerCase();
          const methodMissing = code === -32601 || msg.includes('method not found') || msg.includes('unsupported');
          if (!methodMissing || m === methods[methods.length - 1]) {
            throw error;
          }
        }
      }

      throw lastError || new Error(`Provider request failed for ${method}`);
    },
    on: provider.on?.bind(provider),
    removeListener: provider.removeListener?.bind(provider),
  };
}

function getInjectedProviders() {
  if (typeof window === 'undefined') return [];

  const providers = [];

  if (window.pelagus) {
    providers.push(createPelagusShim(window.pelagus));
  }

  if (window.ethereum) {
    const { ethereum } = window;
    if (Array.isArray(ethereum.providers) && ethereum.providers.length > 0) {
      for (const p of ethereum.providers) {
        if (p === window.pelagus) continue;
        providers.push(p);
      }
    } else if (ethereum !== window.pelagus) {
      providers.push(ethereum);
    }
  }

  return providers;
}

function pickPreferredProvider(providers) {
  if (!providers.length) return null;
  return providers[0];
}

function scoreProvider(provider) {
  let score = 0;
  if (provider?.isPelagus) score += 200;
  if (provider?.isMetaMask) score += 50;
  if (provider?.isBraveWallet) score -= 20;
  if (provider?.isRabby) score -= 5;
  return score;
}

function getOrderedProviders() {
  const providers = getInjectedProviders();
  return [...providers].sort((a, b) => scoreProvider(b) - scoreProvider(a));
}

function requestWithTimeout(provider, method, params = [], timeoutMs = REQUEST_TIMEOUT_MS) {
  let timeoutId;
  const requestPromise = provider.request({ method, params });
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Wallet ${method} request timed out.`));
    }, timeoutMs);
  });

  return Promise.race([requestPromise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

async function requestAccounts(provider, interactive) {
  const method = interactive ? 'eth_requestAccounts' : 'eth_accounts';
  const timeoutMs = interactive ? CONNECT_TIMEOUT_MS : ACCOUNTS_TIMEOUT_MS;
  return requestWithTimeout(provider, method, [], timeoutMs);
}

async function requestChainId(provider) {
  return requestWithTimeout(provider, 'eth_chainId', [], CHAIN_TIMEOUT_MS);
}

export function useWallet() {
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [browserProvider, setBrowserProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWalletInstalled, setIsWalletInstalled] = useState(false);

  const mountedRef = useRef(false);
  const injectedProviderRef = useRef(null);

  const refreshInjectedProvider = useCallback(() => {
    const selected = pickPreferredProvider(getOrderedProviders());
    injectedProviderRef.current = selected;
    setIsWalletInstalled(Boolean(selected));
    return selected;
  }, []);

  const syncProviderAndSigner = useCallback(async (walletProvider, targetAccount) => {
    const nextProvider = new ethers.BrowserProvider(walletProvider);
    const nextSigner = await nextProvider.getSigner(targetAccount);

    if (!mountedRef.current) return;

    setBrowserProvider(nextProvider);
    setSigner(nextSigner);
    setAccount(targetAccount);
  }, []);

  const handleAccountsChanged = useCallback(async (accounts) => {
    if (!mountedRef.current) return;

    const normalized = Array.isArray(accounts) ? accounts : [];
    if (!normalized.length) {
      setAccount('');
      setSigner(null);
      setIsConnecting(false);
      return;
    }

    const provider = injectedProviderRef.current || refreshInjectedProvider();
    if (!provider) return;

    try {
      await syncProviderAndSigner(provider, normalized[0]);
      setIsConnecting(false);
    } catch (error) {
      console.error('Failed to update signer after account change:', error);
    }
  }, [refreshInjectedProvider, syncProviderAndSigner]);

  const handleChainChanged = useCallback((nextChainHex) => {
    if (!mountedRef.current) return;
    setChainId(parseChainId(nextChainHex));
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const providers = getOrderedProviders();
    setIsWalletInstalled(providers.length > 0);

    const provider = providers[0] || null;
    injectedProviderRef.current = provider;
    if (!provider) {
      return () => {
        mountedRef.current = false;
      };
    }

    const init = async () => {
      try {
        const [chainHex, accounts] = await Promise.all([
          requestChainId(provider),
          requestAccounts(provider, false),
        ]);

        if (!mountedRef.current) return;

        setChainId(parseChainId(chainHex));

        if (Array.isArray(accounts) && accounts.length > 0) {
          await syncProviderAndSigner(provider, accounts[0]);
        }
      } catch (error) {
        console.error('Wallet init failed:', error);
      }
    };

    init();

    provider.on?.('accountsChanged', handleAccountsChanged);
    provider.on?.('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
      mountedRef.current = false;
    };
  }, [handleAccountsChanged, handleChainChanged, refreshInjectedProvider, syncProviderAndSigner]);

  // Guardrail: never leave connect button in stuck state.
  useEffect(() => {
    if (!isConnecting) return undefined;

    const guardId = setTimeout(() => {
      if (mountedRef.current) {
        setIsConnecting(false);
      }
    }, CONNECT_TIMEOUT_MS + 5000);

    return () => clearTimeout(guardId);
  }, [isConnecting]);

  const connectWallet = useCallback(async () => {
    const providers = getOrderedProviders();
    if (!providers.length) {
      return { success: false, error: 'Wallet extension not found.' };
    }

    if (isConnecting) {
      return { success: false, error: 'Connection already in progress.' };
    }

    setIsConnecting(true);
    let timeoutId = null;

    try {
      let selectedProvider = null;
      let accounts = null;
      let pendingRequestError = null;

      for (const provider of providers) {
        try {
          const existingAccounts = await requestAccounts(provider, false);
          if (Array.isArray(existingAccounts) && existingAccounts.length > 0) {
            selectedProvider = provider;
            accounts = existingAccounts;
            break;
          }
        } catch (accountsError) {
          // Non-fatal: continue and try explicit connect flow below.
        }
      }

      if (!selectedProvider) {
        for (const provider of providers) {
          try {
            accounts = await Promise.race([
              requestAccounts(provider, true),
              new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                  reject(new Error('Wallet request timed out. Open wallet extension and approve.'));
                }, CONNECT_TIMEOUT_MS);
              }),
            ]);

            if (Array.isArray(accounts) && accounts.length > 0) {
              selectedProvider = provider;
              break;
            }
          } catch (requestError) {
            if (requestError?.code === -32002) {
              pendingRequestError = requestError;
            }
          }
        }
      }

      if (!selectedProvider || !Array.isArray(accounts) || accounts.length === 0) {
        if (pendingRequestError?.code === -32002) {
          return { success: false, error: 'Wallet request already pending. Check your extension popup.' };
        }
        return { success: false, error: 'No wallet account returned.' };
      }

      injectedProviderRef.current = selectedProvider;
      setIsWalletInstalled(true);

      await syncProviderAndSigner(selectedProvider, accounts[0]);

      const chainHex = await requestChainId(selectedProvider);
      if (mountedRef.current) {
        setChainId(parseChainId(chainHex));
      }

      return { success: true, account: accounts[0] };
    } catch (error) {
      console.error('Wallet connection failed:', error);

      if (error?.code === -32002) {
        return { success: false, error: 'Wallet request already pending. Check your extension popup.' };
      }

      if (error?.code === 4001) {
        return { success: false, error: 'User rejected wallet connection.' };
      }

      return { success: false, error: error?.message || 'Failed to connect wallet.' };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (mountedRef.current) {
        setIsConnecting(false);
      }
    }
  }, [isConnecting, refreshInjectedProvider, syncProviderAndSigner]);

  const switchNetwork = useCallback(async () => {
    const provider = injectedProviderRef.current || refreshInjectedProvider();
    if (!provider) return { success: false, error: 'Wallet extension not found.' };

    const switchParams = [{ chainId: CHAIN_HEX }];

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: switchParams,
      });
      return { success: true };
    } catch (switchError) {
      const switchMessage = String(switchError?.message || '').toLowerCase();

      if (
        switchError?.code === -32601
        || switchMessage.includes('method not found')
        || switchMessage.includes('unsupported')
      ) {
        try {
          await provider.request({
            method: 'wallet_switchQuaiChain',
            params: switchParams,
          });
          return { success: true };
        } catch (quaiSwitchError) {
          return { success: false, error: quaiSwitchError?.message || 'Failed to switch network.' };
        }
      }

      if (switchError?.code === 4902) {
        const addParams = [{
          chainId: CHAIN_HEX,
          chainName: APP_CONFIG.chainName,
          nativeCurrency: {
            name: APP_CONFIG.currencySymbol,
            symbol: APP_CONFIG.currencySymbol,
            decimals: 18,
          },
          rpcUrls: [APP_CONFIG.rpcUrl],
          blockExplorerUrls: [APP_CONFIG.explorerUrl],
        }];

        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: addParams,
          });
          return { success: true };
        } catch (addError) {
          const addMessage = String(addError?.message || '').toLowerCase();
          if (
            addError?.code === -32601
            || addMessage.includes('method not found')
            || addMessage.includes('unsupported')
          ) {
            try {
              await provider.request({
                method: 'wallet_addQuaiChain',
                params: addParams,
              });
              return { success: true };
            } catch (quaiAddError) {
              return { success: false, error: quaiAddError?.message || 'Failed to add network.' };
            }
          }

          return { success: false, error: addError?.message || 'Failed to add network.' };
        }
      }

      return { success: false, error: switchError?.message || 'Failed to switch network.' };
    }
  }, [refreshInjectedProvider]);

  const disconnect = useCallback(() => {
    if (!mountedRef.current) return;
    setAccount('');
    setSigner(null);
  }, []);

  const isConnected = Boolean(account);
  const isCorrectNetwork = Number(chainId) === Number(APP_CONFIG.chainId);
  const networkName = useMemo(() => {
    if (!chainId) return 'Unknown';
    if (isCorrectNetwork) return APP_CONFIG.chainName;
    return `Chain ${chainId}`;
  }, [chainId, isCorrectNetwork]);

  return {
    account,
    chainId,
    provider: browserProvider,
    signer,
    isConnected,
    isCorrectNetwork,
    isWalletInstalled,
    isConnecting,
    connectWallet,
    switchNetwork,
    disconnect,
    networkName,
  };
}
