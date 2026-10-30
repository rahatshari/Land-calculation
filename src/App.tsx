import React, { useState, useEffect, useMemo } from 'react';
import { HeirCountInput, HeirTreeNode, IndividualHeirConfig, Gender, LandTransaction } from './types';
import { 
  createCleanTree,
  createSampleTree,
  recalculateEntireTree, 
  updateNodeInTree,
  deleteNodeFromTree,
  applyTransactionsToTree
} from './utils/treeManager';
import { Header } from './components/Header';
import { RootOwnerCard } from './components/RootOwnerCard';
import { InheritanceTreeView } from './components/InheritanceTreeView';
import { TableView } from './components/TableView';
import { AddHeirModal } from './components/AddHeirModal';
import { NodeDetailsModal } from './components/NodeDetailsModal';
import { ReportModal } from './components/ReportModal';
import { LandUnitConverter } from './components/LandUnitConverter';
import { MultiGenModal } from './components/MultiGenModal';
import { LandTransactionModal } from './components/LandTransactionModal';
import { calculateFaraizDistribution, toBengaliNumber } from './utils/faraizCalculator';
import { Sparkles, ArrowRightLeft } from 'lucide-react';

const STORAGE_TREE_KEY = 'uttoradhikar_tree_state_v3';
const STORAGE_TX_KEY = 'uttoradhikar_transactions_v3';

export default function App() {
  // 1. Raw Tree State
  const [rawTreeData, setRawTreeData] = useState<HeirTreeNode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TREE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // fallback
    }
    return createCleanTree('রাহাত', 100, 'male');
  });

  // 2. Transactions State (জমি ক্রয়-বিক্রয় ও হস্তান্তর)
  const [transactions, setTransactions] = useState<LandTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TX_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  // 3. Tree data with all land transactions automatically applied
  const treeData = useMemo(() => {
    return applyTransactionsToTree(rawTreeData, transactions);
  }, [rawTreeData, transactions]);

  const [activeView, setActiveView] = useState<'tree' | 'table'>('tree');

  // Modals state
  const [selectedNodeForHeirs, setSelectedNodeForHeirs] = useState<HeirTreeNode | null>(null);
  const [selectedNodeForDetails, setSelectedNodeForDetails] = useState<HeirTreeNode | null>(null);
  const [isMultiGenOpen, setIsMultiGenOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionDefaultPersonId, setTransactionDefaultPersonId] = useState<string | undefined>(undefined);

  // Regional config
  const decimalsPerKatha = 3.30;
  const kathaPerBigha = 20;

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TREE_KEY, JSON.stringify(rawTreeData));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }, [rawTreeData]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TX_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Transactions storage save error:', e);
    }
  }, [transactions]);

  // Update Root Owner Land, Name & Gender
  const handleUpdateRoot = (name: string, gender: Gender, totalLand: number) => {
    setRawTreeData((prev) => {
      const updated: HeirTreeNode = {
        ...prev,
        name,
        gender,
        totalEstate: totalLand,
        inheritedEstate: totalLand,
        currentTotalLand: totalLand,
      };
      return recalculateEntireTree(updated);
    });
  };

  // Load sample scenario with example purchase/sale
  const handleLoadSample = () => {
    const sample = createSampleTree();
    setRawTreeData(sample);
    // User requested example: Nahar sold 5 dec to Hasib, Kulsum sold 5 dec to Hasib!
    const sampleTxs: LandTransaction[] = [
      {
        id: 'tx-1',
        sellerId: 'daughter-1',
        sellerName: 'মেয়ে ১ (নাহার)',
        buyerId: 'son-1',
        buyerName: 'ছেলে ১ (হাসিব)',
        amountDecimals: 5,
        date: new Date().toLocaleDateString('bn-BD'),
        note: 'সাব-কবলা দলিল মূলে নাহার হাসিবের কাছে ৫ শতক বিক্রি করেছেন',
      },
      {
        id: 'tx-2',
        sellerId: 'daughter-2',
        sellerName: 'মেয়ে ২ (কুলসুম)',
        buyerId: 'son-1',
        buyerName: 'ছেলে ১ (হাসিব)',
        amountDecimals: 5,
        date: new Date().toLocaleDateString('bn-BD'),
        note: 'আপস বণ্টন মূলে কুলসুম হাসিবের কাছে ৫ শতক বিক্রি করেছেন',
      },
    ];
    setTransactions(sampleTxs);
  };

  // Reset to clean state (no heirs, no transactions)
  const handleClearTree = () => {
    if (window.confirm('আপনি কি সমস্ত তথ্য ও ক্রয়-বিক্রয় মুছে ফেলে নতুন করে হিসাব শুরু করতে চান?')) {
      const clean = createCleanTree(rawTreeData.name, rawTreeData.totalEstate, rawTreeData.gender);
      setRawTreeData(clean);
      setTransactions([]);
    }
  };

  // Delete specific node/branch
  const handleDeleteNode = (nodeId: string) => {
    setRawTreeData((prev) => deleteNodeFromTree(prev, nodeId));
    // Remove transactions involving this person
    setTransactions((prev) => prev.filter((t) => t.sellerId !== nodeId && t.buyerId !== nodeId));
  };

  // Toggle node collapse/expand
  const handleToggleCollapse = (nodeId: string) => {
    setRawTreeData((prev) =>
      updateNodeInTree(prev, nodeId, (node) => ({
        ...node,
        isCollapsed: !node.isCollapsed,
      }))
    );
  };

  const handleExpandAll = () => {
    function expand(node: HeirTreeNode): HeirTreeNode {
      return {
        ...node,
        isCollapsed: false,
        children: node.children ? node.children.map(expand) : [],
      };
    }
    setRawTreeData((prev) => expand(prev));
  };

  const handleCollapseAll = () => {
    function collapse(node: HeirTreeNode): HeirTreeNode {
      return {
        ...node,
        isCollapsed: node.relationship !== 'root',
        children: node.children ? node.children.map(collapse) : [],
      };
    }
    setRawTreeData((prev) => collapse(prev));
  };

  // Save Heirs for any node (Generation 1, 2, 3...)
  const handleSaveHeirs = (
    nodeId: string,
    inputConfig: HeirCountInput,
    namedHeirs: IndividualHeirConfig[],
    extraLand: number
  ) => {
    setRawTreeData((prev) => {
      return updateNodeInTree(prev, nodeId, (node) => {
        const netBase = (node.inheritedEstate || 0) + extraLand;
        const newShares = calculateFaraizDistribution(
          node.gender,
          netBase,
          inputConfig,
          namedHeirs,
          node.id,
          decimalsPerKatha,
          kathaPerBigha
        );

        const newChildren: HeirTreeNode[] = newShares.map((s) => {
          const existingChild = node.children.find((c) => c.id === s.id);
          return {
            id: s.id,
            name: s.name,
            gender: s.gender,
            relationship: s.relationship,
            relationshipBn: s.relationshipBn,
            generation: node.generation + 1,
            totalEstate: s.landDecimals + (existingChild?.extraEstate || 0),
            inheritedEstate: s.landDecimals,
            extraEstate: existingChild?.extraEstate || 0,
            landBought: existingChild?.landBought || 0,
            landSold: existingChild?.landSold || 0,
            currentTotalLand: s.landDecimals + (existingChild?.extraEstate || 0),
            shareFractionStr: s.shareFractionStr,
            sharePercentage: s.sharePercentage,
            legalReasonBn: s.legalReasonBn,
            isCollapsed: existingChild?.isCollapsed ?? false,
            inputConfig: existingChild?.inputConfig,
            namedHeirs: existingChild?.namedHeirs,
            children: existingChild?.children || [],
          };
        });

        return {
          ...node,
          extraEstate: extraLand,
          totalEstate: netBase,
          inputConfig,
          namedHeirs,
          isCollapsed: false,
          children: newChildren,
        };
      });
    });
  };

  // Add Land Transaction
  const handleAddTransaction = (newTx: Omit<LandTransaction, 'id'>) => {
    const tx: LandTransaction = {
      ...newTx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setTransactions((prev) => [tx, ...prev]);
  };

  // Delete Land Transaction
  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenTransactionForPerson = (personId: string) => {
    setTransactionDefaultPersonId(personId);
    setIsTransactionModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <Header
        rootNode={treeData}
        activeView={activeView}
        onToggleView={setActiveView}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenConverter={() => setIsConverterOpen(true)}
        onOpenTransactions={() => {
          setTransactionDefaultPersonId(undefined);
          setIsTransactionModalOpen(true);
        }}
        onLoadSample={handleLoadSample}
        onClearTree={handleClearTree}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-5">
        {/* Primary Root Owner Controller Card with Big Logo Banner */}
        <RootOwnerCard
          rootNode={treeData}
          decimalsPerKatha={decimalsPerKatha}
          kathaPerBigha={kathaPerBigha}
          onUpdateRoot={handleUpdateRoot}
          onOpenHeirModal={() => setSelectedNodeForHeirs(treeData)}
          onOpenMultiGenModal={() => setIsMultiGenOpen(true)}
          onOpenTransactions={() => {
            setTransactionDefaultPersonId(undefined);
            setIsTransactionModalOpen(true);
          }}
        />

        {/* Dynamic View: Tree or Table */}
        {activeView === 'tree' ? (
          <div className="space-y-4">
            <InheritanceTreeView
              rootNode={treeData}
              decimalsPerKatha={decimalsPerKatha}
              onSelectNodeForHeirs={(node) => setSelectedNodeForHeirs(node)}
              onOpenMultiGenModal={() => setIsMultiGenOpen(true)}
              onViewDetails={(node) => setSelectedNodeForDetails(node)}
              onDeleteNode={handleDeleteNode}
              onToggleCollapse={handleToggleCollapse}
              onExpandAll={handleExpandAll}
              onCollapseAll={handleCollapseAll}
              onEditRoot={() => setSelectedNodeForHeirs(treeData)}
            />

            {/* Quick multi-generational & transaction explainer banner */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-4 rounded-2xl border border-emerald-200/60 flex items-start gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                <strong className="text-emerald-950 font-bold block text-sm">
                  উত্তরাধিকার ও জমি ক্রয়-বিক্রয় নির্দেশিকা:
                </strong>
                <p>
                  ১. <strong>‘+ ওয়ারিশ’</strong> বাটনে ক্লিক করে যেকোনো বংশধরের ওয়ারিশ যোগ করতে পারবেন (নিঃসন্তান ব্যক্তির ক্ষেত্রে ভাই-বোন ও আসাবাগণ স্বয়ংক্রিয়ভাবে তালিকাভুক্ত হবে)।
                </p>
                <p>
                  ২. <strong>‘জমি ক্রয়-বিক্রয়’</strong> অপশনে ক্লিক করে যেকোনো ওয়ারিশের থেকে অন্য ওয়ারিশ জমি ক্রয় করলে বিক্রেতার জমি বাদ যাবে ও ক্রেতার জমিতে স্বয়ংক্রিয়ভাবে যোগ হবে।
                </p>
                <p>
                  ৩. যেকোনো ওয়ারিশের কার্ডে <strong>‘তথ্য (i)’</strong> বাটনে ক্লিক করলে তার ব্যক্তিগত প্রাপ্তি ও ক্রয়-বিক্রয়ের পূর্ণাঙ্গ লেজার রিপোর্ট দেখতে পাবেন।
                </p>
              </div>
            </div>
          </div>
        ) : (
          <TableView
            rootNode={treeData}
            decimalsPerKatha={decimalsPerKatha}
            onSelectNodeForHeirs={(node) => setSelectedNodeForHeirs(node)}
            onOpenReport={() => setIsReportOpen(true)}
            onViewDetails={(node) => setSelectedNodeForDetails(node)}
            onOpenTransactions={() => {
              setTransactionDefaultPersonId(undefined);
              setIsTransactionModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          উত্তরাধিকার ও ভূমির হিসাব বৃক্ষ © {new Date().getFullYear()} • বাংলাদেশ মুসলিম পারিবারিক আইন ১৯৬১ ও পবিত্র কুরআন অনুসৃত হিসাব ব্যবস্থা।
        </p>
      </footer>

      {/* Modals */}
      {selectedNodeForHeirs && (
        <AddHeirModal
          targetNode={selectedNodeForHeirs}
          onClose={() => setSelectedNodeForHeirs(null)}
          onSaveHeirs={handleSaveHeirs}
          decimalsPerKatha={decimalsPerKatha}
          kathaPerBigha={kathaPerBigha}
        />
      )}

      {selectedNodeForDetails && (
        <NodeDetailsModal
          node={selectedNodeForDetails}
          transactions={transactions}
          onClose={() => setSelectedNodeForDetails(null)}
          onAddHeirs={(node) => setSelectedNodeForHeirs(node)}
          onOpenTransactionForPerson={handleOpenTransactionForPerson}
          decimalsPerKatha={decimalsPerKatha}
          kathaPerBigha={kathaPerBigha}
        />
      )}

      {isReportOpen && (
        <ReportModal
          rootNode={treeData}
          transactions={transactions}
          onClose={() => setIsReportOpen(false)}
          decimalsPerKatha={decimalsPerKatha}
          kathaPerBigha={kathaPerBigha}
        />
      )}

      {isTransactionModalOpen && (
        <LandTransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          rootNode={treeData}
          transactions={transactions}
          onAddTransaction={handleAddTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          defaultPersonId={transactionDefaultPersonId}
        />
      )}

      {isConverterOpen && (
        <LandUnitConverter
          isOpen={isConverterOpen}
          onClose={() => setIsConverterOpen(false)}
        />
      )}

      {isMultiGenOpen && (
        <MultiGenModal
          rootNode={treeData}
          onClose={() => setIsMultiGenOpen(false)}
          onSaveEntireTree={(newTree) => {
            setRawTreeData(newTree);
            setIsMultiGenOpen(false);
          }}
        />
      )}
    </div>
  );
}
