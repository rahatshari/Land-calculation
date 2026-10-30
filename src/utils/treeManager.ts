import { Gender, HeirCountInput, HeirTreeNode, IndividualHeirConfig, LandTransaction } from '../types';
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
    landBought: 0,
    landSold: 0,
    currentTotalLand: totalLand,
    shareFractionStr: '১/১',
    sharePercentage: 100,
    legalReasonBn: 'মূল জোতদার ও সম্পত্তির একক স্বত্বাধিকারী',
    children: [],
  };
}

/**
 * Creates a sample scenario (Rahat 100 decimals, 2 sons and 3 daughters)
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
    { id: 'son-1', name: 'ছেলে ১ (হাসিব)', relationship: 'son', relationshipBn: 'পুত্র', gender: 'male' },
    { id: 'son-2', name: 'ছেলে ২ (সাকিব)', relationship: 'son', relationshipBn: 'পুত্র', gender: 'male' },
    { id: 'daughter-1', name: 'মেয়ে ১ (নাহার)', relationship: 'daughter', relationshipBn: 'কন্যা', gender: 'female' },
    { id: 'daughter-2', name: 'মেয়ে ২ (কুলসুম)', relationship: 'daughter', relationshipBn: 'কন্যা', gender: 'female' },
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
    landBought: 0,
    landSold: 0,
    currentTotalLand: s.landDecimals,
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
    landBought: 0,
    landSold: 0,
    currentTotalLand: rootTotalLand,
    shareFractionStr: '১/১',
    sharePercentage: 100,
    legalReasonBn: 'মূল জোতদার ও সম্পত্তির একক স্বত্বাধিকারী',
    inputConfig: rootInput,
    children: gen1Nodes,
  };

  return rootNode;
}

/**
 * Applies land purchase/sale transactions to every person in tree
 */
export function applyTransactionsToTree(
  root: HeirTreeNode,
  transactions: LandTransaction[] = []
): HeirTreeNode {
  const boughtMap = new Map<string, number>();
  const soldMap = new Map<string, number>();

  for (const tx of transactions) {
    boughtMap.set(tx.buyerId, (boughtMap.get(tx.buyerId) || 0) + tx.amountDecimals);
    soldMap.set(tx.sellerId, (soldMap.get(tx.sellerId) || 0) + tx.amountDecimals);
  }

  function updateNode(node: HeirTreeNode): HeirTreeNode {
    const bought = boughtMap.get(node.id) || 0;
    const sold = soldMap.get(node.id) || 0;
    const inherited = node.inheritedEstate || 0;
    const extra = node.extraEstate || 0;
    const netLand = Math.max(0, inherited + extra + bought - sold);

    const updatedChildren = (node.children || []).map(updateNode);

    return {
      ...node,
      landBought: bought,
      landSold: sold,
      currentTotalLand: netLand,
      totalEstate: netLand,
      children: updatedChildren,
    };
  }

  return updateNode(root);
}

/**
 * Extracts all individuals present in the tree
 */
export function getAllPersonsInTree(root: HeirTreeNode): {
  id: string;
  name: string;
  relationshipBn: string;
  generation: number;
  currentLand: number;
  inheritedLand: number;
}[] {
  const list: {
    id: string;
    name: string;
    relationshipBn: string;
    generation: number;
    currentLand: number;
    inheritedLand: number;
  }[] = [];

  function traverse(node: HeirTreeNode) {
    list.push({
      id: node.id,
      name: node.name,
      relationshipBn: node.relationshipBn,
      generation: node.generation,
      currentLand: node.currentTotalLand !== undefined ? node.currentTotalLand : node.totalEstate,
      inheritedLand: node.inheritedEstate || 0,
    });

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(root);
  return list;
}

/**
 * Recursively recalculates all branches in the tree
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

  const updatedChildren: HeirTreeNode[] = newShares.map((share, shareIdx) => {
    let existingIndex = node.children.findIndex((c) => c.id === share.id);

    if (existingIndex === -1) {
      existingIndex = node.children.findIndex(
        (c, idx) => c.relationship === share.relationship && !usedIndices.has(idx)
      );
    }

    if (existingIndex === -1 && shareIdx < node.children.length && !usedIndices.has(shareIdx)) {
      existingIndex = shareIdx;
    }

    const existing = existingIndex !== -1 ? node.children[existingIndex] : undefined;
    if (existingIndex !== -1) usedIndices.add(existingIndex);

    const extra = existing ? existing.extraEstate || 0 : 0;
    const bought = existing ? existing.landBought || 0 : 0;
    const sold = existing ? existing.landSold || 0 : 0;
    const netTotal = Math.max(0, share.landDecimals + extra + bought - sold);

    const childNode: HeirTreeNode = {
      id: existing?.id || share.id,
      name: existing?.name || share.name,
      gender: share.gender,
      relationship: share.relationship,
      relationshipBn: share.relationshipBn,
      generation: node.generation + 1,
      totalEstate: netTotal,
      inheritedEstate: share.landDecimals,
      extraEstate: extra,
      landBought: bought,
      landSold: sold,
      currentTotalLand: netTotal,
      shareFractionStr: share.shareFractionStr,
      sharePercentage: share.sharePercentage,
      legalReasonBn: share.legalReasonBn,
      isCollapsed: existing?.isCollapsed ?? false,
      inputConfig: existing?.inputConfig,
      namedHeirs: existing?.namedHeirs,
      children: existing?.children || [],
    };

    return recalculateEntireTree(childNode);
  });

  return {
    ...node,
    children: updatedChildren,
  };
}

/**
 * Updates a specific node in the tree by ID
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
 * Deletes a specific child node from the tree
 */
export function deleteNodeFromTree(root: HeirTreeNode, targetId: string): HeirTreeNode {
  if (root.id === targetId) {
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

  const hasTarget = root.children.some((c) => c.id === targetId);
  if (hasTarget && root.inputConfig) {
    const targetChild = root.children.find((c) => c.id === targetId)!;
    const newConfig = { ...root.inputConfig };
    if (targetChild.relationship === 'son') newConfig.sons = Math.max(0, newConfig.sons - 1);
    else if (targetChild.relationship === 'daughter') newConfig.daughters = Math.max(0, newConfig.daughters - 1);
    else if (targetChild.relationship === 'wife') newConfig.wives = Math.max(0, newConfig.wives - 1);
    else if (targetChild.relationship === 'husband') newConfig.husband = 0;
    else if (targetChild.relationship === 'father') newConfig.father = false;
    else if (targetChild.relationship === 'mother') newConfig.mother = false;
    else if (targetChild.relationship === 'brother') newConfig.brothers = Math.max(0, newConfig.brothers - 1);
    else if (targetChild.relationship === 'sister') newConfig.sisters = Math.max(0, newConfig.sisters - 1);

    const remainingNamed = root.namedHeirs?.filter((h) => h.id !== targetId);

    const updatedParent: HeirTreeNode = {
      ...root,
      inputConfig: newConfig,
      namedHeirs: remainingNamed,
      children: root.children.filter((c) => c.id !== targetId),
    };

    return recalculateEntireTree(updatedParent);
  }

  const newChildren = root.children.map((child) =>
    deleteNodeFromTree(child, targetId)
  );

  return recalculateEntireTree({
    ...root,
    children: newChildren,
  });
}

export function countTotalHeirs(root: HeirTreeNode): number {
  let count = root.relationship === 'root' ? 0 : 1;
  if (root.children && root.children.length > 0) {
    for (const child of root.children) {
      count += countTotalHeirs(child);
    }
  }
  return count;
}

export function getMaxGeneration(root: HeirTreeNode): number {
  if (!root.children || root.children.length === 0) {
    return root.generation;
  }
  return Math.max(...root.children.map(getMaxGeneration));
}

export interface FlatHeirRow {
  sl: number;
  id: string;
  name: string;
  relationshipBn: string;
  generation: number;
  parentName: string;
  inheritedEstate: number;
  extraEstate: number;
  landBought: number;
  landSold: number;
  currentTotalLand: number;
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
      const netLand = node.currentTotalLand !== undefined ? node.currentTotalLand : node.totalEstate;
      const katha = netLand / (decimalsPerKatha || 3.30);
      const bigha = netLand / ((decimalsPerKatha || 3.30) * (kathaPerBigha || 20));
      const sqft = netLand * 435.6;

      rows.push({
        sl: sl++,
        id: node.id,
        name: node.name,
        relationshipBn: node.relationshipBn,
        generation: node.generation,
        parentName,
        inheritedEstate: node.inheritedEstate || 0,
        extraEstate: node.extraEstate || 0,
        landBought: node.landBought || 0,
        landSold: node.landSold || 0,
        currentTotalLand: netLand,
        totalEstate: netLand,
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
    'মূল প্রাপ্ত জমি (শতক)',
    'ক্রয়কৃত জমি (+ শতক)',
    'বিক্রিত জমি (- শতক)',
    'বর্তমান মোট জমি (শতক)',
    'হিস্যা ভগ্নাংশ',
    'কাঠা',
    'বিঘা',
  ];

  const csvRows = [headers.join(',')];

  for (const r of rows) {
    const rowData = [
      r.sl,
      `"${r.name}"`,
      `"${r.relationshipBn}"`,
      `"প্রজন্ম ${r.generation}"`,
      `"${r.parentName}"`,
      r.inheritedEstate.toFixed(2),
      r.landBought.toFixed(2),
      r.landSold.toFixed(2),
      r.currentTotalLand.toFixed(2),
      `"${r.shareFractionStr}"`,
      r.landKatha.toFixed(2),
      r.landBigha.toFixed(3),
    ];
    csvRows.push(rowData.join(','));
  }

  return '\uFEFF' + csvRows.join('\n');
}
