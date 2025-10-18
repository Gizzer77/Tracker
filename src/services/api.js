// API Service for fetching whale transactions
const WHALE_ALERT_API = 'https://api.whale-alert.io/v1/transactions';

// IMPORTANT: Set your API key here
const WHALE_ALERT_KEY = ''; // Get free key from https://whale-alert.io/
const DEMO_MODE = WHALE_ALERT_KEY === ''; // Auto-detect demo mode

// Wallet Tracking Storage (localStorage)
const TRACKED_WALLETS_KEY = 'tracked_wallets';

// Get tracked wallets from storage
export const getTrackedWallets = () => {
  try {
    const stored = localStorage.getItem(TRACKED_WALLETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading tracked wallets:', error);
    return [];
  }
};

// Save tracked wallets to storage
export const saveTrackedWallets = (wallets) => {
  try {
    localStorage.setItem(TRACKED_WALLETS_KEY, JSON.stringify(wallets));
    return true;
  } catch (error) {
    console.error('Error saving tracked wallets:', error);
    return false;
  }
};

// Add a wallet to tracking
export const addTrackedWallet = (address, name, blockchain) => {
  const wallets = getTrackedWallets();
  const newWallet = {
    id: Date.now().toString(),
    address: address.toLowerCase(),
    name,
    blockchain,
    addedAt: Date.now()
  };
  wallets.push(newWallet);
  saveTrackedWallets(wallets);
  return newWallet;
};

// Remove a wallet from tracking
export const removeTrackedWallet = (id) => {
  const wallets = getTrackedWallets();
  const filtered = wallets.filter(w => w.id !== id);
  saveTrackedWallets(filtered);
  return filtered;
};

// Check if address is tracked
export const isWalletTracked = (address) => {
  const wallets = getTrackedWallets();
  return wallets.find(w => w.address.toLowerCase() === address.toLowerCase());
};

// Get wallet name if tracked
export const getWalletName = (address) => {
  const wallet = isWalletTracked(address);
  return wallet ? wallet.name : null;
};

// Generate demo transactions for testing
const generateDemoTransaction = () => {
  const blockchains = ['bitcoin', 'ethereum', 'tron', 'ripple', 'polygon'];
  const blockchain = blockchains[Math.floor(Math.random() * blockchains.length)];
  const amount = Math.floor(Math.random() * 50000000) + 500000;
  const symbols = {
    bitcoin: 'BTC',
    ethereum: 'ETH',
    tron: 'TRX',
    ripple: 'XRP',
    polygon: 'MATIC'
  };
  
  const knownWallets = [
    '0x742d35cc6634c0532925a3b844bc9e7595f0beb',
    '0x28c6c06298d514db089934071355e5743bf21d60',
    '0xdfd5293d8e347dfe59e90efd55b2956a1343963d',
  ];
  
  const fromAddr = Math.random() > 0.7 ? knownWallets[Math.floor(Math.random() * knownWallets.length)] : `0x${Math.random().toString(16).substr(2, 40)}`;
  const toAddr = Math.random() > 0.7 ? knownWallets[Math.floor(Math.random() * knownWallets.length)] : `0x${Math.random().toString(16).substr(2, 40)}`;
  
  const exchanges = ['Binance', 'Coinbase', 'Kraken', 'Bitfinex', 'Huobi'];
  const randomExchange = exchanges[Math.floor(Math.random() * exchanges.length)];
  
  const useExchangeFrom = Math.random() > 0.6;
  const useExchangeTo = Math.random() > 0.6;
  
  return {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    blockchain: blockchain,
    symbol: symbols[blockchain],
    amount: amount,
    amount_usd: amount * (Math.random() * 100 + 50),
    timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600),
    hash: `0x${Math.random().toString(16).substr(2, 64)}`,
    from: {
      address: fromAddr,
      owner: useExchangeFrom ? randomExchange : 'unknown'
    },
    to: {
      address: toAddr,
      owner: useExchangeTo ? randomExchange : 'unknown'
    },
    transaction_type: Math.random() > 0.5 ? 'transfer' : 'exchange_deposit'
  };
};

// Fetch whale transactions
export const fetchWhaleTransactions = async (minValue = 500000) => {
  if (DEMO_MODE) {
    // Return demo data with more transactions
    return {
      success: true,
      transactions: Array.from({ length: 25 }, () => generateDemoTransaction()),
      mode: 'demo'
    };
  }

  try {
    // Real API usage with Whale Alert
    const now = Math.floor(Date.now() / 1000);
    const start = now - 3600; // Last hour
    
    const response = await fetch(
      `${WHALE_ALERT_API}?api_key=${WHALE_ALERT_KEY}&start=${start}&min_value=${minValue}`
    );
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const data = await response.json();
    
    return {
      success: true,
      transactions: data.transactions || [],
      mode: 'live'
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return {
      success: false,
      error: error.message,
      mode: 'error'
    };
  }
};

// Format large numbers
export const formatNumber = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
};

// Format timestamp to readable date
export const formatTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// Get blockchain icon color
export const getBlockchainColor = (blockchain) => {
  const colors = {
    bitcoin: '#f7931a',
    ethereum: '#627eea',
    tron: '#eb0029',
    ripple: '#23292f',
    polygon: '#8247e5',
    default: '#6b7280'
  };
  return colors[blockchain] || colors.default;
};

// Analyze transaction and provide description
export const analyzeTransaction = (transaction) => {
  const { from, to, amount_usd } = transaction;
  
  const isFromExchange = from.owner !== 'unknown' && 
    ['binance', 'coinbase', 'kraken', 'bitfinex', 'huobi'].some(ex => 
      from.owner.toLowerCase().includes(ex)
    );
  
  const isToExchange = to.owner !== 'unknown' && 
    ['binance', 'coinbase', 'kraken', 'bitfinex', 'huobi'].some(ex => 
      to.owner.toLowerCase().includes(ex)
    );

  const amountStr = `${formatNumber(amount_usd)}`;
  
  let description = '';
  let signal = 'neutral';
  let icon = '🔄';

  // Analyze transaction patterns
  if (isFromExchange && !isToExchange) {
    // Withdrawal from exchange
    description = `${amountStr} withdrawn from ${from.owner} to private wallet. This often indicates accumulation and potential bullish sentiment - whales are moving assets to cold storage for long-term holding.`;
    signal = 'bullish';
    icon = '📤';
  } else if (!isFromExchange && isToExchange) {
    // Deposit to exchange
    description = `${amountStr} deposited to ${to.owner}. This could signal selling pressure - whales often move assets to exchanges before selling. Watch for potential bearish pressure.`;
    signal = 'bearish';
    icon = '📥';
  } else if (isFromExchange && isToExchange) {
    // Exchange to exchange
    description = `${amountStr} transferred between exchanges (${from.owner} → ${to.owner}). This might indicate arbitrage trading, portfolio rebalancing, or preparation for large trades.`;
    signal = 'neutral';
    icon = '🔀';
  } else {
    // Wallet to wallet
    description = `${amountStr} transferred between private wallets. This could be internal movement, OTC deals, or whales consolidating/splitting positions. Pattern suggests accumulation or distribution.`;
    signal = 'neutral';
    icon = '💼';
  }

  return {
    description,
    signal,
    icon,
    shortSummary: getSummary(transaction, isFromExchange, isToExchange)
  };
};

// Get short summary for transaction
const getSummary = (tx, isFromExchange, isToExchange) => {
  if (isFromExchange && !isToExchange) return 'Whale Accumulation';
  if (!isFromExchange && isToExchange) return 'Potential Sell Pressure';
  if (isFromExchange && isToExchange) return 'Exchange Transfer';
  return 'Whale Movement';
};

// Analyze multiple transactions and provide market insights
export const analyzeMarketActivity = (transactions) => {
  if (transactions.length === 0) return null;

  let exchangeDeposits = 0;
  let exchangeWithdrawals = 0;
  let totalDepositValue = 0;
  let totalWithdrawalValue = 0;
  let walletToWallet = 0;

  transactions.forEach(tx => {
    const analysis = analyzeTransaction(tx);
    
    if (analysis.shortSummary === 'Potential Sell Pressure') {
      exchangeDeposits++;
      totalDepositValue += tx.amount_usd;
    } else if (analysis.shortSummary === 'Whale Accumulation') {
      exchangeWithdrawals++;
      totalWithdrawalValue += tx.amount_usd;
    } else {
      walletToWallet++;
    }
  });

  // Calculate sentiment
  const netFlow = totalWithdrawalValue - totalDepositValue;
  let sentiment = 'NEUTRAL';
  let sentimentIcon = '⚖️';
  let interpretation = '';

  if (netFlow > 10000000) {
    sentiment = 'BULLISH';
    sentimentIcon = '🟢';
    interpretation = 'Strong accumulation detected. Whales are withdrawing significantly more from exchanges than depositing, suggesting confidence and long-term holding intent.';
  } else if (netFlow < -10000000) {
    sentiment = 'BEARISH';
    sentimentIcon = '🔴';
    interpretation = 'Increased selling pressure. More assets flowing to exchanges than withdrawing, which often precedes price drops as whales prepare to sell.';
  } else {
    interpretation = 'Market showing balanced activity. No clear directional bias from whale movements at this time.';
  }

  return {
    sentiment,
    sentimentIcon,
    interpretation,
    stats: {
      exchangeDeposits,
      exchangeWithdrawals,
      totalDepositValue,
      totalWithdrawalValue,
      netFlow: Math.abs(netFlow),
      netFlowDirection: netFlow > 0 ? 'OUT OF EXCHANGES' : 'INTO EXCHANGES',
      walletToWallet
    }
  };
};

// Add a wallet group (parent with connected wallets)
export const addWalletGroup = (parentWallet, connectedWallets) => {
  const wallets = getTrackedWallets();
  
  // Add parent wallet
  const parentId = Date.now().toString();
  const parent = {
    id: parentId,
    address: parentWallet.address.toLowerCase(),
    name: parentWallet.name,
    blockchain: parentWallet.blockchain,
    addedAt: Date.now(),
    isParent: true,
    children: []
  };
  
  // Add connected wallets as children
  connectedWallets.forEach((child, index) => {
    const childId = `${parentId}_child_${index}`;
    const childWallet = {
      id: childId,
      address: child.address.toLowerCase(),
      name: child.name,
      blockchain: child.blockchain,
      addedAt: Date.now(),
      parentId: parentId,
      isChild: true
    };
    wallets.push(childWallet);
    parent.children.push(childId);
  });
  
  wallets.push(parent);
  saveTrackedWallets(wallets);
  return parent;
};

// Calculate wallet holdings from transactions
export const calculateWalletHoldings = (walletAddress, transactions) => {
  const holdings = {};
  const addr = walletAddress.toLowerCase();
  
  transactions.forEach(tx => {
    const isReceiving = tx.to.address.toLowerCase() === addr;
    const isSending = tx.from.address.toLowerCase() === addr;
    
    if (!holdings[tx.symbol]) {
      holdings[tx.symbol] = {
        symbol: tx.symbol,
        blockchain: tx.blockchain,
        amount: 0,
        valueUSD: 0
      };
    }
    
    if (isReceiving) {
      holdings[tx.symbol].amount += tx.amount;
      holdings[tx.symbol].valueUSD += tx.amount_usd;
    }
    if (isSending) {
      holdings[tx.symbol].amount -= tx.amount;
      holdings[tx.symbol].valueUSD -= tx.amount_usd;
    }
  });
  
  return Object.values(holdings).filter(h => h.amount > 0);
};