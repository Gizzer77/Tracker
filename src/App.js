import React, { useState, useEffect } from 'react';
import { fetchWhaleTransactions, getTrackedWallets } from './services/api';
import TransactionCard from './components/TransactionCard';
import FilterBar from './components/FilterBar';
import Stats from './components/Stats';
import WalletTracker from './components/WalletTracker';
import MarketInsights from './components/MarketInsights';
import ActiveWallets from './components/ActiveWallets';
import WalletNetworkMap from './components/WalletNetworkMap';
import WalletHistory from './components/WalletHistory';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [trackedWallets, setTrackedWallets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('demo');
  const [activeTab, setActiveTab] = useState('live'); // 'live', 'network', 'history'
  const [filters, setFilters] = useState({
    blockchain: 'all',
    minAmount: 500000,
    trackedOnly: false
  });

  // Load tracked wallets on mount
  useEffect(() => {
    loadTrackedWallets();
  }, []);

  // Load transactions on mount and set up auto-refresh
  useEffect(() => {
    loadTransactions();
    const interval = setInterval(() => {
      loadTransactions();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Apply filters whenever transactions, filters, or tracked wallets change
  useEffect(() => {
    applyFilters();
  }, [transactions, filters, trackedWallets]);

  const loadTrackedWallets = () => {
    const wallets = getTrackedWallets();
    setTrackedWallets(wallets);
  };

  const loadTransactions = async () => {
    setIsLoading(true);
    setError(null);

    const result = await fetchWhaleTransactions(filters.minAmount);

    if (result.success) {
      setTransactions(result.transactions);
      setMode(result.mode);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Filter by blockchain
    if (filters.blockchain !== 'all') {
      filtered = filtered.filter(tx => tx.blockchain === filters.blockchain);
    }

    // Filter by minimum amount
    filtered = filtered.filter(tx => tx.amount_usd >= filters.minAmount);

    // Filter by tracked wallets only
    if (filters.trackedOnly && trackedWallets.length > 0) {
      const trackedAddresses = trackedWallets.map(w => w.address.toLowerCase());
      filtered = filtered.filter(tx =>
        trackedAddresses.includes(tx.from.address.toLowerCase()) ||
        trackedAddresses.includes(tx.to.address.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleClearTransactions = () => {
    if (window.confirm('Clear all transactions? This will reset the data.')) {
      setTransactions([]);
      setFilteredTransactions([]);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🐋 Crypto Whale Tracker</h1>
          <p>Real-time monitoring of large cryptocurrency transactions</p>
          {mode === 'demo' && (
            <div className="demo-notice">
              ⚠️ DEMO MODE - Using simulated data. Add your API key in src/services/api.js for live data.
            </div>
          )}
          {mode === 'live' && (
            <div className="live-notice">
              ✅ LIVE MODE - Tracking real whale transactions from Whale Alert API
            </div>
          )}
        </div>
      </header>

      <div className="container">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            🔴 Live Transactions
          </button>
          <button 
            className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
            onClick={() => setActiveTab('network')}
          >
            🗺️ Network Map
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📊 Wallet Analytics
          </button>
        </div>

        {/* Wallet Tracker - NOW WITH TRANSACTIONS PROP */}
        <WalletTracker
          trackedWallets={trackedWallets}
          onUpdate={loadTrackedWallets}
          transactions={transactions}
        />

        {/* Active Wallets Widget */}
        <ActiveWallets
          trackedWallets={trackedWallets}
          transactions={filteredTransactions}
        />

        {/* Live Transactions Tab */}
        {activeTab === 'live' && (
          <>
            {/* Filter Bar */}
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              onRefresh={loadTransactions}
              isLoading={isLoading}
            />

            {/* Loading State */}
            {isLoading && (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading whale transactions...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="error-message">
                ❌ Error: {error}
              </div>
            )}

            {/* Data Display */}
            {!isLoading && !error && (
              <>
                {/* Market Insights */}
                <MarketInsights transactions={filteredTransactions} />

                {/* Stats */}
                <Stats transactions={filteredTransactions} />

                {/* Transactions Section */}
                <div className="transactions-section">
                  <div className="section-header">
                    <h2>Recent Whale Transactions</h2>
                    <div className="header-actions">
                      <span className="transaction-count">
                        {filteredTransactions.length} transactions
                      </span>
                      <button
                        className="clear-transactions-btn"
                        onClick={handleClearTransactions}
                        disabled={transactions.length === 0}
                      >
                        🗑️ Clear All
                      </button>
                    </div>
                  </div>

                  {filteredTransactions.length === 0 ? (
                    <div className="no-data">
                      No transactions found matching your filters.
                    </div>
                  ) : (
                    <div className="transactions-grid">
                      {filteredTransactions.map(tx => (
                        <TransactionCard key={tx.id} transaction={tx} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* Network Map Tab */}
        {activeTab === 'network' && (
          <WalletNetworkMap
            transactions={transactions}
            trackedWallets={trackedWallets}
            onWalletUpdate={loadTrackedWallets}
          />
        )}

        {/* Wallet History Tab */}
        {activeTab === 'history' && (
          <WalletHistory
            transactions={transactions}
            trackedWallets={trackedWallets}
          />
        )}
      </div>

      <footer className="app-footer">
        <p>
          Built with React • Data from{' '}
          <a href="https://whale-alert.io" target="_blank" rel="noopener noreferrer">
            Whale Alert
          </a>
        </p>
        <p className="api-note">
          {mode === 'demo'
            ? 'Demo mode active - Get a free API key to track real whale movements!'
            : 'Tracking live whale transactions across major blockchains'}
        </p>
      </footer>
    </div>
  );
}

export default App;