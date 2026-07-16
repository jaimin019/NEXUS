import { create } from 'zustand';

const useNexusStore = create((set) => ({
  // ---------------------------------------------------------------------------
  // Documents
  // ---------------------------------------------------------------------------
  documents: [],
  setDocuments: (docs) => set({ documents: docs }),
  addDocument: (doc) => set((state) => ({ documents: [doc, ...state.documents] })),
  updateDocumentStatus: (docId, status, metrics = {}) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d._id === docId ? { ...d, ingestion_status: status, ...metrics } : d
      ),
    })),

  // ---------------------------------------------------------------------------
  // Assets / Graph
  // ---------------------------------------------------------------------------
  assets: [],
  setAssets: (assets) => set({ assets }),
  selectedAsset: null,
  setSelectedAsset: (asset) => set({ selectedAsset: asset }),

  // ---------------------------------------------------------------------------
  // Query / ORACLE
  // ---------------------------------------------------------------------------
  conversationHistory: [],
  addMessage: (message) =>
    set((state) => ({
      conversationHistory: [
        ...state.conversationHistory,
        { ...message, timestamp: message.timestamp || new Date().toISOString() },
      ],
    })),
  clearConversation: () => set({ conversationHistory: [] }),
  isQuerying: false,
  setIsQuerying: (bool) => set({ isQuerying: bool }),

  // ---------------------------------------------------------------------------
  // Alerts
  // ---------------------------------------------------------------------------
  activeAlerts: [],
  setActiveAlerts: (alerts) => set({ activeAlerts: alerts }),
  dismissAlert: (id) =>
    set((state) => ({
      activeAlerts: state.activeAlerts.filter((a) => a._id !== id && a.id !== id),
    })),

  // ---------------------------------------------------------------------------
  // Compliance
  // ---------------------------------------------------------------------------
  complianceDashboard: null,
  setComplianceDashboard: (data) => set({ complianceDashboard: data }),

  // ---------------------------------------------------------------------------
  // Chronicle
  // ---------------------------------------------------------------------------
  failurePatterns: [],
  setFailurePatterns: (patterns) => set({ failurePatterns: patterns }),

  // ---------------------------------------------------------------------------
  // UI State
  // ---------------------------------------------------------------------------
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),
}));

export default useNexusStore;
