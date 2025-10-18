import React, { useState } from 'react';
import { addTrackedWallet, removeTrackedWallet, getBlockchainColor } from '../services/api';
import WalletManager from './WalletManager';

const WalletTracker = ({ trackedWallets, onUpdate, transactions = [] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [expandedWallets, setExpandedWallets] = useState(new Set());
  const [newWallet, setNewWallet] = useState({
    address: '',
    name: '',
    blockchain: 'ethereum'
  });
  const [error, setError] = useState('');

  // Get all connections for a wallet (exchanges and other wallets)
  const getWalletConnections = (wallet) => {
    const connections = new Map();
    const walletAddr = wallet.address.toLowerCase();

    transactions.forEach(tx => {
      const fromAddr = tx.from.address.toLowerCase();
      const toAddr = tx.to.address.toLowerCase();

      // Check if this wallet is involved in the transaction
      if (fromAddr === walletAddr || toAddr === walletAddr) {
        const otherAddr = fromAddr === walletAddr ? toAddr : fromAddr;
        const otherOwner = fromAddr === walletAddr ? tx.to.owner : tx.from.owner;
        const otherFullAddr = fromAddr === walletAddr ? tx.to.address : tx.from.address;

        if (!connections.has(otherAddr)) {
          connections.set(otherAddr, {
            address: otherAddr,
            fullAddress: otherFullAddr,
            owner: otherOwner,
            blockchain: tx.blockchain,
            symbol: tx.symbol,
            totalValue: 0,
            transactionCount: 0,
            isExchange: otherOwner !== 'unknown' && 
              ['binance', 'coinbase', 'kraken', 'bitfinex', 'huobi', 'okx', 'bybit', 'kucoin', 'gemini', 'ftx'].some(ex => 
                otherOwner.toLowerCase().includes(ex)
              ),
            transactions: []
          });
        }

        const conn = connections.get(otherAddr);
        conn.totalValue += tx.amount_usd;
        conn.transactionCount += 1;
        conn.transactions.push({
          id: tx.id,
          amount: tx.amount,
          amount_usd: tx.amount_usd,
          symbol: tx.symbol,
          timestamp: tx.timestamp,
          direction: fromAddr === walletAddr ? 'sent' : 'received'
        });
      }
    });

    return Array.from(connections.values())
      .sort((a, b) => b.totalValue - a.totalValue);
  };

  const handleAdd = () => {
    setError('');
    
    if (!newWallet.address.trim()) {
      setError('Please enter a wallet address');
      return;
    }
    
    if (!newWallet.name.trim()) {
      setError('Please enter a name for this wallet');
      return;
    }

    if (newWallet.address.length < 10) {
      setError('Invalid wallet address');
      return;
    }

    addTrackedWallet(
      newWallet.address,
      newWallet.name,
      newWallet.blockchain
    );

    setNewWallet({ address: '', name: '', blockchain: 'ethereum' });
    setIsAdding(false);
    onUpdate();
  };

  const handleRemove = (id, wallet) => {
    let message = 'Remove this wallet from tracking?';
    
    if (wallet.isParent && wallet.children && wallet.children.length > 0) {
      message = `Remove "${wallet.name}" and all ${wallet.children.length} connected wallets?`;
    }
    
    if (window.confirm(message)) {
      removeTrackedWallet(id);
      
      if (wallet.isParent && wallet.children) {
        wallet.children.forEach(childId => {
          removeTrackedWallet(childId);
        });
      }
      
      onUpdate();
    }
  };

  const toggleWallet = (walletId) => {
    const newExpanded = new Set(expandedWallets);
    if (newExpanded.has(walletId)) {
      newExpanded.delete(walletId);
    } else {
      newExpanded.add(walletId);
    }
    setExpandedWallets(newExpanded);
  };

  const formatValue = (num) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  // Organize wallets
  const parentWallets = trackedWallets.filter(w => w.isParent);
  const childWallets = trackedWallets.filter(w => w.isChild);
  const standaloneWallets = trackedWallets.filter(w => !w.isParent && !w.isChild);

  return (
    <div className="wallet-tracker">
      <div className="wallet-tracker-header">
        <h3>📍 Tracked Wallets ({trackedWallets.length})</h3>
        <div className="header-buttons">
          <button 
            className="add-wallet-btn"
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? '✕ Cancel' : '+ Add Wallet'}
          </button>
        </div>
      </div>

      <WalletManager onUpdate={onUpdate} />

      {isAdding && (
        <div className="add-wallet-form">
          <input
            type="text"
            placeholder="Wallet Address (0x...)"
            value={newWallet.address}
            onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
            className="wallet-input"
          />
          <input
            type="text"
            placeholder="Wallet Name (e.g., My Main Wallet)"
            value={newWallet.name}
            onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })}
            className="wallet-input"
          />
          <select
            value={newWallet.blockchain}
            onChange={(e) => setNewWallet({ ...newWallet, blockchain: e.target.value })}
            className="wallet-select"
          >
            <option value="ethereum">Ethereum</option>
            <option value="bitcoin">Bitcoin</option>
            <option value="tron">Tron</option>
            <option value="ripple">Ripple (XRP)</option>
            <option value="polygon">Polygon</option>
          </select>
          {error && <div className="form-error">{error}</div>}
          <button onClick={handleAdd} className="save-wallet-btn">
            💾 Save Wallet
          </button>
        </div>
      )}

      {trackedWallets.length === 0 ? (
        <div className="no-wallets">
          <p>No wallets tracked yet. Click "Add Wallet" or use the Network Map to track wallets!</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
            💡 Tip: Track from the map to auto-track connected wallets!
          </p>
        </div>
      ) : (
        <div className="tracked-wallets-list">
          {/* Parent Groups */}
          {parentWallets.map(parent => {
            const children = childWallets.filter(c => c.parentId === parent.id);
            const isExpanded = expandedWallets.has(parent.id);
            const connections = getWalletConnections(parent);
            const exchanges = connections.filter(c => c.isExchange);
            const wallets = connections.filter(c => !c.isExchange);
            
            return (
              <div key={parent.id} className="wallet-group">
                <div className="tracked-wallet-item parent-wallet">
                  <div className="wallet-info">
                    <div className="wallet-name">
                      <button 
                        className="expand-btn"
                        onClick={() => toggleWallet(parent.id)}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                      <strong>{parent.name}</strong>
                      <span 
                        className="wallet-chain-badge"
                        style={{ backgroundColor: getBlockchainColor(parent.blockchain) }}
                      >
                        {parent.blockchain.toUpperCase()}
                      </span>
                      <span className="group-badge">
                        {children.length} grouped
                      </span>
                      {connections.length > 0 && (
                        <span className="connections-badge">
                          🔗 {connections.length} connections
                        </span>
                      )}
                    </div>
                    <div className="wallet-address">
                      {parent.address.substring(0, 20)}...
                    </div>
                  </div>
                  <button 
                    className="remove-wallet-btn"
                    onClick={() => handleRemove(parent.id, parent)}
                  >
                    🗑️
                  </button>
                </div>
                
                {isExpanded && (
                  <div className="wallet-expansion-area">
                    {/* Child Wallets */}
                    {children.length > 0 && (
                      <div className="children-section">
                        <div className="expansion-section-title">📂 Grouped Wallets</div>
                        {children.map(child => (
                          <div key={child.id} className="child-wallet-mini">
                            <span className="child-indicator">└─</span>
                            <strong>{child.name}</strong>
                            <span 
                              className="wallet-chain-badge small"
                              style={{ backgroundColor: getBlockchainColor(child.blockchain) }}
                            >
                              {child.blockchain.toUpperCase()}
                            </span>
                            <code className="mini-address-inline">
                              {child.address.substring(0, 10)}...
                            </code>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Connections */}
                    {connections.length > 0 && (
                      <div className="connections-area">
                        {/* Exchanges */}
                        {exchanges.length > 0 && (
                          <div className="connections-section">
                            <div className="expansion-section-title">
                              🏢 Connected Exchanges ({exchanges.length})
                            </div>
                            {exchanges.map((conn, idx) => (
                              <div key={idx} className="connection-card exchange-connection">
                                <div className="conn-header">
                                  <span className="conn-icon">🏦</span>
                                  <strong>{conn.owner}</strong>
                                  <div className="conn-badges">
                                    <span className="mini-badge txs">{conn.transactionCount} txs</span>
                                    <span className="mini-badge value">${formatValue(conn.totalValue)}</span>
                                  </div>
                                </div>
                                <code className="conn-address">{conn.fullAddress.substring(0, 16)}...{conn.fullAddress.substring(conn.fullAddress.length - 8)}</code>
                                <div className="recent-activity">
                                  {conn.transactions.slice(0, 2).map((tx, txIdx) => (
                                    <div key={txIdx} className="activity-line">
                                      <span className={`activity-icon ${tx.direction}`}>
                                        {tx.direction === 'sent' ? '📤' : '📥'}
                                      </span>
                                      <span className="activity-amount">{formatValue(tx.amount)} {tx.symbol}</span>
                                      <span className="activity-value">${formatValue(tx.amount_usd)}</span>
                                      <span className="activity-time">{formatTime(tx.timestamp)}</span>
                                    </div>
                                  ))}
                                  {conn.transactions.length > 2 && (
                                    <div className="more-activity">+{conn.transactions.length - 2} more</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Other Wallets */}
                        {wallets.length > 0 && (
                          <div className="connections-section">
                            <div className="expansion-section-title">
                              💼 Connected Wallets ({wallets.length})
                            </div>
                            {wallets.map((conn, idx) => (
                              <div key={idx} className="connection-card wallet-connection">
                                <div className="conn-header">
                                  <span className="conn-icon">👤</span>
                                  <strong>{conn.owner !== 'unknown' ? conn.owner : 'Private Wallet'}</strong>
                                  <div className="conn-badges">
                                    <span className="mini-badge txs">{conn.transactionCount} txs</span>
                                    <span className="mini-badge value">${formatValue(conn.totalValue)}</span>
                                  </div>
                                </div>
                                <code className="conn-address">{conn.fullAddress.substring(0, 16)}...{conn.fullAddress.substring(conn.fullAddress.length - 8)}</code>
                                <div className="recent-activity">
                                  {conn.transactions.slice(0, 2).map((tx, txIdx) => (
                                    <div key={txIdx} className="activity-line">
                                      <span className={`activity-icon ${tx.direction}`}>
                                        {tx.direction === 'sent' ? '📤' : '📥'}
                                      </span>
                                      <span className="activity-amount">{formatValue(tx.amount)} {tx.symbol}</span>
                                      <span className="activity-value">${formatValue(tx.amount_usd)}</span>
                                      <span className="activity-time">{formatTime(tx.timestamp)}</span>
                                    </div>
                                  ))}
                                  {conn.transactions.length > 2 && (
                                    <div className="more-activity">+{conn.transactions.length - 2} more</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {connections.length === 0 && (
                      <div className="no-connections">
                        No connections found in current transactions
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Standalone Wallets with Inline Connections */}
          {standaloneWallets.map(wallet => {
            const isExpanded = expandedWallets.has(wallet.id);
            const connections = getWalletConnections(wallet);
            const exchanges = connections.filter(c => c.isExchange);
            const wallets = connections.filter(c => !c.isExchange);

            return (
              <div key={wallet.id} className="wallet-group">
                <div className="tracked-wallet-item standalone-wallet">
                  <div className="wallet-info">
                    <div className="wallet-name">
                      <button 
                        className="expand-btn"
                        onClick={() => toggleWallet(wallet.id)}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                      <strong>{wallet.name}</strong>
                      <span 
                        className="wallet-chain-badge"
                        style={{ backgroundColor: getBlockchainColor(wallet.blockchain) }}
                      >
                        {wallet.blockchain.toUpperCase()}
                      </span>
                      {connections.length > 0 && (
                        <span className="connections-badge">
                          🔗 {connections.length} connections
                        </span>
                      )}
                    </div>
                    <div className="wallet-address">
                      {wallet.address.substring(0, 20)}...
                    </div>
                  </div>
                  <button 
                    className="remove-wallet-btn"
                    onClick={() => handleRemove(wallet.id, wallet)}
                  >
                    🗑️
                  </button>
                </div>

                {/* Expanded View with Connections */}
                {isExpanded && (
                  <div className="wallet-expansion-area">
                    {connections.length > 0 ? (
                      <div className="connections-area">
                        {/* Exchanges */}
                        {exchanges.length > 0 && (
                          <div className="connections-section">
                            <div className="expansion-section-title">
                              🏢 Connected Exchanges ({exchanges.length})
                            </div>
                            {exchanges.map((conn, idx) => (
                              <div key={idx} className="connection-card exchange-connection">
                                <div className="conn-header">
                                  <span className="conn-icon">🏦</span>
                                  <strong>{conn.owner}</strong>
                                  <div className="conn-badges">
                                    <span className="mini-badge txs">{conn.transactionCount} txs</span>
                                    <span className="mini-badge value">${formatValue(conn.totalValue)}</span>
                                  </div>
                                </div>
                                <code className="conn-address">{conn.fullAddress.substring(0, 16)}...{conn.fullAddress.substring(conn.fullAddress.length - 8)}</code>
                                <div className="recent-activity">
                                  {conn.transactions.slice(0, 2).map((tx, txIdx) => (
                                    <div key={txIdx} className="activity-line">
                                      <span className={`activity-icon ${tx.direction}`}>
                                        {tx.direction === 'sent' ? '📤' : '📥'}
                                      </span>
                                      <span className="activity-amount">{formatValue(tx.amount)} {tx.symbol}</span>
                                      <span className="activity-value">${formatValue(tx.amount_usd)}</span>
                                      <span className="activity-time">{formatTime(tx.timestamp)}</span>
                                    </div>
                                  ))}
                                  {conn.transactions.length > 2 && (
                                    <div className="more-activity">+{conn.transactions.length - 2} more</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Other Wallets */}
                        {wallets.length > 0 && (
                          <div className="connections-section">
                            <div className="expansion-section-title">
                              💼 Connected Wallets ({wallets.length})
                            </div>
                            {wallets.map((conn, idx) => (
                              <div key={idx} className="connection-card wallet-connection">
                                <div className="conn-header">
                                  <span className="conn-icon">👤</span>
                                  <strong>{conn.owner !== 'unknown' ? conn.owner : 'Private Wallet'}</strong>
                                  <div className="conn-badges">
                                    <span className="mini-badge txs">{conn.transactionCount} txs</span>
                                    <span className="mini-badge value">${formatValue(conn.totalValue)}</span>
                                  </div>
                                </div>
                                <code className="conn-address">{conn.fullAddress.substring(0, 16)}...{conn.fullAddress.substring(conn.fullAddress.length - 8)}</code>
                                <div className="recent-activity">
                                  {conn.transactions.slice(0, 2).map((tx, txIdx) => (
                                    <div key={txIdx} className="activity-line">
                                      <span className={`activity-icon ${tx.direction}`}>
                                        {tx.direction === 'sent' ? '📤' : '📥'}
                                      </span>
                                      <span className="activity-amount">{formatValue(tx.amount)} {tx.symbol}</span>
                                      <span className="activity-value">${formatValue(tx.amount_usd)}</span>
                                      <span className="activity-time">{formatTime(tx.timestamp)}</span>
                                    </div>
                                  ))}
                                  {conn.transactions.length > 2 && (
                                    <div className="more-activity">+{conn.transactions.length - 2} more</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="no-connections">
                        No connections found in current transactions
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WalletTracker;