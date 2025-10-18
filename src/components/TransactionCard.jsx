import React, { useState } from 'react';
import { formatNumber, formatTime, getBlockchainColor, getWalletName, analyzeTransaction } from '../services/api';

const TransactionCard = ({ transaction }) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(null);
  const blockchainColor = getBlockchainColor(transaction.blockchain);
  const analysis = analyzeTransaction(transaction);
  
  // Check if addresses are tracked
  const fromName = getWalletName(transaction.from.address);
  const toName = getWalletName(transaction.to.address);
  const isTracked = fromName || toName;

  // Copy address to clipboard
  const copyAddress = (address, label) => {
    navigator.clipboard.writeText(address).then(() => {
      setCopiedAddress(label);
      setTimeout(() => setCopiedAddress(null), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert(`Address: ${address}`);
    });
  };

  // Determine transaction action type
  const getActionType = () => {
    const { from, to } = transaction;
    const isFromExchange = from.owner !== 'unknown' && 
      ['binance', 'coinbase', 'kraken', 'bitfinex', 'huobi'].some(ex => 
        from.owner.toLowerCase().includes(ex)
      );
    
    const isToExchange = to.owner !== 'unknown' && 
      ['binance', 'coinbase', 'kraken', 'bitfinex', 'huobi'].some(ex => 
        to.owner.toLowerCase().includes(ex)
      );

    if (isFromExchange && !isToExchange) {
      return { 
        type: 'WITHDRAW TO HOLD', 
        color: '#10b981', 
        icon: '📤', 
        description: 'Moving OFF exchange → Long-term holding (BULLISH 🟢)' 
      };
    } else if (!isFromExchange && isToExchange) {
      return { 
        type: 'DEPOSIT TO SELL', 
        color: '#ef4444', 
        icon: '📥', 
        description: 'Moving TO exchange → Preparing to sell (BEARISH 🔴)' 
      };
    } else if (isFromExchange && isToExchange) {
      return { 
        type: 'EXCHANGE TRANSFER', 
        color: '#f59e0b', 
        icon: '🔀', 
        description: 'Moving between exchanges (Arbitrage/Rebalancing)' 
      };
    } else {
      return { 
        type: 'WALLET TRANSFER', 
        color: '#6b7280', 
        icon: '💼', 
        description: 'Private wallet movement (OTC deal or internal)' 
      };
    }
  };

  const actionType = getActionType();
  
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

      {/* CLEAR ACTION TYPE BADGE */}
      <div className="action-type-badge" style={{ backgroundColor: actionType.color }}>
        <span className="action-icon">{actionType.icon}</span>
        <div className="action-info">
          <div className="action-type">{actionType.type}</div>
          <div className="action-description">{actionType.description}</div>
        </div>
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
          <span 
            className={`address ${fromName ? 'tracked-address' : ''} clickable-address`}
            onClick={() => copyAddress(transaction.from.address, 'from')}
            title="Click to copy address"
          >
            {fromName ? (
              <strong>🏷️ {fromName}</strong>
            ) : transaction.from.owner !== 'unknown' ? (
              <strong>{transaction.from.owner}</strong>
            ) : (
              <code>{transaction.from.address.substring(0, 10)}...</code>
            )}
            {copiedAddress === 'from' && <span className="copied-tooltip">✓ Copied!</span>}
          </span>
        </div>
        <div className="arrow">↓</div>
        <div className="address-row">
          <span className="label">To:</span>
          <span 
            className={`address ${toName ? 'tracked-address' : ''} clickable-address`}
            onClick={() => copyAddress(transaction.to.address, 'to')}
            title="Click to copy address"
          >
            {toName ? (
              <strong>🏷️ {toName}</strong>
            ) : transaction.to.owner !== 'unknown' ? (
              <strong>{transaction.to.owner}</strong>
            ) : (
              <code>{transaction.to.address.substring(0, 10)}...</code>
            )}
            {copiedAddress === 'to' && <span className="copied-tooltip">✓ Copied!</span>}
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
              <span className="detail-label">Action:</span>
              <span className="detail-value" style={{ color: actionType.color }}>
                {actionType.type}
              </span>
            </div>
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

          {/* FULL ADDRESSES - CLICK TO COPY */}
          <div className="full-addresses">
            <div className="full-address-row">
              <span className="address-label">From Address:</span>
              <code 
                className="full-address-code"
                onClick={() => copyAddress(transaction.from.address, 'from-full')}
                title="Click to copy full address"
              >
                {transaction.from.address}
                {copiedAddress === 'from-full' && <span className="copied-tooltip">✓ Copied!</span>}
              </code>
            </div>
            <div className="full-address-row">
              <span className="address-label">To Address:</span>
              <code 
                className="full-address-code"
                onClick={() => copyAddress(transaction.to.address, 'to-full')}
                title="Click to copy full address"
              >
                {transaction.to.address}
                {copiedAddress === 'to-full' && <span className="copied-tooltip">✓ Copied!</span>}
              </code>
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
            const info = `🔍 Transaction Details\n\n${actionType.icon} ${actionType.type}\n${actionType.description}\n\n📊 Analysis:\n${analysis.description}\n\n💰 Amount: ${formatNumber(transaction.amount)} ${transaction.symbol}\n💵 Value: $${formatNumber(transaction.amount_usd)}\n\n🔗 Hash: ${transaction.hash}\n\n📤 From: ${transaction.from.address}\n📥 To: ${transaction.to.address}`;
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