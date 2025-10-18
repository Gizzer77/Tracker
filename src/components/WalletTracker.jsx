import React, { useState } from 'react';
import { addTrackedWallet, removeTrackedWallet, getBlockchainColor } from '../services/api';

const WalletTracker = ({ trackedWallets, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
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
    const wallet = addTrackedWallet(
      newWallet.address,
      newWallet.name,
      newWallet.blockchain
    );

    // Reset form
    setNewWallet({ address: '', name: '', blockchain: 'ethereum' });
    setIsAdding(false);
    onUpdate();
  };

  const handleRemove = (id) => {
    if (window.confirm('Remove this wallet from tracking?')) {
      removeTrackedWallet(id);
      onUpdate();
    }
  };

  return (
    <div className="wallet-tracker">
      <div className="wallet-tracker-header">
        <h3>📍 Tracked Wallets ({trackedWallets.length})</h3>
        <button 
          className="add-wallet-btn"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? '✕ Cancel' : '+ Add Wallet'}
        </button>
      </div>

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
          <p>No wallets tracked yet. Click "Add Wallet" to start tracking!</p>
        </div>
      ) : (
        <div className="tracked-wallets-list">
          {trackedWallets.map(wallet => (
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
                onClick={() => handleRemove(wallet.id)}
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