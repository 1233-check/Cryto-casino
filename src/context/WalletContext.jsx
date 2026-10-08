import React, { createContext, useContext, useState, useCallback } from 'react';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

// Supported Assets and their config
export const ASSETS = {
  ethereum: {
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '⟠',
    color: '#627EEA',
    chainType: 'evm',
    decimals: 18,
    chainId: '0x1',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
  },
  solana: {
    name: 'Solana',
    symbol: 'SOL',
    icon: '◎',
    color: '#9945FF',
    chainType: 'solana',
    decimals: 9,
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
  },
  usdt: {
    name: 'Tether',
    symbol: 'USDT',
    icon: '💵',
    color: '#26A17B',
    chainType: 'evm', // simplified for demo
    decimals: 6,
    chainId: '0x1',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
  },
  usdc: {
    name: 'USD Coin',
    symbol: 'USDC',
    icon: '💲',
    color: '#2775CA',
    chainType: 'evm',
    decimals: 6,
    chainId: '0x1',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
  },
  btc: {
    name: 'Bitcoin (Wrapped)',
    symbol: 'BTC',
    icon: '₿',
    color: '#F7931A',
    chainType: 'evm',
    decimals: 8,
    chainId: '0x1',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
  }
};

// Deposit wallet addresses (Replace with your real addresses!)
export const DEPOSIT_ADDRESSES = {
  ethereum: '0xYOUR_ETH_DEPOSIT_ADDRESS',
  solana: 'YOUR_SOL_DEPOSIT_ADDRESS',
  usdt: '0xYOUR_USDT_DEPOSIT_ADDRESS',
  usdc: '0xYOUR_USDC_DEPOSIT_ADDRESS',
  btc: '0xYOUR_BTC_DEPOSIT_ADDRESS',
};

export const WalletProvider = ({ children }) => {
  const [connectedWallet, setConnectedWallet] = useState(null); // 'metamask' | 'phantom' | 'trustwallet'
  const [walletAddress, setWalletAddress] = useState(null);
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [isConnecting, setIsConnecting] = useState(false);
  const [txHistory, setTxHistory] = useState([]);

  // Detect available wallets
  const getAvailableWallets = useCallback(() => {
    const wallets = [];
    if (typeof window !== 'undefined') {
      // Trust Wallet injects as window.ethereum with isTrust or window.trustwallet
      if (window.trustwallet || window.ethereum?.isTrust) {
        wallets.push({ id: 'trustwallet', name: 'Trust Wallet', assets: ['ethereum', 'solana', 'usdt', 'usdc', 'btc'] });
      }
      // Generic ethereum provider fallback (e.g., Coinbase Wallet, Brave Wallet)
      if (window.ethereum && !window.ethereum.isMetaMask && !window.ethereum.isTrust && wallets.length === 0) {
        wallets.push({ id: 'ethereum', name: 'Browser Wallet', assets: ['ethereum', 'usdt', 'usdc', 'btc'] });
      }
    }
    return wallets;
  }, []);

  // Connect MetaMask / EVM wallet
  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      window.open('https://metamask.io/download/', '_blank');
      throw new Error('MetaMask not installed');
    }
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      setWalletAddress(address);
      setConnectedWallet('metamask');
      setSelectedChain('ethereum');
      return address;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Connect Phantom (Solana)
  const connectPhantom = useCallback(async () => {
    if (!window.solana?.isPhantom) {
      window.open('https://phantom.app/', '_blank');
      throw new Error('Phantom not installed');
    }
    setIsConnecting(true);
    try {
      const response = await window.solana.connect();
      const address = response.publicKey.toString();
      setWalletAddress(address);
      setConnectedWallet('phantom');
      setSelectedChain('solana');
      return address;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Connect Trust Wallet
  const connectTrustWallet = useCallback(async () => {
    const provider = window.trustwallet || window.ethereum;
    if (!provider) {
      window.open('https://trustwallet.com/', '_blank');
      throw new Error('Trust Wallet not installed');
    }
    setIsConnecting(true);
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      setWalletAddress(address);
      setConnectedWallet('trustwallet');
      setSelectedChain('ethereum');
      return address;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setConnectedWallet(null);
    setWalletAddress(null);
  }, []);

  // Send EVM transaction (ETH/USDT/USDC/BTC)
  const sendEvmTransaction = useCallback(async (toAddress, amountInEther, asset) => {
    const provider = window.ethereum;
    if (!provider) throw new Error('No EVM wallet connected');
    
    const assetConfig = ASSETS[asset];
    
    // Switch to the correct chain
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: assetConfig.chainId }],
      });
    } catch (switchError) {
      // If chain doesn't exist, add it
      if (switchError.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: assetConfig.chainId,
            chainName: assetConfig.name,
            rpcUrls: [assetConfig.rpcUrl],
            blockExplorerUrls: [assetConfig.explorerUrl],
            nativeCurrency: { name: assetConfig.symbol, symbol: assetConfig.symbol, decimals: assetConfig.decimals },
          }],
        });
      } else {
        throw switchError;
      }
    }

    // Convert to Wei (using standard math for demo, use ethers.parseUnits in prod for ERC20)
    const amountHex = '0x' + BigInt(Math.floor(amountInEther * 10 ** assetConfig.decimals)).toString(16);
    
    const accounts = await provider.request({ method: 'eth_accounts' });
    
    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: accounts[0],
        to: toAddress,
        value: amountHex,
      }],
    });

    return txHash;
  }, []);

  // Send Solana transaction
  const sendSolanaTransaction = useCallback(async (toAddress, amountInSol) => {
    if (!window.solana?.isPhantom) throw new Error('Phantom not connected');

    // Dynamic import to avoid bundling issues
    const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
    
    const connection = new Connection(ASSETS.solana.rpcUrl, 'confirmed');
    const fromPubkey = window.solana.publicKey;
    const toPubkey = new PublicKey(toAddress);
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: Math.floor(amountInSol * LAMPORTS_PER_SOL),
      })
    );

    transaction.feePayer = fromPubkey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    const signed = await window.solana.signTransaction(transaction);
    const txId = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(txId, 'confirmed');

    return txId;
  }, []);

  // Add to transaction history
  const addTx = useCallback((tx) => {
    setTxHistory(prev => [tx, ...prev].slice(0, 50));
  }, []);

  const value = {
    connectedWallet,
    walletAddress,
    selectedChain,
    setSelectedChain,
    isConnecting,
    txHistory,
    getAvailableWallets,
    connectMetaMask,
    connectPhantom,
    connectTrustWallet,
    disconnect,
    sendEvmTransaction,
    sendSolanaTransaction,
    addTx,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
