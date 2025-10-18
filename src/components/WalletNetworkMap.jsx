import React, { useState, useEffect, useRef } from 'react';
import { formatNumber, getWalletName, isWalletTracked, addTrackedWallet, removeTrackedWallet, getTrackedWallets } from '../services/api';

const WalletNetworkMap = ({ transactions, trackedWallets, onWalletUpdate }) => {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [showConnections, setShowConnections] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (transactions.length === 0) return;

    // Build network from transactions
    const walletMap = new Map();
    const connectionMap = new Map();

    transactions.forEach(tx => {
      const fromAddr = tx.from.address.toLowerCase();
      const toAddr = tx.to.address.toLowerCase();

      // Add or update wallet nodes
      [fromAddr, toAddr].forEach(addr => {
        if (!walletMap.has(addr)) {
          const trackedWallet = isWalletTracked(addr);
          walletMap.set(addr, {
            address: addr,
            fullAddress: tx.from.address === addr ? tx.from.address : tx.to.address,
            name: getWalletName(addr) || (tx.from.address === addr ? tx.from.owner : tx.to.owner),
            volume: 0,
            transactions: 0,
            isTracked: !!trackedWallet,
            blockchain: tx.blockchain
          });
        }
        
        const wallet = walletMap.get(addr);
        wallet.volume += tx.amount_usd;
        wallet.transactions += 1;
      });

      // Track connections
      const linkKey = [fromAddr, toAddr].sort().join('-');
      if (!connectionMap.has(linkKey)) {
        connectionMap.set(linkKey, {
          source: fromAddr,
          target: toAddr,
          volume: 0,
          count: 0
        });
      }
      const link = connectionMap.get(linkKey);
      link.volume += tx.amount_usd;
      link.count += 1;
    });

    // Convert to arrays and limit to top wallets
    const nodeArray = Array.from(walletMap.values())
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 30); // Limit to top 30 wallets for performance

    const nodeAddresses = new Set(nodeArray.map(n => n.address));
    const linkArray = Array.from(connectionMap.values())
      .filter(l => nodeAddresses.has(l.source) && nodeAddresses.has(l.target));

    // Assign random initial positions
    const width = 800;
    const height = 600;
    nodeArray.forEach(node => {
      node.x = Math.random() * width;
      node.y = Math.random() * height;
      node.vx = 0;
      node.vy = 0;
    });

    setNodes(nodeArray);
    setLinks(linkArray);
  }, [transactions, trackedWallets]);

  // Simple force simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const interval = setInterval(() => {
      const nodesCopy = [...nodes];
      const width = 800;
      const height = 600;

      // Apply forces
      nodesCopy.forEach((node, i) => {
        // Center force
        node.vx += (width / 2 - node.x) * 0.001;
        node.vy += (height / 2 - node.y) * 0.001;

        // Repulsion between nodes
        nodesCopy.forEach((other, j) => {
          if (i === j) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 500 / (dist * dist);
          node.vx += (dx / dist) * force;
          node.vy += (dy / dist) * force;
        });

        // Link attraction
        links.forEach(link => {
          if (link.source === node.address) {
            const target = nodesCopy.find(n => n.address === link.target);
            if (target) {
              const dx = target.x - node.x;
              const dy = target.y - node.y;
              node.vx += dx * 0.01;
              node.vy += dy * 0.01;
            }
          }
          if (link.target === node.address) {
            const source = nodesCopy.find(n => n.address === link.source);
            if (source) {
              const dx = source.x - node.x;
              const dy = source.y - node.y;
              node.vx += dx * 0.01;
              node.vy += dy * 0.01;
            }
          }
        });

        // Apply velocity with damping
        node.vx *= 0.8;
        node.vy *= 0.8;
        node.x += node.vx;
        node.y += node.vy;

        // Keep in bounds
        node.x = Math.max(30, Math.min(width - 30, node.x));
        node.y = Math.max(30, Math.min(height - 30, node.y));
      });

      setNodes(nodesCopy);
    }, 50);

    return () => clearInterval(interval);
  }, [nodes.length, links]);

  const getNodeSize = (node) => {
    const minSize = 20;
    const maxSize = 60;
    const maxVolume = Math.max(...nodes.map(n => n.volume));
    return minSize + ((node.volume / maxVolume) * (maxSize - minSize));
  };

  const getNodeColor = (node) => {
    if (node.isTracked) return '#10b981'; // Green for tracked
    if (node.name !== 'unknown') return '#f59e0b'; // Orange for known exchanges
    return '#6b7280'; // Gray for unknown
  };

  const handleNodeClick = (node) => {
    setSelectedNode(selectedNode?.address === node.address ? null : node);
  };

  const handleTrackWallet = (node) => {
    if (node.isTracked) {
      // Untrack - find the wallet ID and remove it
      const wallets = getTrackedWallets();
      const wallet = wallets.find(w => w.address.toLowerCase() === node.address);
      if (wallet) {
        removeTrackedWallet(wallet.id);
        
        // If it's a parent, also remove children
        if (wallet.isParent && wallet.children) {
          wallet.children.forEach(childId => {
            removeTrackedWallet(childId);
          });
        }
        
        if (onWalletUpdate) onWalletUpdate();
        
        // Update local state
        setNodes(nodes.map(n => 
          n.address === node.address ? { ...n, isTracked: false } : n
        ));
      }
    } else {
      // Track - get connected wallets and track them all
      const connected = getConnectedWallets(node);
      
      const walletName = prompt(
        `Track "${node.name !== 'unknown' ? node.name : 'This wallet'}" and ALL ${connected.length} connected wallets?\n\nEnter a name for the main wallet:`,
        node.name !== 'unknown' ? node.name : 'Main Wallet'
      );
      
      if (walletName) {
        // Import the function
        const { addWalletGroup } = require('../services/api');
        
        // Prepare parent wallet
        const parentWallet = {
          address: node.fullAddress,
          name: walletName,
          blockchain: node.blockchain
        };
        
        // Prepare connected wallets
        const connectedWallets = connected.map((w, i) => ({
          address: w.fullAddress,
          name: w.name !== 'unknown' ? w.name : `Connected Wallet ${i + 1}`,
          blockchain: w.blockchain
        }));
        
        // Track the whole group
        addWalletGroup(parentWallet, connectedWallets);
        
        if (onWalletUpdate) onWalletUpdate();
        
        // Update local state
        setNodes(nodes.map(n => {
          const isConnected = connected.some(c => c.address === n.address);
          if (n.address === node.address || isConnected) {
            return { ...n, isTracked: true };
          }
          return n;
        }));
        
        alert(`✅ Tracked ${walletName} + ${connected.length} connected wallets!`);
      }
    }
  };

  const getConnectedWallets = (node) => {
    return links.filter(l => 
      l.source === node.address || l.target === node.address
    ).map(link => {
      const otherAddr = link.source === node.address ? link.target : link.source;
      const otherNode = nodes.find(n => n.address === otherAddr);
      return {
        ...otherNode,
        link,
        fullAddress: otherNode?.fullAddress || otherNode?.address
      };
    }).filter(n => n.address);
  };

  if (transactions.length === 0) {
    return (
      <div className="network-map">
        <div className="network-header">
          <h3>🗺️ Wallet Network Map</h3>
        </div>
        <div className="network-empty">
          <p>No transactions yet. Add some transactions to see the network map!</p>
        </div>
      </div>
    );
  }

  const connectedWallets = selectedNode ? getConnectedWallets(selectedNode) : [];

  return (
    <div className="network-map">
      <div className="network-header">
        <h3>🗺️ Wallet Network Map</h3>
        <p className="network-description">
          Interactive visualization of wallet connections • Click any wallet to track it • Larger bubbles = higher volume • 
          <span style={{ color: '#10b981', fontWeight: 'bold' }}> Green</span> = Your tracked wallets • 
          <span style={{ color: '#f59e0b', fontWeight: 'bold' }}> Orange</span> = Exchanges • 
          <span style={{ color: '#6b7280', fontWeight: 'bold' }}> Gray</span> = Unknown
        </p>
      </div>

      <div className="network-container">
        <svg 
          ref={canvasRef}
          width="100%" 
          height="600" 
          viewBox="0 0 800 600"
          style={{ background: '#f9fafb', borderRadius: '12px' }}
        >
          {/* Draw links */}
          <g className="links">
            {links.map((link, i) => {
              const source = nodes.find(n => n.address === link.source);
              const target = nodes.find(n => n.address === link.target);
              if (!source || !target) return null;

              const isHighlighted = 
                selectedNode && 
                (selectedNode.address === source.address || selectedNode.address === target.address);

              return (
                <line
                  key={i}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isHighlighted ? '#667eea' : '#e5e7eb'}
                  strokeWidth={isHighlighted ? 3 : Math.min(link.count / 2, 3)}
                  opacity={isHighlighted ? 0.8 : 0.3}
                />
              );
            })}
          </g>

          {/* Draw nodes */}
          <g className="nodes">
            {nodes.map((node, i) => {
              const size = getNodeSize(node);
              const color = getNodeColor(node);
              const isSelected = selectedNode?.address === node.address;
              const isHovered = hoveredNode?.address === node.address;

              return (
                <g key={i}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={size / 2}
                    fill={color}
                    stroke={isSelected ? '#1f2937' : 'white'}
                    strokeWidth={isSelected ? 4 : 2}
                    opacity={isHovered || isSelected ? 1 : 0.8}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => handleNodeClick(node)}
                  />
                  
                  {(isSelected || isHovered || node.isTracked) && (
                    <text
                      x={node.x}
                      y={node.y + size / 2 + 15}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="bold"
                      fill="#1f2937"
                    >
                      {node.name !== 'unknown' ? node.name : `${node.address.substring(0, 6)}...`}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Info Panel */}
        {selectedNode && (
          <div className="network-info-panel">
            <div className="info-header">
              <h4>{selectedNode.name !== 'unknown' ? selectedNode.name : 'Unknown Wallet'}</h4>
              <button onClick={() => setSelectedNode(null)}>✕</button>
            </div>
            <div className="info-content">
              {/* Track/Untrack Button */}
              <button 
                className={`track-wallet-btn ${selectedNode.isTracked ? 'untrack' : 'track'}`}
                onClick={() => handleTrackWallet(selectedNode)}
              >
                {selectedNode.isTracked ? '✓ Tracked - Click to Untrack' : '+ Track This Wallet'}
              </button>

              <div className="info-row">
                <span className="info-label">Address:</span>
                <code className="info-value">{selectedNode.address.substring(0, 20)}...</code>
              </div>
              <div className="info-row">
                <span className="info-label">Total Volume:</span>
                <span className="info-value">${formatNumber(selectedNode.volume)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Transactions:</span>
                <span className="info-value">{selectedNode.transactions}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Blockchain:</span>
                <span className="info-value">{selectedNode.blockchain.toUpperCase()}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Status:</span>
                <span className="info-value" style={{ 
                  color: selectedNode.isTracked ? '#10b981' : 
                         selectedNode.name !== 'unknown' ? '#f59e0b' : '#6b7280',
                  fontWeight: 'bold'
                }}>
                  {selectedNode.isTracked ? '⭐ Tracked' : 
                   selectedNode.name !== 'unknown' ? '🏢 Exchange' : '❓ Unknown'}
                </span>
              </div>

              {/* Connected Wallets Section */}
              <div className="info-connections">
                <div className="connections-header">
                  <span className="info-label">Connected Wallets ({connectedWallets.length}):</span>
                  <button 
                    className="toggle-connections-btn"
                    onClick={() => setShowConnections(!showConnections)}
                  >
                    {showConnections ? '▼' : '▶'}
                  </button>
                </div>
                
                {showConnections && (
                  <div className="connection-list">
                    {connectedWallets.map((wallet, i) => (
                      <div key={i} className="connection-item-detailed">
                        <div className="connection-info">
                          <div className="connection-name">
                            <span style={{ 
                              color: wallet.isTracked ? '#10b981' : 
                                     wallet.name !== 'unknown' ? '#f59e0b' : '#6b7280'
                            }}>
                              {wallet.isTracked && '⭐ '}
                              {wallet.name !== 'unknown' ? wallet.name : `${wallet.address.substring(0, 8)}...`}
                            </span>
                          </div>
                          <div className="connection-stats">
                            <span className="connection-count">{wallet.link.count} txs</span>
                            <span className="connection-volume">${formatNumber(wallet.link.volume)}</span>
                          </div>
                        </div>
                        <button
                          className={`quick-track-btn ${wallet.isTracked ? 'tracked' : ''}`}
                          onClick={() => handleTrackWallet(wallet)}
                          title={wallet.isTracked ? 'Click to untrack' : 'Click to track'}
                        >
                          {wallet.isTracked ? '✓' : '+'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="network-stats">
        <div className="stat-item">
          <span className="stat-label">Total Wallets:</span>
          <span className="stat-value">{nodes.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Connections:</span>
          <span className="stat-value">{links.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Tracked:</span>
          <span className="stat-value" style={{ color: '#10b981' }}>
            {nodes.filter(n => n.isTracked).length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Exchanges:</span>
          <span className="stat-value" style={{ color: '#f59e0b' }}>
            {nodes.filter(n => n.name !== 'unknown' && !n.isTracked).length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WalletNetworkMap;