import { Gender, HeirCountInput, HeirTreeNode, IndividualHeirConfig } from '../types';
import { calculateFaraizDistribution, toBengaliNumber } from './faraizCalculator';

/**
 * Creates clean initial tree with just the root owner (NO fake demo descendants)
 */
export function createCleanTree(name = 'রাহাত', totalLand = 100, gender: Gender = 'male'): HeirTreeNode {
  return {
    id: 'root-owner',
    name,
    gender,
    relationship: 'root',
    relationshipBn: 'মূল ভূম্যধিকারী',
    generation: 0,
    totalEstate: totalLand,
    inheritedEstate: totalLand,
    extraEstate: 0,
    shareFractionStr: '১/১',
    sharePercentage: 100,
    legalReasonBn: 'মূল জোতদার ও সম্পত্তির একক স্বত্বাধিকারী',
    children: [],
  };
}

/**
 * Creates a sample scenario (Rahat 100 decimals, 2 sons and 3 daughters)
 * only loaded if the user clicks "নমুনা ডাটা দেখুন"
 */
export function createSampleTree(): HeirTreeNode {
  const rootTotalLand = 100;
  
  const rootInput: HeirCountInput = {
    husband: 0,
    wives: 0,
    sons: 2,
    daughters: 3,
    father: false,
    mother: false,
    grandfather: false,
    grandmother: false,
    brothers: 0,
    sisters: 0,
  };

  const gen1Shares = calculateFaraizDistribution('male', rootTotalLand, rootInput, [
    { id: 'son-1', name: 'ছেলে ১ (আরিফ)', relationship: 'son', relationshipBn: 'পুত্র', gender: 'male' },
    { id: 'son-2', name: 'ছেলে ২ (তারিক)', relationship: 'son', relationshipBn: 'পুত্র', gender: 'male' },
    { id: 'daughter-1', name: 'মেয়ে ১ (সুমাইয়া)', relationship: 'daughter', relationshipBn: 'কন্যা', gender: 'female' },
    { id: 'daughter-2', name: 'মেয়ে ২ (নুসরাত)', relationship: 'daughter', relationshipBn: 'কন্যা', gender: 'female' },
    { id: 'daughter-3', name: 'মেয়ে ৩ (আয়েশা)', relationship: 'daughter', relationshipBn: 'কন্যা', gender: 'female' },
  ], 'root');

  const gen1Nodes: HeirTreeNode[] = gen1Shares.map((s) => ({
    id: s.id,
    name: s.name,
    gender: s.gender,
    relationship: s.relationship,
    relationshipBn: s.relationshipBn,
    generation: 1,
    totalEstate: s.landDecimals,
    inheritedEstate: s.landDecimals,
    extraEstate: 0,
    shareFractionStr: s.shareFractionStr,
    sharePercentage: s.sharePercentage,
    legalReasonBn: s.legalReasonBn,
    children: [],
  }));

  const rootNode: HeirTreeNode = {
    id: 'root-owner',
    name: 'রাহাত (মূল মালিক)',
    gender: 'male',
    relationship: 'root',
    relationshipBn: 'মূল ভূম্যধিকারী',
    generation: 0,
    totalEstate: rootTotalLand,
    inheritedEstate: rootTotalLand,
    extraEstate: 0,
    shareFractionStr: '১/১',
    sharePercentage: 100,
    legalReasonBn: 'মূল জোতদার ও সম্পত্তির একক স্বত্বাধিকারী',
    inputConfig: rootInput,
    children: gen1Nodes,
  };

  return rootNode;
}

/**
 * Recursively recalculates all branches in the tree starting from root or updated node
 */
export function recalculateEntireTree(node: HeirTreeNode): HeirTreeNode {
  if (!node.children || node.children.length === 0 || !node.inputConfig) {
    return { ...node };
  }

  // Calculate distribution for this node's children based on its totalEstate
  const distributableLand = node.totalEstate;
  const newShares = calculateFaraizDistribution(
    node.gender,
    distributableLand,
    node.inputConfig,
    node.namedHeirs,
    node.id
  );

  const usedIndices = new Set<number>();

  // Map updated values to existing children or create new children
  const updatedChildren: HeirTreeNode[] = newShares.map((share, shareIdx) => {
    // 1. Look for matching child by exact ID
    let existingIndex = node.children.findIndex((c) => c.id === share.id);

    // 2. Fallback: match by relationship not yet matched
    if (existingIndex === -1) {
      existingIndex = node.children.findIndex(
        (c, idx) => c.relationship === share.relationship && !usedIndices.has(idx)
      );
    }

    // 3. Fallback: match by position
    if (existingIndex === -1 && shareIdx < node.children.length && !usedIndices.has(shareIdx)) {
      existingIndex = shareIdx;
    }

    const existing = existingIndex !== -1 ? node.children[existingIndex] : undefined;
    if (existingIndex !== -1) usedIndices.add(existingIndex);

    const extra = existing ? existing.extraEstate || 0 : 0;
    const newTotal = share.landDecimals + extra;

    const childNode: HeirTreeNode = {
      id: existing?.id || share.id,
      name: existing?.name || share.name,
      gender: share.gender,
      relationship: share.relationship,
      relationshipBn: share.relationshipBn,
      generation: node.generation + 1,
      totalEstate: newTotal,
      inheritedEstate: share.landDecimals,
      extraEstate: extra,
      shareFractionStr: share.shareFractionStr,
      sharePercentage: share.sharePercentage,
      legalReasonBn: share.legalReasonBn,
      isCollapsed: existing?.isCollapsed ?? false,
      inputConfig: existing?.inputConfig,
      namedHeirs: existing?.namedHeirs,
      children: existing?.children || [],
    };

    // Recursively recalculate this child's descendants if any
    return recalculateEntireTree(childNode);
  });

  return {
    ...node,
    children: updatedChildren,
  };
}

/**
 * Recursively finds and updates a specific node in the tree by ID without erasing other branches
 */
export function updateNodeInTree(
  root: HeirTreeNode,
  targetId: string,
  updateFn: (node: HeirTreeNode) => HeirTreeNode
): HeirTreeNode {
  if (root.id === targetId) {
    const updated = updateFn(root);
    return recalculateEntireTree(updated);
  }

  if (!root.children || root.children.length === 0) {
    return root;
  }

  let childModified = false;
  const newChildren = root.children.map((child) => {
    const updatedChild = updateNodeInTree(child, targetId, updateFn);
    if (updatedChild !== child) {
      childModified = true;
    }
    return updatedChild;
  });

  if (!childModified) {
    return root;
  }

  return {
    ...root,
    children: newChildren,
  };
}

/**
 * Delete a specific child node from the tree and redistribute
 */
export function deleteNodeFromTree(root: HeirTreeNode, targetId: string): HeirTreeNode {
  if (root.id === targetId) {
    // Cannot delete root, clear its children instead
    return {
      ...root,
      children: [],
      inputConfig: undefined,
      namedHeirs: undefined,
    };
  }

  if (!root.children || root.children.length === 0) {
    return root;
  }

  // Check if target is a direct child
  const hasTarget = root.children.some((c) => c.id === targetId);
  if (hasTarget && root.inputConfig) {
    const targetChild = root.children.find((c) => c.id === targetId)!;
    // Decrement the corresponding count in inputConfig
    const newConfig = { ...root.inputConfig };
    if (targetChild.relationship === 'son') newConfig.sons = Math.max(0, newConfig.sons - 1);
    else if (targetChild.relationship === 'daughter') newConfig.daughters = Math.max(0, newConfig.daughters - 1);
    else if (targetChild.relationship === 'wife') newConfig.wives = Math.max(0, newConfig.wives - 1);
    else if (targetChild.relationship === 'husband') newConfig.husband = 0;
    else if (targetChild.relationship === 'father') newConfig.father = false;
    else if (targetChild.relationship === 'mother') newConfig.mother = false;

    const remainingNamed = root.namedHeirs?.filter((h) => h.id !== targetId);

    const updatedParent: HeirTreeNode = {
      ...root,
      inputConfig: newConfig,
      namedHeirs: remainingNamed,
      children: root.children.filter((c) => c.id !== targetId),
    };

    return recalculateEntireTree(updatedParent);
  }

  // Search recursively in deeper branches
  const newChildren = root.children.map((child) =>
    deleteNodeFromTree(child, targetId)
  );

  return recalculateEntireTree({
    ...root,
    children: newChildren,
  });
}

/**
 * Recursively counts all heirs in tree
 */
export function countTotalHeirs(root: HeirTreeNode): number {
  let count = root.relationship === 'root' ? 0 : 1;
  if (root.children && root.children.length > 0) {
    for (const child of root.children) {
      count += countTotalHeirs(child);
    }
  }
  return count;
}

/**
 * Calculates max generation depth
 */
export function getMaxGeneration(root: HeirTreeNode): number {
  if (!root.children || root.children.length === 0) {
    return root.generation;
  }
  return Math.max(...root.children.map(getMaxGeneration));
}

/**
 * Flattens tree into array for Table and CSV Export
 */
export interface FlatHeirRow {
  sl: number;
  id: string;
  name: string;
  relationshipBn: string;
  generation: number;
  parentName: string;
  inheritedEstate: number;
  extraEstate: number;
  totalEstate: number;
  shareFractionStr: string;
  sharePercentage: number;
  landKatha: number;
  landBigha: number;
  landSqFt: number;
  legalReasonBn: string;
  childrenCount: number;
}

export function flattenTreeForReport(
  root: HeirTreeNode,
  decimalsPerKatha = 3.30,
  kathaPerBigha = 20
): FlatHeirRow[] {
  const rows: FlatHeirRow[] = [];
  let sl = 1;

  function traverse(node: HeirTreeNode, parentName: string) {
    if (node.relationship !== 'root') {
      const katha = node.totalEstate / (decimalsPerKatha || 3.30);
      const bigha = node.totalEstate / ((decimalsPerKatha || 3.30) * (kathaPerBigha || 20));
      const sqft = node.totalEstate * 435.6;

      rows.push({
        sl: sl++,
        id: node.id,
        name: node.name,
        relationshipBn: node.relationshipBn,
        generation: node.generation,
        parentName,
        inheritedEstate: node.inheritedEstate,
        extraEstate: node.extraEstate,
        totalEstate: node.totalEstate,
        shareFractionStr: node.shareFractionStr,
        sharePercentage: node.sharePercentage,
        landKatha: katha,
        landBigha: bigha,
        landSqFt: sqft,
        legalReasonBn: node.legalReasonBn,
        childrenCount: node.children ? node.children.length : 0,
      });
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        traverse(child, node.name);
      }
    }
  }

  traverse(root, root.name);
  return rows;
}

/**
 * Exports data to CSV string
 */
export function exportToCSV(
  root: HeirTreeNode,
  decimalsPerKatha = 3.30,
  kathaPerBigha = 20
): string {
  const rows = flattenTreeForReport(root, decimalsPerKatha, kathaPerBigha);
  const headers = [
    'ক্রমিক',
    'নাম',
    'সম্পর্ক',
    'প্রজন্ম (Generation)',
    'পিতা/মাতার নাম',
    'উত্তরাধিকার প্রাপ্ত জমি (শতক)',
    'অতিরিক্ত জমি (শতক)',
    'মোট জমি (শতক)',
    'হিস্যা ভগ্নাংশ',
    'শতকরা (%)',
    'কাঠা',
    'বিঘা',
    'বর্গফুট',
    'আইনি ভিত্তি ও দলিল',
  ];

  const csvRows = [headers.join(',')];

  for (const r of rows) {
    const rowData = [
      r.sl,
      `"${r.name}"`,
      `"${r.relationshipBn}"`,
      `"প্রজন্ম ${r.generation}"`,
      `"${r.parentName}"`,
      r.inheritedEstate.toFixed(4),
      r.extraEstate.toFixed(4),
      r.totalEstate.toFixed(4),
      `"${r.shareFractionStr}"`,
      `${r.sharePercentage.toFixed(2)}%`,
      r.landKatha.toFixed(3),
      r.landBigha.toFixed(3),
      r.landSqFt.toFixed(1),
      `"${r.legalReasonBn.replace(/"/g, '""')}"`,
    ];
    csvRows.push(rowData.join(','));
  }

  return '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel UTF-8 support
}
