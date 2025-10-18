import React, { useState, useEffect } from 'react';
import TransactionCard from './components/TransactionCard';
import FilterBar from './components/FilterBar';
import Stats from './components/Stats';
import WalletTracker from './components/WalletTracker';
import MarketInsights from './components/MarketInsights';
import { fetchWhaleTransactions, getTrackedWallets, isWalletTracked } from './services/api';
import './App.css';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [trackedWallets, setTrackedWallets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('demo');
  const [filters, setFilters] = useState({
    blockchain: 'all',
    minAmount: 500000, // Default to $500k
    trackedOnly: false
  });

  // Load tracked wallets
  const loadTrackedWallets = () => {
    setTrackedWallets(getTrackedWallets());
  };

  // Load transactions
  const loadTransactions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchWhaleTransactions(filters.minAmount);
      
      if (result.success) {
        setTransactions(result.transactions);
        setMode(result.mode);
      } else {
        setError(result.error);
        setMode(result.mode);
      }
    } catch (err) {
      setError('Failed to load transactions');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadTransactions();
    loadTrackedWallets();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadTransactions();
    }, 30000);

    return () => clearInterval(interval);
  }, [filters.minAmount]);

  // Apply filters
  useEffect(() => {
    let filtered = [...transactions];

    // Filter by blockchain
    if (filters.blockchain !== 'all') {
      filtered = filtered.filter(tx => tx.blockchain === filters.blockchain);
    }

    // Filter by minimum amount
    if (filters.minAmount > 0) {
      filtered = filtered.filter(tx => tx.amount_usd >= filters.minAmount);
    }

    // Filter by tracked wallets only
    if (filters.trackedOnly) {
      filtered = filtered.filter(tx => 
        isWalletTracked(tx.from.address) || isWalletTracked(tx.to.address)
      );
    }

    // Sort by amount (highest first)
    filtered.sort((a, b) => b.amount_usd - a.amount_usd);

    setFilteredTransactions(filtered);
  }, [transactions, filters, trackedWallets]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🐋 Crypto Whale Tracker</h1>
          <p>Live monitoring of large cryptocurrency transactions ($500K+) across major blockchains</p>
          {mode === 'demo' && (
            <div className="demo-notice">
              ⚠️ Running in DEMO mode - Add API key in src/services/api.js for real data
            </div>
          )}
          {mode === 'live' && (
            <div className="live-notice">
              ✅ Live Mode - Showing real transactions
            </div>
          )}
        </div>
      </header>

      <div className="container">
        <WalletTracker 
          trackedWallets={trackedWallets}
          onUpdate={loadTrackedWallets}
        />

        <FilterBar 
          filters={filters}
          setFilters={setFilters}
          onRefresh={loadTransactions}
          isLoading={isLoading}
        />

        <Stats transactions={filteredTransactions} />

        <MarketInsights transactions={filteredTransactions} />

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div className="transactions-section">
          <div className="section-header">
            <h2>Recent Whale Transactions</h2>
            <span className="transaction-count">
              {filteredTransactions.length} transactions
            </span>
          </div>

          {isLoading && transactions.length === 0 ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading whale transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="no-data">
              <p>No transactions found matching your filters</p>
              {filters.trackedOnly && (
                <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  Try unchecking "Tracked Wallets Only" or add more wallets to track
                </p>
              )}
            </div>
          ) : (
            <div className="transactions-grid">
              {filteredTransactions.map(tx => (
                <TransactionCard key={tx.id} transaction={tx} />
              ))}
            </div>
          )}
        </div>

        <footer className="app-footer">
          <p>
            {mode === 'demo' ? 'Demo Mode Active' : 'Live Mode Active'} | 
            Updates every 30 seconds | 
            Minimum: ${(filters.minAmount / 1000000).toFixed(1)}M
          </p>
          <p className="api-note">
            <strong>Get Real Data:</strong> Sign up for a free API key at{' '}
            <a href="https://whale-alert.io/" target="_blank" rel="noopener noreferrer">
              Whale Alert
            </a>
            {' '}(free tier: 10 calls/min) or{' '}
            <a href="https://clankapp.com/" target="_blank" rel="noopener noreferrer">
              ClankApp
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;