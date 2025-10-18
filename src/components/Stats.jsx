import React from 'react';
import { formatNumber } from '../services/api';

const Stats = ({ transactions }) => {
  const totalValue = transactions.reduce((sum, tx) => sum + tx.amount_usd, 0);
  const avgValue = transactions.length > 0 ? totalValue / transactions.length : 0;
  const largestTx = transactions.length > 0 
    ? Math.max(...transactions.map(tx => tx.amount_usd)) 
    : 0;

  const blockchainCounts = transactions.reduce((acc, tx) => {
    acc[tx.blockchain] = (acc[tx.blockchain] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="stats-container">
      <div className="stat-card">
        <div className="stat-label">Total Transactions</div>
        <div className="stat-value">{transactions.length}</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Total Value</div>
        <div className="stat-value">${formatNumber(totalValue)}</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Average Value</div>
        <div className="stat-value">${formatNumber(avgValue)}</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Largest Transaction</div>
        <div className="stat-value">${formatNumber(largestTx)}</div>
      </div>

      {Object.keys(blockchainCounts).length > 0 && (
        <div className="stat-card full-width">
          <div className="stat-label">By Blockchain</div>
          <div className="blockchain-stats">
            {Object.entries(blockchainCounts).map(([chain, count]) => (
              <span key={chain} className="blockchain-stat">
                {chain.toUpperCase()}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;