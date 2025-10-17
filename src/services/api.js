// API Service for fetching whale transactions
const WHALE_ALERT_API = 'https://api.whale-alert.io/v1/transactions';
const DEMO_MODE = true; // Set to false when you have API keys

// Generate demo transactions for testing
const generateDemoTransaction = () => {
  const blockchains = ['bitcoin', 'ethereum', 'tron', 'ripple', 'polygon'];
  const blockchain = blockchains[Math.floor(Math.random() * blockchains.length)];
  const amount = Math.floor(Math.random() * 50000000) + 1000000;
  const symbols = {
    bitcoin: 'BTC',
    ethereum: 'ETH',
    tron: 'TRX',
    ripple: 'XRP',
    polygon: 'MATIC'
  };
  
  return {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    blockchain: blockchain,
    symbol: symbols[blockchain],
    amount: amount,
    amount_usd: amount * (Math.random() * 100 + 50),
    timestamp: Math.floor(Date.now() / 1000),
    hash: `0x${Math.random().toString(16).substr(2, 64)}`,
    from: {
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      owner: Math.random() > 0.5 ? 'unknown' : ['Binance', 'Coinbase', 'Kraken'][Math.floor(Math.random() * 3)]
    },
    to: {
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      owner: Math.random() > 0.5 ? 'unknown' : ['Binance', 'Coinbase', 'Kraken'][Math.floor(Math.random() * 3)]
    },
    transaction_type: Math.random() > 0.5 ? 'transfer' : 'exchange_deposit'
  };
};

// Fetch whale transactions
export const fetchWhaleTransactions = async (minValue = 1000000) => {
  if (DEMO_MODE) {
    // Return demo data
    return {
      success: true,
      transactions: Array.from({ length: 10 }, () => generateDemoTransaction())
    };
  }

  try {
    // For real API usage (requires API key)
    // const response = await fetch(`${WHALE_ALERT_API}?api_key=YOUR_API_KEY&min_value=${minValue}`);
    // const data = await response.json();
    // return data;
    
    return {
      success: false,
      error: 'API key required'
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return {
      success: false,
      error: error.message
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
  return date.toLocaleDateString();
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