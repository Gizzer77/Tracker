import React from 'react';
import { analyzeMarketActivity, formatNumber } from '../services/api';

const MarketInsights = ({ transactions }) => {
  const analysis = analyzeMarketActivity(transactions);

  if (!analysis) return null;

  const { sentiment, sentimentIcon, interpretation, stats } = analysis;

  return (
    <div className="market-insights">
      <div className="insights-header">
        <h3>📊 Market Intelligence & Analysis</h3>
      </div>

      <div className="sentiment-card">
        <div className="sentiment-indicator">
          <span className="sentiment-icon">{sentimentIcon}</span>
          <div>
            <div className="sentiment-label">Overall Whale Sentiment</div>
            <div className={`sentiment-value sentiment-${sentiment.toLowerCase()}`}>
              {sentiment}
            </div>
          </div>
        </div>
        <div className="sentiment-interpretation">
          {interpretation}
        </div>
      </div>

      <div className="insights-grid">
        <div className="insight-card">
          <div className="insight-icon">📥</div>
          <div className="insight-content">
            <div className="insight-label">Exchange Deposits</div>
            <div className="insight-value">{stats.exchangeDeposits}</div>
            <div className="insight-detail">${formatNumber(stats.totalDepositValue)}</div>
            <div className="insight-note">Potential selling pressure</div>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon">📤</div>
          <div className="insight-content">
            <div className="insight-label">Exchange Withdrawals</div>
            <div className="insight-value">{stats.exchangeWithdrawals}</div>
            <div className="insight-detail">${formatNumber(stats.totalWithdrawalValue)}</div>
            <div className="insight-note">Accumulation signal</div>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon">💼</div>
          <div className="insight-content">
            <div className="insight-label">Wallet Transfers</div>
            <div className="insight-value">{stats.walletToWallet}</div>
            <div className="insight-note">OTC deals & movements</div>
          </div>
        </div>

        <div className={`insight-card net-flow ${stats.netFlowDirection.includes('OUT') ? 'positive' : 'negative'}`}>
          <div className="insight-icon">{stats.netFlowDirection.includes('OUT') ? '🟢' : '🔴'}</div>
          <div className="insight-content">
            <div className="insight-label">Net Flow</div>
            <div className="insight-value">${formatNumber(stats.netFlow)}</div>
            <div className="insight-detail">{stats.netFlowDirection}</div>
            <div className="insight-note">
              {stats.netFlowDirection.includes('OUT') ? 'Bullish indicator' : 'Bearish indicator'}
            </div>
          </div>
        </div>
      </div>

      <div className="insights-explanation">
        <h4>💡 How to Read This:</h4>
        <ul>
          <li><strong>Exchange Deposits:</strong> When whales move crypto TO exchanges, they often plan to sell. Higher deposits = potential bearish pressure.</li>
          <li><strong>Exchange Withdrawals:</strong> When whales move crypto FROM exchanges, they're likely holding long-term. Higher withdrawals = potential bullish signal.</li>
          <li><strong>Net Flow OUT:</strong> More leaving exchanges than entering = accumulation phase (bullish).</li>
          <li><strong>Net Flow IN:</strong> More entering exchanges than leaving = distribution phase (bearish).</li>
        </ul>
      </div>
    </div>
  );
};

export default MarketInsights;