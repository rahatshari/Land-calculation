import React, { useState, useEffect } from 'react';
import { HeirCountInput, HeirTreeNode, IndividualHeirConfig, Gender } from './types';
import { 
  createCleanTree,
  createSampleTree,
  recalculateEntireTree, 
  updateNodeInTree,
  deleteNodeFromTree
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
import { calculateFaraizDistribution, toBengaliNumber } from './utils/faraizCalculator';
import { Sparkles, Info } from 'lucide-react';

const STORAGE_KEY = 'uttoradhikar_tree_state_clean_v2';

export default function App() {
  // App Main State: Start clean with Rahat, 100 decimals, without fake demo data
  const [treeData, setTreeData] = useState<HeirTreeNode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // fallback
    }
    return createCleanTree('রাহাত', 100, 'male');
  });

  const [activeView, setActiveView] = useState<'tree' | 'table'>('tree');

  // Modals state
  const [selectedNodeForHeirs, setSelectedNodeForHeirs] = useState<HeirTreeNode | null>(null);
  const [selectedNodeForDetails, setSelectedNodeForDetails] = useState<HeirTreeNode | null>(null);
  const [isMultiGenOpen, setIsMultiGenOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isConverterOpen, setIsConverterOpen] = useState(false);

  // Save state to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(treeData));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }, [treeData]);

  // Update Root Owner Land, Name & Gender directly
  const handleUpdateRoot = (name: string, gender: Gender, totalLand: number) => {
    setTreeData((prev) => {
      const updated: HeirTreeNode = {
        ...prev,
        name,
        gender,
        totalEstate: totalLand,
        inheritedEstate: totalLand,
      };
      return recalculateEntireTree(updated);
    });
  };

  // Load sample scenario (user can check whenever they want)
  const handleLoadSample = () => {
    const sample = createSampleTree();
    setTreeData(sample);
  };

  // Reset to clean state (no heirs)
  const handleClearTree = () => {
    if (window.confirm('আপনি কি সমস্ত ওয়ারিশ মুছে ফেলে নতুন করে হিসাব শুরু করতে চান?')) {
      const clean = createCleanTree(treeData.name, treeData.totalEstate, treeData.gender);
      setTreeData(clean);
    }
  };

  // Delete specific node/branch
  const handleDeleteNode = (nodeId: string) => {
    setTreeData((prev) => deleteNodeFromTree(prev, nodeId));
  };

  // Toggle node collapse/expand
  const handleToggleCollapse = (nodeId: string) => {
    setTreeData((prev) =>
      updateNodeInTree(prev, nodeId, (node) => ({
        ...node,
        isCollapsed: !node.isCollapsed,
      }))
    );
  };

  // Expand all branches
  const handleExpandAll = () => {
    function expand(node: HeirTreeNode): HeirTreeNode {
      return {
        ...node,
        isCollapsed: false,
        children: node.children ? node.children.map(expand) : [],
      };
    }
    setTreeData((prev) => expand(prev));
  };

  // Collapse all branches except root
  const handleCollapseAll = () => {
    function collapse(node: HeirTreeNode): HeirTreeNode {
      return {
        ...node,
        isCollapsed: node.relationship !== 'root',
        children: node.children ? node.children.map(collapse) : [],
      };
    }
    setTreeData((prev) => collapse(prev));
  };

  // Save Heirs for any node (Generation 1, 2, 3...)
  const handleSaveHeirs = (
    nodeId: string,
    inputConfig: HeirCountInput,
    namedHeirs: IndividualHeirConfig[],
    extraLand: number
  ) => {
    setTreeData((prev) => {
      return updateNodeInTree(prev, nodeId, (node) => {
        const newTotal = (node.inheritedEstate || 0) + extraLand;
        const newShares = calculateFaraizDistribution(
          node.gender,
          newTotal,
          inputConfig,
          namedHeirs,
          node.id
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
          totalEstate: newTotal,
          inputConfig,
          namedHeirs,
          isCollapsed: false,
          children: newChildren,
        };
      });
    });
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
        onLoadSample={handleLoadSample}
        onClearTree={handleClearTree}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Primary Root Owner Controller Card */}
        <RootOwnerCard
          rootNode={treeData}
          onUpdateRoot={handleUpdateRoot}
          onOpenHeirModal={() => setSelectedNodeForHeirs(treeData)}
          onOpenMultiGenModal={() => setIsMultiGenOpen(true)}
        />

        {/* Dynamic View: Tree or Table */}
        {activeView === 'tree' ? (
          <div className="space-y-4">
            <InheritanceTreeView
              rootNode={treeData}
              onSelectNodeForHeirs={(node) => setSelectedNodeForHeirs(node)}
              onOpenMultiGenModal={() => setIsMultiGenOpen(true)}
              onViewDetails={(node) => setSelectedNodeForDetails(node)}
              onDeleteNode={handleDeleteNode}
              onToggleCollapse={handleToggleCollapse}
              onExpandAll={handleExpandAll}
              onCollapseAll={handleCollapseAll}
              onEditRoot={() => setSelectedNodeForHeirs(treeData)}
            />

            {/* Quick multi-generational explainer banner */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-4 rounded-2xl border border-emerald-200/60 flex items-start gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                <strong className="text-emerald-950 font-bold block text-sm">
                  পরবর্তী প্রজন্মের উত্তরাধিকার বণ্টন নির্দেশিকা:
                </strong>
                <p>
                  ১. যেকোনো ছেলে বা মেয়ের কার্ডে থাকা <strong>‘+ ওয়ারিশ’</strong> বাটনে ক্লিক করে তাদের স্ত্রী/স্বামী, পুত্র বা কন্যা যোগ করুন।
                </p>
                <p>
                  ২. উক্ত সন্তানের প্রাপ্ত জমি স্বয়ংক্রিয়ভাবে তার সন্তানদের মধ্যে ২:১ অনুপাতে এবং স্ত্রী/স্বামীর মধ্যে শরীয়াহ নীতি অনুযায়ী বিভক্ত হয়ে নতুন শাখা গঠন করবে।
                </p>
                <p>
                  ৩. কার্ডের <strong>‘−’</strong> বা <strong>‘+’</strong> বাটনে ক্লিক করে শাখা সংকুচিত বা প্রসারিত করতে পারবেন।
                </p>
              </div>
            </div>
          </div>
        ) : (
          <TableView
            rootNode={treeData}
            onSelectNodeForHeirs={(node) => setSelectedNodeForHeirs(node)}
            onOpenReport={() => setIsReportOpen(true)}
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
        />
      )}

      {selectedNodeForDetails && (
        <NodeDetailsModal
          node={selectedNodeForDetails}
          onClose={() => setSelectedNodeForDetails(null)}
          onAddHeirs={(node) => setSelectedNodeForHeirs(node)}
        />
      )}

      {isReportOpen && (
        <ReportModal
          rootNode={treeData}
          onClose={() => setIsReportOpen(false)}
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
            setTreeData(newTree);
            setIsMultiGenOpen(false);
          }}
        />
      )}
    </div>
  );
}
