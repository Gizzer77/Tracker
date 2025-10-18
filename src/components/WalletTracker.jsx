import React, { useState } from 'react';
import { addTrackedWallet, removeTrackedWallet, getBlockchainColor } from '../services/api';
import WalletManager from './WalletManager';

const WalletTracker = ({ trackedWallets, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [newWallet, setNewWallet] = useState({
    address: '',
    name: '',
    blockchain: 'ethereum'
  });
  const [error, setError] = useState('');

  const handleAdd = () => {
    setError('');
    
    // Validation
    if (!newWallet.address.trim()) {
      setError('Please enter a wallet address');
      return;
    }
    
    if (!newWallet.name.trim()) {
      setError('Please enter a name for this wallet');
      return;
    }

    // Basic address validation
    if (newWallet.address.length < 10) {
      setError('Invalid wallet address');
      return;
    }

    // Add wallet
    addTrackedWallet(
      newWallet.address,
      newWallet.name,
      newWallet.blockchain
    );

    // Reset form
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
      
      // If parent, also remove children
      if (wallet.isParent && wallet.children) {
        wallet.children.forEach(childId => {
          removeTrackedWallet(childId);
        });
      }
      
      onUpdate();
    }
  };

  const toggleGroup = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // Organize wallets into groups
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
          {/* Parent Groups (from map tracking) */}
          {parentWallets.map(parent => {
            const children = childWallets.filter(c => c.parentId === parent.id);
            const isExpanded = expandedGroups.has(parent.id);
            
            return (
              <div key={parent.id} className="wallet-group">
                <div className="tracked-wallet-item parent-wallet">
                  <div className="wallet-info">
                    <div className="wallet-name">
                      <button 
                        className="expand-btn"
                        onClick={() => toggleGroup(parent.id)}
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
                        {children.length} connected
                      </span>
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
                  <div className="children-wallets">
                    {children.map(child => (
                      <div key={child.id} className="tracked-wallet-item child-wallet">
                        <div className="wallet-info">
                          <div className="wallet-name">
                            <span className="child-indicator">└─</span>
                            <strong>{child.name}</strong>
                            <span 
                              className="wallet-chain-badge small"
                              style={{ backgroundColor: getBlockchainColor(child.blockchain) }}
                            >
                              {child.blockchain.toUpperCase()}
                            </span>
                          </div>
                          <div className="wallet-address">
                            {child.address.substring(0, 20)}...
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Standalone Wallets */}
          {standaloneWallets.map(wallet => (
            <div key={wallet.id} className="tracked-wallet-item">
              <div className="wallet-info">
                <div className="wallet-name">
                  <strong>{wallet.name}</strong>
                  <span 
                    className="wallet-chain-badge"
                    style={{ backgroundColor: getBlockchainColor(wallet.blockchain) }}
                  >
                    {wallet.blockchain.toUpperCase()}
                  </span>
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
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletTracker;