import React, { useState, useMemo } from 'react';
import TransactionCard from './TransactionCard';
import { getWalletName, formatNumber, calculateWalletHoldings, getBlockchainColor } from '../services/api';

const WalletHistory = ({ transactions, trackedWallets }) => {
  const [timeFilter, setTimeFilter] = useState('all');
  const [selectedWallet, setSelectedWallet] = useState('all');
  const [view, setView] = useState('transactions'); // 'transactions', 'holdings', 'map'

  // Get wallet group (parent + children)
  const getWalletGroup = (walletId) => {
    if (walletId === 'all') return trackedWallets;
    
    const wallet = trackedWallets.find(w => w.id === walletId);
    if (!wallet) return [];
    
    if (wallet.isParent && wallet.children) {
      const children = trackedWallets.filter(w => wallet.children.includes(w.id));
      return [wallet, ...children];
    }
    
    return [wallet];
  };

  // Filter transactions by time
  const getTimeFilteredTransactions = () => {
    const now = Date.now() / 1000;
    let cutoff = 0;

    switch (timeFilter) {
      case '1day':
        cutoff = now - (24 * 60 * 60);
        break;
      case '1week':
        cutoff = now - (7 * 24 * 60 * 60);
        break;
      case '30days':
        cutoff = now - (30 * 24 * 60 * 60);
        break;
      case '3months':
        cutoff = now - (90 * 24 * 60 * 60);
        break;
      case '6months':
        cutoff = now - (180 * 24 * 60 * 60);
        break;
      case 'all':
      default:
        return transactions;
    }

    return transactions.filter(tx => tx.timestamp >= cutoff);
  };

  // Filter by wallet
  const filteredTransactions = useMemo(() => {
    let filtered = getTimeFilteredTransactions();

    if (selectedWallet !== 'all') {
      const walletGroup = getWalletGroup(selectedWallet);
      const addresses = walletGroup.map(w => w.address.toLowerCase());
      
      filtered = filtered.filter(tx =>
        addresses.includes(tx.from.address.toLowerCase()) ||
        addresses.includes(tx.to.address.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, timeFilter, selectedWallet, trackedWallets]);

  // Calculate total holdings
  const totalHoldings = useMemo(() => {
    if (selectedWallet === 'all') return [];
    
    const walletGroup = getWalletGroup(selectedWallet);
    const allHoldings = {};
    
    walletGroup.forEach(wallet => {
      const holdings = calculateWalletHoldings(wallet.address, transactions);
      holdings.forEach(holding => {
        if (!allHoldings[holding.symbol]) {
          allHoldings[holding.symbol] = {
            symbol: holding.symbol,
            blockchain: holding.blockchain,
            amount: 0,
            valueUSD: 0,
            wallets: []
          };
        }
        allHoldings[holding.symbol].amount += holding.amount;
        allHoldings[holding.symbol].valueUSD += holding.valueUSD;
        allHoldings[holding.symbol].wallets.push({
          name: wallet.name,
          amount: holding.amount,
          valueUSD: holding.valueUSD
        });
      });
    });
    
    return Object.values(allHoldings).sort((a, b) => b.valueUSD - a.valueUSD);
  }, [selectedWallet, transactions, trackedWallets]);

  // Calculate AUM (Assets Under Management)
  const totalAUM = useMemo(() => {
    return totalHoldings.reduce((sum, h) => sum + h.valueUSD, 0);
  }, [totalHoldings]);

  // Calculate statistics
  const stats = useMemo(() => {
    const walletGroup = getWalletGroup(selectedWallet);
    const addresses = walletGroup.map(w => w.address.toLowerCase());
    
    const totalValue = filteredTransactions.reduce((sum, tx) => sum + tx.amount_usd, 0);
    const deposits = filteredTransactions.filter(tx => 
      addresses.includes(tx.to.address.toLowerCase())
    ).length;
    const withdrawals = filteredTransactions.filter(tx =>
      addresses.includes(tx.from.address.toLowerCase())
    ).length;

    return { totalValue, deposits, withdrawals };
  }, [filteredTransactions, selectedWallet, trackedWallets]);

  // Get parent wallets for dropdown
  const parentWallets = trackedWallets.filter(w => w.isParent);
  const standaloneWallets = trackedWallets.filter(w => !w.isParent && !w.isChild);

  // Build network map data
  const networkMapData = useMemo(() => {
    if (selectedWallet === 'all') return { nodes: [], links: [] };
    
    const walletGroup = getWalletGroup(selectedWallet);
    const addresses = walletGroup.map(w => w.address.toLowerCase());
    
    // Find all wallets that transacted with this group
    const connectedWallets = new Map();
    
    filteredTransactions.forEach(tx => {
      const fromAddr = tx.from.address.toLowerCase();
      const toAddr = tx.to.address.toLowerCase();
      
      [fromAddr, toAddr].forEach(addr => {
        if (!connectedWallets.has(addr)) {
          const wallet = walletGroup.find(w => w.address.toLowerCase() === addr);
          connectedWallets.set(addr, {
            address: addr,
            name: wallet ? wallet.name : (tx.from.address === addr ? tx.from.owner : tx.to.owner),
            isTracked: !!wallet,
            volume: 0,
            transactions: 0
          });
        }
        connectedWallets.get(addr).volume += tx.amount_usd;
        connectedWallets.get(addr).transactions += 1;
      });
    });
    
    const nodes = Array.from(connectedWallets.values());
    return { nodes, addresses };
  }, [selectedWallet, filteredTransactions, trackedWallets]);

  if (trackedWallets.length === 0) {
    return (
      <div className="wallet-history">
        <div className="history-header">
          <h3>📊 Wallet Portfolio Analytics</h3>
        </div>
        <div className="history-empty">
          <p>Track some wallets first to see portfolio analytics!</p>
        </div>
      </div>
    );
  }

  const walletGroup = getWalletGroup(selectedWallet);

  return (
    <div className="wallet-history">
      <div className="history-header">
        <h3>📊 Wallet Portfolio Analytics</h3>
        <p className="history-description">
          Comprehensive portfolio view with holdings, transactions, and network visualization
        </p>
      </div>

      <div className="history-filters">
        <div className="filter-section">
          <label>Select Wallet:</label>
          <select 
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
            className="history-select"
          >
            <option value="all">All Tracked Wallets</option>
            
            {parentWallets.length > 0 && (
              <optgroup label="━━ Wallet Groups ━━">
                {parentWallets.map(wallet => (
                  <option key={wallet.id} value={wallet.id}>
                    🗂️ {wallet.name} ({wallet.children?.length || 0} connected)
                  </option>
                ))}
              </optgroup>
            )}
            
            {standaloneWallets.length > 0 && (
              <optgroup label="━━ Individual Wallets ━━">
                {standaloneWallets.map(wallet => (
                  <option key={wallet.id} value={wallet.id}>
                    💼 {wallet.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div className="filter-section">
          <label>Time Range:</label>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="history-select"
          >
            <option value="all">All Time</option>
            <option value="1day">Last 24 Hours</option>
            <option value="1week">Last Week</option>
            <option value="30days">Last 30 Days</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
          </select>
        </div>
      </div>

      {/* View Tabs */}
      {selectedWallet !== 'all' && (
        <div className="view-tabs">
          <button 
            className={`view-tab ${view === 'holdings' ? 'active' : ''}`}
            onClick={() => setView('holdings')}
          >
            💰 Portfolio Holdings
          </button>
          <button 
            className={`view-tab ${view === 'map' ? 'active' : ''}`}
            onClick={() => setView('map')}
          >
            🗺️ Network Map
          </button>
          <button 
            className={`view-tab ${view === 'transactions' ? 'active' : ''}`}
            onClick={() => setView('transactions')}
          >
            📋 Transaction History
          </button>
        </div>
      )}

      {/* Portfolio Holdings View */}
      {view === 'holdings' && selectedWallet !== 'all' && (
        <div className="portfolio-view">
          {/* AUM Banner */}
          <div className="aum-banner">
            <div className="aum-content">
              <div className="aum-label">Total Assets Under Management</div>
              <div className="aum-value">${formatNumber(totalAUM)} USD</div>
              <div className="aum-subtitle">
                Across {walletGroup.length} wallet{walletGroup.length > 1 ? 's' : ''} • 
                {totalHoldings.length} asset{totalHoldings.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Holdings Grid */}
          <div className="holdings-section">
            <h4>Asset Breakdown</h4>
            <div className="holdings-grid">
              {totalHoldings.map((holding, i) => (
                <div key={i} className="holding-card">
                  <div className="holding-header">
                    <div className="holding-symbol">{holding.symbol}</div>
                    <div 
                      className="holding-blockchain"
                      style={{ backgroundColor: getBlockchainColor(holding.blockchain) }}
                    >
                      {holding.blockchain.toUpperCase()}
                    </div>
                  </div>
                  <div className="holding-amount">{formatNumber(holding.amount)}</div>
                  <div className="holding-value">${formatNumber(holding.valueUSD)} USD</div>
                  
                  {/* Breakdown by wallet */}
                  <div className="holding-breakdown">
                    {holding.wallets.map((w, j) => (
                      <div key={j} className="wallet-holding">
                        <span className="wallet-holding-name">{w.name}:</span>
                        <span className="wallet-holding-amount">{formatNumber(w.amount)} {holding.symbol}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="chart-section">
            <h4>Asset Allocation</h4>
            <div className="pie-chart-container">
              <svg viewBox="0 0 200 200" className="pie-chart">
                {totalHoldings.reduce((acc, holding, i) => {
                  const percentage = (holding.valueUSD / totalAUM) * 100;
                  const angle = (percentage / 100) * 360;
                  const startAngle = acc.currentAngle;
                  const endAngle = startAngle + angle;
                  
                  const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                  const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                  const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                  const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                  
                  const largeArc = angle > 180 ? 1 : 0;
                  
                  const colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                  const color = colors[i % colors.length];
                  
                  acc.paths.push(
                    <path
                      key={i}
                      d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={color}
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                  
                  acc.currentAngle = endAngle;
                  return acc;
                }, { paths: [], currentAngle: 0 }).paths}
              </svg>
              
              <div className="pie-legend">
                {totalHoldings.map((holding, i) => {
                  const percentage = ((holding.valueUSD / totalAUM) * 100).toFixed(1);
                  const colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                  return (
                    <div key={i} className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: colors[i % colors.length] }}></div>
                      <div className="legend-label">{holding.symbol}</div>
                      <div className="legend-value">{percentage}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Network Map View */}
      {view === 'map' && selectedWallet !== 'all' && (
        <div className="network-view">
          <h4>Wallet Network Connections</h4>
          <div className="simple-network-map">
            <svg viewBox="0 0 400 300" className="network-svg">
              {/* Center node (your wallet) */}
              <circle cx="200" cy="150" r="30" fill="#10b981" stroke="white" strokeWidth="3" />
              <text x="200" y="155" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                YOU
              </text>
              
              {/* Connected nodes */}
              {networkMapData.nodes.slice(0, 8).map((node, i) => {
                if (networkMapData.addresses.includes(node.address)) return null;
                
                const angle = (i / 8) * 2 * Math.PI;
                const x = 200 + 120 * Math.cos(angle);
                const y = 150 + 120 * Math.sin(angle);
                const size = Math.min(25, 10 + (node.volume / 10000000));
                
                return (
                  <g key={i}>
                    <line x1="200" y1="150" x2={x} y2={y} stroke="#e5e7eb" strokeWidth="2" />
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={size} 
                      fill={node.name !== 'unknown' ? '#f59e0b' : '#6b7280'}
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text 
                      x={x} 
                      y={y + size + 15} 
                      textAnchor="middle" 
                      fill="#1f2937" 
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {node.name !== 'unknown' ? node.name.substring(0, 10) : `${node.address.substring(0, 6)}...`}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          
          <div className="network-stats-list">
            <h5>Connected Wallets ({networkMapData.nodes.length - walletGroup.length})</h5>
            {networkMapData.nodes
              .filter(n => !networkMapData.addresses.includes(n.address))
              .slice(0, 10)
              .map((node, i) => (
                <div key={i} className="network-wallet-item">
                  <div className="network-wallet-name">
                    {node.name !== 'unknown' ? node.name : `${node.address.substring(0, 20)}...`}
                  </div>
                  <div className="network-wallet-stats">
                    <span>{node.transactions} txs</span>
                    <span>${formatNumber(node.volume)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Transaction History View */}
      {view === 'transactions' && (
        <>
          <div className="history-stats">
            <div className="history-stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-label">Total Transactions</div>
                <div className="stat-value">{filteredTransactions.length}</div>
              </div>
            </div>
            
            {selectedWallet !== 'all' && (
              <>
                <div className="history-stat-card">
                  <div className="stat-icon">📥</div>
                  <div className="stat-content">
                    <div className="stat-label">Received</div>
                    <div className="stat-value">{stats.deposits}</div>
                  </div>
                </div>
                <div className="history-stat-card">
                  <div className="stat-icon">📤</div>
                  <div className="stat-content">
                    <div className="stat-label">Sent</div>
                    <div className="stat-value">{stats.withdrawals}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="no-transactions">
              <p>No transactions found for the selected filters</p>
            </div>
          ) : (
            <div className="history-transactions">
              <div className="transactions-grid">
                {filteredTransactions.map(tx => (
                  <TransactionCard key={tx.id} transaction={tx} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WalletHistory;