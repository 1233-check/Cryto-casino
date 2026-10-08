import React, { createContext, useContext, useState, useCallback } from 'react';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

// Supported chains and their config
export const CHAINS = {
  ethereum: {
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '⟠',
    color: '#627EEA',
    decimals: 18,
    chainId: '0x1',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
  },
  polygon: {
    name: 'Polygon',
    symbol: 'MATIC',
    icon: '⬡',
    color: '#8247E5',
    decimals: 18,
    chainId: '0x89',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
  },
  bsc: {
    name: 'BNB Chain',
    symbol: 'BNB',
    icon: '◆',
    color: '#F0B90B',
    decimals: 18,
    chainId: '0x38',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    explorerUrl: 'https://bscscan.com',
  },
  solana: {
    name: 'Solana',
    symbol: 'SOL',
    icon: '◎',
    color: '#9945FF',
    decimals: 9,
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
  },
};

// Deposit wallet addresses (Replace with your real addresses!)
export const DEPOSIT_ADDRESSES = {
  ethereum: '0xYOUR_ETH_DEPOSIT_ADDRESS',
  polygon: '0xYOUR_POLYGON_DEPOSIT_ADDRESS',
  bsc: '0xYOUR_BSC_DEPOSIT_ADDRESS',
  solana: 'YOUR_SOL_DEPOSIT_ADDRESS',
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
      if (window.ethereum?.isMetaMask) {
        wallets.push({ id: 'metamask', name: 'MetaMask', chains: ['ethereum', 'polygon', 'bsc'] });
      }
      if (window.solana?.isPhantom) {
        wallets.push({ id: 'phantom', name: 'Phantom', chains: ['solana'] });
      }
      // Trust Wallet injects as window.ethereum with isTrust or window.trustwallet
      if (window.trustwallet || window.ethereum?.isTrust) {
        wallets.push({ id: 'trustwallet', name: 'Trust Wallet', chains: ['ethereum', 'polygon', 'bsc', 'solana'] });
      }
      // Generic ethereum provider fallback (e.g., Coinbase Wallet, Brave Wallet)
      if (window.ethereum && !window.ethereum.isMetaMask && !window.ethereum.isTrust && wallets.length === 0) {
        wallets.push({ id: 'ethereum', name: 'Browser Wallet', chains: ['ethereum', 'polygon', 'bsc'] });
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

  // Send EVM transaction (ETH/MATIC/BNB)
  const sendEvmTransaction = useCallback(async (toAddress, amountInEther, chain) => {
    const provider = window.ethereum;
    if (!provider) throw new Error('No EVM wallet connected');
    
    const chainConfig = CHAINS[chain];
    
    // Switch to the correct chain
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainConfig.chainId }],
      });
    } catch (switchError) {
      // If chain doesn't exist, add it
      if (switchError.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: chainConfig.chainId,
            chainName: chainConfig.name,
            rpcUrls: [chainConfig.rpcUrl],
            blockExplorerUrls: [chainConfig.explorerUrl],
            nativeCurrency: { name: chainConfig.symbol, symbol: chainConfig.symbol, decimals: chainConfig.decimals },
          }],
        });
      } else {
        throw switchError;
      }
    }

    // Convert to Wei
    const amountHex = '0x' + BigInt(Math.floor(amountInEther * 10 ** chainConfig.decimals)).toString(16);
    
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
    
    const connection = new Connection(CHAINS.solana.rpcUrl, 'confirmed');
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
