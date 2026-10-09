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
  bnb: {
    name: 'BNB Chain',
    symbol: 'BNB',
    icon: '◆',
    color: '#F0B90B',
    chainType: 'evm',
    decimals: 18,
    chainId: '0x38',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    explorerUrl: 'https://bscscan.com',
  },
  usdt: {
    name: 'Tether (BEP20)',
    symbol: 'USDT',
    icon: '💵',
    color: '#26A17B',
    chainType: 'evm',
    decimals: 18, // BEP20 USDT uses 18 decimals (ERC20 uses 6)
    chainId: '0x38',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    explorerUrl: 'https://bscscan.com',
  },
  btc: {
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: '₿',
    color: '#F7931A',
    chainType: 'bitcoin',
    decimals: 8,
  }
};

// Deposit wallet addresses (Replace with your real addresses!)
export const DEPOSIT_ADDRESSES = {
  ethereum: '0x4ed00a37bbc8e271051baa35a985e0d214d9f931',
  solana: 'E7LuuFxDCQYjk1oBLJMB2ybJUdE3pFY7dVFmPthcCium',
  bnb: '0x4ed00a37bbc8e271051baa35a985e0d214d9f931',
  usdt: '0x51FEaA09995b78AF1D647BE71c14663dA1dE9b68',
  btc: 'bc1qsef0x4s0sm8n8x5vws2nvy4va6u3dmnkcc6ctm',
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
        wallets.push({ id: 'trustwallet', name: 'Trust Wallet', assets: ['ethereum', 'bnb', 'solana', 'usdt', 'btc'] });
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
