import React, { useRef } from 'react';
import { getTrackedWallets, saveTrackedWallets } from '../services/api';

const WalletManager = ({ onUpdate }) => {
  const fileInputRef = useRef(null);

  // Export wallets to JSON file
  const handleExport = () => {
    const wallets = getTrackedWallets();
    
    if (wallets.length === 0) {
      alert('No wallets to export! Add some wallets first.');
      return;
    }

    const dataStr = JSON.stringify(wallets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `whale-tracker-wallets-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert(`✅ Exported ${wallets.length} wallets successfully!`);
  };

  // Import wallets from JSON file
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedWallets = JSON.parse(e.target.result);
        
        // Validate structure
        if (!Array.isArray(importedWallets)) {
          throw new Error('Invalid file format');
        }

        // Get existing wallets
        const existingWallets = getTrackedWallets();
        
        // Merge and remove duplicates (by address)
        const allWallets = [...existingWallets, ...importedWallets];
        const uniqueWallets = allWallets.filter((wallet, index, self) =>
          index === self.findIndex((w) => w.address.toLowerCase() === wallet.address.toLowerCase())
        );

        // Save merged list
        saveTrackedWallets(uniqueWallets);
        onUpdate();
        
        const newCount = uniqueWallets.length - existingWallets.length;
        alert(`✅ Successfully imported ${importedWallets.length} wallets!\n\n${newCount} new wallets added.\n${existingWallets.length} existing wallets kept.\n\nTotal: ${uniqueWallets.length} wallets`);
      } catch (error) {
        alert('❌ Error importing wallets. Make sure you selected a valid wallet export file.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  // Clear all wallets
  const handleClearAll = () => {
    const wallets = getTrackedWallets();
    if (wallets.length === 0) {
      alert('No wallets to clear!');
      return;
    }

    const confirmed = window.confirm(
      `⚠️ WARNING: This will delete all ${wallets.length} tracked wallets!\n\nAre you sure? This cannot be undone.\n\nTip: Export your wallets first to save a backup!`
    );

    if (confirmed) {
      saveTrackedWallets([]);
      onUpdate();
      alert('✅ All wallets cleared!');
    }
  };

  return (
    <div className="wallet-manager">
      <button onClick={handleExport} className="manager-btn export-btn">
        💾 Export Wallets
      </button>
      
      <button 
        onClick={() => fileInputRef.current.click()} 
        className="manager-btn import-btn"
      >
        📥 Import Wallets
      </button>
      
      <button onClick={handleClearAll} className="manager-btn clear-btn">
        🗑️ Clear All
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default WalletManager;