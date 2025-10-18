import React from 'react';

const FilterBar = ({ filters, setFilters, onRefresh, isLoading }) => {
  const blockchains = ['all', 'bitcoin', 'ethereum', 'tron', 'ripple', 'polygon'];
  const minAmounts = [
    { label: 'All Transactions', value: 0 },
    { label: '$500K+ (Recommended)', value: 500000 },
    { label: '$1M+', value: 1000000 },
    { label: '$5M+', value: 5000000 },
    { label: '$10M+', value: 10000000 },
    { label: '$50M+', value: 50000000 },
    { label: '$100M+', value: 100000000 }
  ];

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>🔗 Blockchain:</label>
        <select 
          value={filters.blockchain}
          onChange={(e) => setFilters({ ...filters, blockchain: e.target.value })}
        >
          {blockchains.map(chain => (
            <option key={chain} value={chain}>
              {chain === 'all' ? 'All Chains' : chain.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>💰 Min Value:</label>
        <select 
          value={filters.minAmount}
          onChange={(e) => setFilters({ ...filters, minAmount: Number(e.target.value) })}
        >
          {minAmounts.map(amount => (
            <option key={amount.value} value={amount.value}>
              {amount.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>
          <input
            type="checkbox"
            checked={filters.trackedOnly}
            onChange={(e) => setFilters({ ...filters, trackedOnly: e.target.checked })}
          />
          <span style={{ marginLeft: '0.5rem' }}>Tracked Wallets Only</span>
        </label>
      </div>

      <button 
        className="refresh-btn"
        onClick={onRefresh}
        disabled={isLoading}
      >
        {isLoading ? '⟳ Loading...' : '↻ Refresh'}
      </button>
    </div>
  );
};

export default FilterBar;