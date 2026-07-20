import React, { useCallback } from 'react';
import KnowledgeGraph from '@/components/synapse/KnowledgeGraph';
import AssetDetailPanel from '@/components/synapse/AssetDetailPanel';
import useNexusStore from '@/store/nexusStore';
import { getAsset } from '@/lib/api';

export default function Synapse() {
  const { selectedAsset, setSelectedAsset, assets } = useNexusStore();

  const handleNodeSelect = useCallback((asset) => {
    setSelectedAsset(asset);
  }, [setSelectedAsset]);

  const handleSelectTag = useCallback(async (tag) => {
    // First check local assets array
    const found = assets.find((a) => a.tag === tag || a.id === tag);
    if (found) {
      setSelectedAsset(found);
    } else {
      // Fetch from API
      const { data } = await getAsset(tag);
      if (data && data.asset) {
        setSelectedAsset(data.asset);
      }
    }
  }, [assets, setSelectedAsset]);

  const handleClosePanel = useCallback(() => {
    setSelectedAsset(null);
  }, [setSelectedAsset]);

  return (
    <div style={{ background: '#F5F0E8' }} className="w-full h-[calc(100vh-3.5rem)] flex overflow-hidden">
      {/* Left Panel: D3 Force-Directed Canvas */}
      <div className={`${selectedAsset ? 'w-[65%]' : 'w-[75%]'} h-full transition-all duration-300 ease-in-out relative flex-shrink-0`}>
        <KnowledgeGraph
          onNodeSelect={handleNodeSelect}
          selectedAsset={selectedAsset}
        />
      </div>

      {/* Right Panel: Asset Detail & Inspection */}
      <div className={`${selectedAsset ? 'w-[35%]' : 'w-[25%]'} h-full transition-all duration-300 ease-in-out relative flex-shrink-0 border-l border-nexus-border shadow-2xl`}>
        <AssetDetailPanel
          selectedAsset={selectedAsset}
          onClose={handleClosePanel}
          onSelectTag={handleSelectTag}
        />
      </div>
    </div>
  );
}
