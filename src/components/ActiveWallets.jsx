import React from 'react';
import { getBlockchainColor } from '../services/api';

const ActiveWallets = ({ trackedWallets, transactions }) => {
  if (trackedWallets.length === 0) return null;

  // Find which tracked wallets have recent activity
  const activeWallets = trackedWallets.map(wallet => {
    const activityCount = transactions.filter(tx => 
      tx.from.address.toLowerCase() === wallet.address.toLowerCase() ||
      tx.to.address.toLowerCase() === wallet.address.toLowerCase()
    ).length;

    return {
      ...wallet,
      activityCount
    };
  }).filter(w => w.activityCount > 0);

  if (activeWallets.length === 0) return null;

  return (
    <div className="active-wallets">
      <div className="active-wallets-header">
        <span className="active-icon">🔥</span>
        <h4>Active Tracked Wallets ({activeWallets.length})</h4>
      </div>
      <div className="active-wallets-list">
        {activeWallets.map(wallet => (
          <div key={wallet.id} className="active-wallet-badge">
            <span 
              className="active-wallet-dot"
              style={{ backgroundColor: getBlockchainColor(wallet.blockchain) }}
            ></span>
            <span className="active-wallet-name">{wallet.name}</span>
            <span className="activity-count">{wallet.activityCount} txs</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveWallets;