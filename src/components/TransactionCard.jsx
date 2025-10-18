import React, { useState } from 'react';
import { formatNumber, formatTime, getBlockchainColor, getWalletName, analyzeTransaction } from '../services/api';

const TransactionCard = ({ transaction }) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const blockchainColor = getBlockchainColor(transaction.blockchain);
  const analysis = analyzeTransaction(transaction);
  
  // Check if addresses are tracked
  const fromName = getWalletName(transaction.from.address);
  const toName = getWalletName(transaction.to.address);
  const isTracked = fromName || toName;
  
  return (
    <div className={`transaction-card ${isTracked ? 'tracked-transaction' : ''}`}>
      {isTracked && (
        <div className="tracked-badge">
          ⭐ Tracked Wallet Activity
        </div>
      )}
      
      <div className="transaction-header">
        <div className="blockchain-badge" style={{ backgroundColor: blockchainColor }}>
          {transaction.blockchain.toUpperCase()}
        </div>
        <span className="transaction-time">{formatTime(transaction.timestamp)}</span>
      </div>

      <div className="transaction-summary-badge">
        <span className="summary-icon">{analysis.icon}</span>
        <span className={`summary-text signal-${analysis.signal}`}>
          {analysis.shortSummary}
        </span>
      </div>

      <div className="transaction-amount">
        <div className="amount-crypto">
          {formatNumber(transaction.amount)} {transaction.symbol}
        </div>
        <div className="amount-usd">
          ${formatNumber(transaction.amount_usd)} USD
        </div>
      </div>

      <div className="transaction-addresses">
        <div className="address-row">
          <span className="label">From:</span>
          <span className={`address ${fromName ? 'tracked-address' : ''}`}>
            {fromName ? (
              <strong>🏷️ {fromName}</strong>
            ) : transaction.from.owner !== 'unknown' ? (
              <strong>{transaction.from.owner}</strong>
            ) : (
              <code>{transaction.from.address.substring(0, 10)}...</code>
            )}
          </span>
        </div>
        <div className="arrow">↓</div>
        <div className="address-row">
          <span className="label">To:</span>
          <span className={`address ${toName ? 'tracked-address' : ''}`}>
            {toName ? (
              <strong>🏷️ {toName}</strong>
            ) : transaction.to.owner !== 'unknown' ? (
              <strong>{transaction.to.owner}</strong>
            ) : (
              <code>{transaction.to.address.substring(0, 10)}...</code>
            )}
          </span>
        </div>
      </div>

      <button 
        className="analysis-toggle"
        onClick={() => setShowAnalysis(!showAnalysis)}
      >
        {showAnalysis ? '▼ Hide Analysis' : '▶ Show AI Analysis'}
      </button>

      {showAnalysis && (
        <div className={`transaction-analysis signal-${analysis.signal}`}>
          <div className="analysis-header">
            <strong>🤖 AI Analysis:</strong>
          </div>
          <p className="analysis-description">{analysis.description}</p>
          
          <div className="analysis-details">
            <div className="detail-row">
              <span className="detail-label">Signal:</span>
              <span className={`detail-value signal-badge-${analysis.signal}`}>
                {analysis.signal.toUpperCase()}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Transaction Type:</span>
              <span className="detail-value">
                {transaction.transaction_type.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="transaction-footer">
        <a 
          href={`#${transaction.hash}`} 
          className="view-link"
          onClick={(e) => {
            e.preventDefault();
            const info = `🔍 Transaction Details\n\n${analysis.icon} ${analysis.shortSummary}\n\n📊 Analysis:\n${analysis.description}\n\n💰 Amount: ${formatNumber(transaction.amount)} ${transaction.symbol}\n💵 Value: $${formatNumber(transaction.amount_usd)}\n\n🔗 Hash: ${transaction.hash}\n\n📤 From: ${transaction.from.address}\n📥 To: ${transaction.to.address}`;
            alert(info);
          }}
        >
          📋 Full Details
        </a>
      </div>
    </div>
  );
};

export default TransactionCard;