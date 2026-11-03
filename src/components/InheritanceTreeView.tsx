import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Plus, 
  Info, 
  Trash2, 
  UserPlus, 
  Focus,
  Maximize2,
  Minimize2,
  GitBranch,
  Edit2,
  Layers,
  ArrowRightLeft,
  ShoppingBag,
  FileText,
  X
} from 'lucide-react';
import { HeirTreeNode } from '../types';
import { toBengaliNumber } from '../utils/faraizCalculator';

interface InheritanceTreeViewProps {
  rootNode: HeirTreeNode;
  decimalsPerKatha?: number;
  onSelectNodeForHeirs: (node: HeirTreeNode) => void;
  onOpenMultiGenModal: () => void;
  onViewDetails: (node: HeirTreeNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onToggleCollapse: (nodeId: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onEditRoot?: () => void;
  onOpenTransaction?: (personId?: string, role?: 'seller' | 'buyer') => void;
  onOpenReport?: () => void;
}

interface LayoutNode {
  node: HeirTreeNode;
  x: number;
  y: number;
  width: number;
  height: number;
  children: LayoutNode[];
}

export const InheritanceTreeView: React.FC<InheritanceTreeViewProps> = ({
  rootNode,
  decimalsPerKatha = 3.30,
  onSelectNodeForHeirs,
  onOpenMultiGenModal,
  onViewDetails,
  onDeleteNode,
  onToggleCollapse,
  onExpandAll,
  onCollapseAll,
  onEditRoot,
  onOpenTransaction,
  onOpenReport,
}) => {
  const treeWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [actionMenuNode, setActionMenuNode] = useState<HeirTreeNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  // Mobile Touch Refs
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);
  const pinchDistRef = useRef<number | null>(null);
  const pinchInitialZoomRef = useRef<number>(1);
  const pinchWorldMidRef = useRef<{ x: number; y: number } | null>(null);

  const NODE_WIDTH = 250;
  const NODE_HEIGHT = 105;
  const LEVEL_SPACING = 140;
  const SIBLING_SPACING = 28;

  // Build recursive layout coordinates with non-overlapping guarantees
  const layoutTree = useMemo(() => {
    let currentY = 50;

    function layoutSubtree(node: HeirTreeNode, depth: number): LayoutNode {
      const isCollapsed = node.isCollapsed ?? false;
      const visibleChildren = !isCollapsed && node.children ? node.children : [];

      if (visibleChildren.length === 0) {
        const yPos = currentY;
        currentY += NODE_HEIGHT + SIBLING_SPACING;
        return {
          node,
          x: depth * (NODE_WIDTH + LEVEL_SPACING) + 40,
          y: yPos,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          children: [],
        };
      }

      const childLayouts: LayoutNode[] = [];
      for (const child of visibleChildren) {
        childLayouts.push(layoutSubtree(child, depth + 1));
      }

      const firstChildY = childLayouts[0].y;
      const lastChildY = childLayouts[childLayouts.length - 1].y;
      const parentY = (firstChildY + lastChildY) / 2;

      // Ensure currentY is safely below both the parent card and all of its children
      currentY = Math.max(currentY, parentY + NODE_HEIGHT + SIBLING_SPACING);

      return {
        node,
        x: depth * (NODE_WIDTH + LEVEL_SPACING) + 40,
        y: parentY,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        children: childLayouts,
      };
    }

    currentY = 50;
    return layoutSubtree(rootNode, 0);
  }, [rootNode]);

  // Extract all layout nodes and links
  const { allNodes, allLinks, totalBounds } = useMemo(() => {
    const nodes: LayoutNode[] = [];
    const links: { source: LayoutNode; target: LayoutNode }[] = [];

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    function traverse(lNode: LayoutNode) {
      nodes.push(lNode);
      minX = Math.min(minX, lNode.x);
      maxX = Math.max(maxX, lNode.x + lNode.width);
      minY = Math.min(minY, lNode.y);
      maxY = Math.max(maxY, lNode.y + lNode.height);

      for (const c of lNode.children) {
        links.push({ source: lNode, target: c });
        traverse(c);
      }
    }

    traverse(layoutTree);
    return { 
      allNodes: nodes, 
      allLinks: links, 
      totalBounds: { minX, maxX, minY, maxY } 
    };
  }, [layoutTree]);

  // Auto-fit function to center and frame the tree
  const autoFit = useCallback(() => {
    if (!containerRef.current || allNodes.length === 0) return;
    const { clientWidth, clientHeight } = containerRef.current;

    const { minX, maxX, minY, maxY } = totalBounds;
    const treeW = Math.max(200, maxX - minX + 120);
    const treeH = Math.max(200, maxY - minY + 100);

    // Zoom fits comfortably based on screen size
    const isMobile = clientWidth < 640;
    const fitZoom = Math.min(
      isMobile ? 0.85 : 1.0,
      Math.max(0.35, Math.min((clientWidth - (isMobile ? 24 : 60)) / treeW, (clientHeight - (isMobile ? 50 : 80)) / treeH))
    );

    const targetX = (clientWidth - (maxX - minX) * fitZoom) / 2 - minX * fitZoom;
    const targetY = (clientHeight - (maxY - minY) * fitZoom) / 2 - minY * fitZoom;

    setZoom(fitZoom);
    setPan({ x: Math.max(16, targetX), y: Math.max(20, targetY) });
  }, [allNodes.length, totalBounds]);

  // Center tree whenever layout changes
  useEffect(() => {
    autoFit();
  }, [autoFit]);

  // Listen to native fullscreen changes (e.g. user pressing ESC or back button)
  useEffect(() => {
    const handleFSChange = () => {
      const isNativeFS = !!document.fullscreenElement;
      if (!isNativeFS && isFullscreen) {
        setIsFullscreen(false);
        setTimeout(() => autoFit(), 150);
      }
    };

    document.addEventListener('fullscreenchange', handleFSChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange);
    };
  }, [isFullscreen, autoFit]);

  // Toggle Fullscreen Mode (Dual: HTML5 Fullscreen API + CSS Edge-to-Edge Overlay Fallback)
  const toggleFullscreen = () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);

    if (nextState) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }

    setTimeout(() => {
      autoFit();
    }, 150);
  };

  // Keyboard shortcut: ESC to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-btn')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsInteracting(false);
  };

  // Natural zoom in at viewport center
  const handleZoomIn = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const focalX = rect.width / 2;
    const focalY = rect.height / 2;

    setZoom((prevZoom) => {
      const newZoom = Math.min(2.5, prevZoom * 1.25);
      if (Math.abs(newZoom - prevZoom) < 0.001) return prevZoom;

      setPan((prevPan) => {
        const worldX = (focalX - prevPan.x) / prevZoom;
        const worldY = (focalY - prevPan.y) / prevZoom;
        return {
          x: focalX - worldX * newZoom,
          y: focalY - worldY * newZoom,
        };
      });

      return newZoom;
    });
  };

  // Natural zoom out at viewport center
  const handleZoomOut = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const focalX = rect.width / 2;
    const focalY = rect.height / 2;

    setZoom((prevZoom) => {
      const newZoom = Math.max(0.25, prevZoom / 1.25);
      if (Math.abs(newZoom - prevZoom) < 0.001) return prevZoom;

      setPan((prevPan) => {
        const worldX = (focalX - prevPan.x) / prevZoom;
        const worldY = (focalY - prevPan.y) / prevZoom;
        return {
          x: focalX - worldX * newZoom,
          y: focalY - worldY * newZoom,
        };
      });

      return newZoom;
    });
  };

  // Wheel zoom anchored at mouse cursor position
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const focalX = e.clientX - rect.left;
    const focalY = e.clientY - rect.top;

    // Smooth natural wheel zoom step
    const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;

    setZoom((prevZoom) => {
      const newZoom = Math.min(2.5, Math.max(0.25, prevZoom * zoomFactor));
      if (Math.abs(newZoom - prevZoom) < 0.001) return prevZoom;

      setPan((prevPan) => {
        const worldX = (focalX - prevPan.x) / prevZoom;
        const worldY = (focalY - prevPan.y) / prevZoom;
        return {
          x: focalX - worldX * newZoom,
          y: focalY - worldY * newZoom,
        };
      });

      return newZoom;
    });
  };

  // Mobile Touch Pan and Pinch-to-Zoom handling (anchored at pinch midpoint)
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-btn')) return;

    if (e.touches.length === 1) {
      // 1-finger pan start
      touchOriginRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
      pinchDistRef.current = null;
      pinchWorldMidRef.current = null;
      setIsDragging(true);
      setIsInteracting(true);
    } else if (e.touches.length === 2 && containerRef.current) {
      // 2-finger pinch zoom start
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      pinchDistRef.current = dist;
      pinchInitialZoomRef.current = zoom;

      const rect = containerRef.current.getBoundingClientRect();
      const midX = (t0.clientX + t1.clientX) / 2 - rect.left;
      const midY = (t0.clientY + t1.clientY) / 2 - rect.top;

      pinchWorldMidRef.current = {
        x: (midX - pan.x) / zoom,
        y: (midY - pan.y) / zoom,
      };

      touchOriginRef.current = null;
      setIsDragging(false);
      setIsInteracting(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-btn')) return;

    if (e.touches.length === 1 && touchOriginRef.current) {
      // Smooth 1-finger dragging
      setPan({
        x: e.touches[0].clientX - touchOriginRef.current.x,
        y: e.touches[0].clientY - touchOriginRef.current.y,
      });
    } else if (
      e.touches.length === 2 &&
      pinchDistRef.current !== null &&
      pinchWorldMidRef.current &&
      containerRef.current
    ) {
      // Natural 2-finger pinch zoom anchored at finger midpoint
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const currentDist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      const scaleFactor = currentDist / pinchDistRef.current;
      const newZoom = Math.min(2.5, Math.max(0.25, pinchInitialZoomRef.current * scaleFactor));

      const rect = containerRef.current.getBoundingClientRect();
      const currentMidX = (t0.clientX + t1.clientX) / 2 - rect.left;
      const currentMidY = (t0.clientY + t1.clientY) / 2 - rect.top;

      setZoom(newZoom);
      setPan({
        x: currentMidX - pinchWorldMidRef.current.x * newZoom,
        y: currentMidY - pinchWorldMidRef.current.y * newZoom,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      touchOriginRef.current = null;
      pinchDistRef.current = null;
      pinchWorldMidRef.current = null;
      setIsDragging(false);
      setIsInteracting(false);
    } else if (e.touches.length === 1) {
      // Seamlessly switch from pinch to 1-finger pan without position jumping
      touchOriginRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
      pinchDistRef.current = null;
      pinchWorldMidRef.current = null;
      setIsDragging(true);
      setIsInteracting(true);
    }
  };

  const hasAnyChildren = rootNode.children && rootNode.children.length > 0;

  return (
    <div
      ref={treeWrapperRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-40 w-screen h-screen bg-slate-950 flex flex-col select-none overflow-hidden touch-none'
          : 'relative w-full h-[580px] sm:h-[680px] lg:h-[720px] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl select-none flex flex-col touch-none'
      }
    >
      {/* FULLSCREEN TOP BAR (when Fullscreen is active) */}
      {isFullscreen && (
        <div className="bg-slate-900/95 backdrop-blur-md px-3 sm:px-6 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 z-30 shadow-lg text-white">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
              <GitBranch className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black truncate">
                  {rootNode.name}-এর বংশবৃক্ষ
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ফুল স্ক্রিন
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                মোট জমি: <strong className="text-emerald-400">{toBengaliNumber(rootNode.totalEstate, 2)} শতক</strong> • মোট ওয়ারিশ: <strong className="text-white">{toBengaliNumber(allNodes.length - 1, 0)} জন</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ml-auto">
            {/* Land Transaction Button inside Fullscreen */}
            {onOpenTransaction && (
              <button
                onClick={() => onOpenTransaction()}
                className="interactive-btn px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                title="ওয়ারিশদের মাঝে জমি ক্রয়-বিক্রয় ও হস্তান্তর"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>জমি ক্রয়-বিক্রয়</span>
              </button>
            )}

            {/* Report Button inside Fullscreen */}
            {onOpenReport && (
              <button
                onClick={onOpenReport}
                className="interactive-btn px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-700 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                title="পূর্ণাঙ্গ খতিয়ান রিপোর্ট"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xs:inline">রিপোর্ট</span>
              </button>
            )}

            {/* Add 1st Gen Heirs */}
            <button
              onClick={() => onSelectNodeForHeirs(rootNode)}
              className="interactive-btn px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              title="১ম প্রজন্মের ওয়ারিশ বণ্টন"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">১ম প্রজন্ম</span>
            </button>

            {/* Multi-Gen */}
            <button
              onClick={onOpenMultiGenModal}
              className="interactive-btn px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-700 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              title="এক সাথে একাধিক প্রজন্ম বিল্ডার"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">একাধিক প্রজন্ম</span>
            </button>

            {/* Zoom / View helpers */}
            <div className="flex items-center gap-0.5 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={handleZoomIn}
                className="interactive-btn p-1 text-slate-300 hover:text-white rounded cursor-pointer"
                title="জুম ইন (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="interactive-btn p-1 text-slate-300 hover:text-white rounded cursor-pointer"
                title="জুম আউট (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={autoFit}
                className="interactive-btn p-1 text-emerald-400 hover:text-emerald-300 rounded cursor-pointer"
                title="কেন্দ্রে আনুন"
              >
                <Focus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Exit Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="interactive-btn px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              title="ফুল স্ক্রিন বন্ধ করুন (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>ফুল স্ক্রিন বন্ধ</span>
            </button>
          </div>
        </div>
      )}

      {/* REGULAR TOP CONTROLS BAR (when not fullscreen) */}
      {!isFullscreen && (
        <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between gap-1.5 pointer-events-none">
          {/* Left Status pill */}
          <div className="pointer-events-auto bg-slate-800/90 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-700 shadow-md flex items-center gap-1.5 sm:gap-2 text-white">
            <GitBranch className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold">বংশবৃক্ষ</span>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] sm:text-xs text-emerald-300 font-semibold truncate max-w-[120px] sm:max-w-none">
              {hasAnyChildren 
                ? `ওয়ারিশ: ${toBengaliNumber(allNodes.length - 1, 0)} জন`
                : 'কোনো ওয়ারিশ নেই'}
            </span>
          </div>

          {/* Right Action buttons */}
          <div className="pointer-events-auto flex items-center gap-1 bg-slate-800/90 backdrop-blur-md p-1 sm:p-1.5 rounded-xl border border-slate-700 shadow-md text-slate-200">
            <button
              onClick={handleZoomIn}
              className="p-1 sm:p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="জুম ইন (Zoom In)"
              aria-label="জুম ইন"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1 sm:p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="জুম আউট (Zoom Out)"
              aria-label="জুম আউট"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={autoFit}
              className="p-1 sm:p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer text-emerald-400"
              title="কেন্দ্রে আনুন ও ফিট করুন (Center & Fit)"
              aria-label="কেন্দ্রে আনুন"
            >
              <Focus className="w-4 h-4" />
            </button>
            
            {hasAnyChildren && (
              <>
                <div className="hidden md:block w-[1px] h-4 bg-slate-700 mx-0.5" />
                <button
                  onClick={onExpandAll}
                  className="hidden md:block px-2 py-1 text-[11px] hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="সব শাখা খুলুন"
                >
                  সব শাখা (+)
                </button>
                <button
                  onClick={onCollapseAll}
                  className="hidden md:block px-2 py-1 text-[11px] hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="শাখা সংকুচিত করুন"
                >
                  সংকুচিত (-)
                </button>
              </>
            )}

            <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
            <button
              onClick={onOpenMultiGenModal}
              className="px-2 sm:px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-1 shadow-sm"
              title="এক সাথে একাধিক প্রজন্মের ওয়ারিশ বণ্টন তৈরি করুন"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">একাধিক প্রজন্ম</span>
            </button>

            {/* FULLSCREEN BUTTON */}
            <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
            <button
              onClick={toggleFullscreen}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1 shadow-sm text-[11px]"
              title="ট্রি ফুল স্ক্রিন এ চালান"
              aria-label="ফুল স্ক্রিন"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">ফুল স্ক্রিন</span>
            </button>
          </div>
        </div>
      )}

      {/* MOBILE & DESKTOP THUMB FLOATING CONTROLS (BOTTOM-RIGHT) */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-slate-800/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700 shadow-xl text-white">
        <button
          onClick={handleZoomIn}
          className="interactive-btn w-9 h-9 rounded-xl bg-slate-700/80 hover:bg-slate-600 active:scale-95 flex items-center justify-center transition-all cursor-pointer text-sm font-black"
          title="জুম ইন (+)"
          aria-label="জুম ইন"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="interactive-btn w-9 h-9 rounded-xl bg-slate-700/80 hover:bg-slate-600 active:scale-95 flex items-center justify-center transition-all cursor-pointer text-sm font-black"
          title="জুম আউট (-)"
          aria-label="জুম আউট"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={autoFit}
          className="interactive-btn w-9 h-9 rounded-xl bg-slate-700/80 hover:bg-slate-600 active:scale-95 text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
          title="কেন্দ্রে আনুন (Auto Fit)"
          aria-label="কেন্দ্রে আনুন"
        >
          <Focus className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-5 bg-slate-700 mx-0.5" />
        <button
          onClick={toggleFullscreen}
          className={`interactive-btn h-9 px-2.5 rounded-xl flex items-center gap-1 font-bold text-xs transition-all cursor-pointer active:scale-95 ${
            isFullscreen 
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
          title={isFullscreen ? 'ফুল স্ক্রিন বন্ধ' : 'ফুল স্ক্রিন'}
          aria-label={isFullscreen ? 'ফুল স্ক্রিন বন্ধ' : 'ফুল স্ক্রিন'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span className="text-[11px] font-bold">{isFullscreen ? 'সংকুচিত' : 'ফুল স্ক্রিন'}</span>
        </button>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden relative touch-none"
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: (isDragging || isInteracting) ? 'none' : 'transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
          className="relative min-w-max min-h-max"
        >
          {/* SVG Links Layer */}
          <svg
            className="absolute top-0 left-0 pointer-events-none overflow-visible"
            style={{
              width: `${Math.max(2000, totalBounds.maxX + 400)}px`,
              height: `${Math.max(2000, totalBounds.maxY + 400)}px`,
            }}
          >
            <defs>
              <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {allLinks.map((link, idx) => {
              const startX = link.source.x + link.source.width;
              const startY = link.source.y + link.source.height / 2;
              const endX = link.target.x;
              const endY = link.target.y + link.target.height / 2;

              // Smooth cubic bezier curved dendrogram path (inspired by reference image)
              const deltaX = endX - startX;
              const controlPoint1X = startX + deltaX * 0.55;
              const controlPoint1Y = startY;
              const controlPoint2X = startX + deltaX * 0.45;
              const controlPoint2Y = endY;

              const pathData = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;

              return (
                <g key={`link-${idx}`}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d={pathData}
                    fill="none"
                    stroke="url(#linkGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                  <circle
                    cx={startX}
                    cy={startY}
                    r="3.5"
                    fill="#10b981"
                  />
                  <circle
                    cx={endX}
                    cy={endY}
                    r="4"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}
          </svg>

          {/* HTML Interactive Nodes Layer */}
          <div className="relative" style={{ zIndex: 2 }}>
            {allNodes.map((lNode) => {
              const { node, x, y, width, height } = lNode;
              const isRoot = node.relationship === 'root';
              const hasChildren = node.children && node.children.length > 0;
              const isCollapsed = node.isCollapsed ?? false;
              const isSelected = selectedNodeId === node.id;

              return (
                <div
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${width}px`,
                    minHeight: `${height}px`,
                  }}
                  onClick={() => {
                    setSelectedNodeId(node.id);
                    setActionMenuNode(node);
                  }}
                  className={`group rounded-xl p-3 border transition-all duration-150 backdrop-blur-md shadow-xl select-none cursor-pointer hover:scale-[1.02] ${
                    isRoot
                      ? 'bg-gradient-to-r from-emerald-950 to-teal-950 border-emerald-400 shadow-emerald-950/60 ring-1 ring-emerald-400/40'
                      : node.gender === 'male'
                      ? 'bg-slate-800/95 hover:bg-slate-750 border-slate-600 hover:border-emerald-500'
                      : 'bg-slate-800/95 hover:bg-slate-750 border-slate-600 hover:border-pink-500'
                  } ${isSelected ? 'ring-2 ring-emerald-400' : ''}`}
                >
                  {/* Card Header: Avatar & Name */}
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                          isRoot
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : node.gender === 'male'
                            ? 'bg-blue-600'
                            : 'bg-rose-500'
                        }`}
                      >
                        {isRoot ? '👑' : node.gender === 'male' ? 'পু' : 'ক'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h4
                            className="text-xs font-bold text-white truncate max-w-[125px]"
                            title={node.name}
                          >
                            {node.name}
                          </h4>
                          {isRoot && onEditRoot && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditRoot();
                              }}
                              className="interactive-btn p-0.5 text-slate-400 hover:text-white cursor-pointer"
                              title="মালিকের নাম ও জমি পরিবর্তন করুন"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              isRoot
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {node.relationshipBn}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            প্রজন্ম {toBengaliNumber(node.generation, 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Transaction, Info, Add Heir, Delete */}
                    <div className="flex items-center gap-1 shrink-0 interactive-btn">
                      {onOpenTransaction && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTransaction(node.id, 'seller');
                          }}
                          title="জমি ক্রয়-বিক্রয় / হস্তান্তর"
                          className="p-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition-colors cursor-pointer"
                          aria-label={`জমি ক্রয়-বিক্রয় ${node.name}`}
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(node);
                        }}
                        title="হিস্যা ও খতিয়ান রিপোর্ট দেখুন"
                        className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        aria-label={`বিস্তারিত তথ্য ${node.name}`}
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectNodeForHeirs(node);
                        }}
                        title={isRoot ? '১ম প্রজন্মের ওয়ারিশ নির্ধারণ করুন' : 'পরবর্তী প্রজন্মের ওয়ারিশ যোগ করুন'}
                        className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer flex items-center gap-0.5 text-[10px] px-1.5 font-bold"
                        aria-label={`ওয়ারিশ যোগ করুন ${node.name}`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>ওয়ারিশ</span>
                      </button>

                      {!isRoot && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`আপনি কি "${node.name}" কে মুছে ফেলতে চান?`)) {
                              onDeleteNode(node.id);
                            }
                          }}
                          title="মুছে ফেলুন"
                          className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          aria-label={`মুছুন ${node.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Land & Share Details */}
                  <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block leading-none">
                        {((node.landBought || 0) > 0 || (node.landSold || 0) > 0) ? 'বর্তমান নিট জমি:' : 'জমির পরিমাণ:'}
                      </span>
                      <span className="font-extrabold text-emerald-300 text-xs tracking-tight">
                        {toBengaliNumber(node.currentTotalLand !== undefined ? node.currentTotalLand : node.totalEstate, 2)} শতক
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({toBengaliNumber((node.currentTotalLand !== undefined ? node.currentTotalLand : node.totalEstate) / (decimalsPerKatha || 3.30), 2)} কাঠা)
                      </span>
                      {((node.landBought || 0) > 0 || (node.landSold || 0) > 0) && (
                        <div className="text-[9px] mt-0.5 flex items-center gap-1">
                          {(node.landBought || 0) > 0 && (
                            <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1 rounded border border-emerald-500/40">
                              +{toBengaliNumber(node.landBought, 1)} ক্রয়
                            </span>
                          )}
                          {(node.landSold || 0) > 0 && (
                            <span className="text-rose-400 font-bold bg-rose-950/60 px-1 rounded border border-rose-500/40">
                              -{toBengaliNumber(node.landSold, 1)} বিক্রয়
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block leading-none">
                        হিস্যা ভগ্নাংশ:
                      </span>
                      <span className="font-semibold text-amber-300 text-xs">
                        {node.shareFractionStr}{' '}
                        <span className="text-[10px] text-slate-400">
                          ({toBengaliNumber(node.sharePercentage, 1)}%)
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Branch Expansion Dot / Toggle at right side */}
                  {hasChildren && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCollapse(node.id);
                      }}
                      className="interactive-btn absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900 border-2 border-emerald-400 hover:border-emerald-300 text-white flex items-center justify-center text-[11px] font-bold shadow-lg hover:scale-110 transition-transform cursor-pointer z-10"
                      title={isCollapsed ? 'শাখা প্রসারিত করুন' : 'শাখা সংকুচিত করুন'}
                      aria-label={isCollapsed ? 'শাখা প্রসারিত করুন' : 'শাখা সংকুচিত করুন'}
                    >
                      {isCollapsed ? '+' : '−'}
                    </button>
                  )}
                </div>
              );
            })}

            {/* If root has no children, display clean invitation card */}
            {!hasAnyChildren && (
              <div
                style={{
                  position: 'absolute',
                  left: `${NODE_WIDTH + LEVEL_SPACING + 40}px`,
                  top: `${40}px`,
                  width: '280px',
                }}
                className="p-4 rounded-xl border-2 border-dashed border-emerald-500/40 bg-emerald-950/30 backdrop-blur-sm text-center space-y-3"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">১ম প্রজন্মের ওয়ারিশ যুক্ত করুন</h5>
                  <p className="text-[11px] text-slate-400 mt-1">
                    স্ত্রী, ছেলে, মেয়ে ইত্যাদি ওয়ারিশের সংখ্যা দিলে ১০০% স্বয়ংক্রিয়ভাবে বণ্টন হয়ে যাবে।
                  </p>
                </div>
                <button
                  onClick={() => onSelectNodeForHeirs(rootNode)}
                  className="interactive-btn w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>ওয়ারিশ বণ্টন শুরু করুন</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Heir Quick-Actions Modal (Opens when user clicks any person in the Tree or in Fullscreen) */}
      {actionMenuNode && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 overflow-y-auto"
          onClick={() => setActionMenuNode(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold border border-white/20">
                  {actionMenuNode.relationship === 'root' ? '👑' : actionMenuNode.gender === 'male' ? '👨' : '👩'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base">{actionMenuNode.name}</h3>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                      {actionMenuNode.relationshipBn}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200">
                    প্রজন্ম {toBengaliNumber(actionMenuNode.generation, 0)} • ওয়ারিশের জমি ও হিসাব ব্যবস্থা
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActionMenuNode(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
                aria-label="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Land Summary */}
            <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">বর্তমান সর্বমোট নিট জমি:</span>
                <span className="text-xl font-black text-emerald-950">
                  {toBengaliNumber(actionMenuNode.currentTotalLand !== undefined ? actionMenuNode.currentTotalLand : actionMenuNode.totalEstate, 2)} শতক
                </span>
                <span className="text-xs text-slate-500 font-semibold ml-1">
                  ({toBengaliNumber((actionMenuNode.currentTotalLand !== undefined ? actionMenuNode.currentTotalLand : actionMenuNode.totalEstate) / (decimalsPerKatha || 3.30), 2)} কাঠা)
                </span>
              </div>
              <div className="text-right text-xs">
                <div className="text-slate-600">প্রাপ্ত: <strong>{toBengaliNumber(actionMenuNode.inheritedEstate || 0, 1)}</strong> শতক</div>
                {((actionMenuNode.landBought || 0) > 0 || (actionMenuNode.landSold || 0) > 0) && (
                  <div className="text-[11px] mt-0.5 space-x-1">
                    {(actionMenuNode.landBought || 0) > 0 && (
                      <span className="text-emerald-700 font-bold">+{toBengaliNumber(actionMenuNode.landBought, 1)} ক্রয়</span>
                    )}
                    {(actionMenuNode.landSold || 0) > 0 && (
                      <span className="text-rose-700 font-bold">-{toBengaliNumber(actionMenuNode.landSold, 1)} বিক্রয়</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 space-y-2.5">
              {/* Option 1: Give/sell land to someone else */}
              <button
                type="button"
                onClick={() => {
                  const node = actionMenuNode;
                  setActionMenuNode(null);
                  if (onOpenTransaction) {
                    onOpenTransaction(node.id, 'seller');
                  }
                }}
                className="w-full p-3 rounded-xl bg-amber-50 hover:bg-amber-100/90 border border-amber-300 flex items-center gap-3 text-left transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    এই ওয়ারিশের জমি অন্য কাউকে দিন (বিক্রয় / হস্তান্তর)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {actionMenuNode.name}-এর জমি কমবে এবং নির্বাচিত ক্রেতার জমিতে যোগ হবে
                  </p>
                </div>
              </button>

              {/* Option 2: Record land bought from someone else */}
              <button
                type="button"
                onClick={() => {
                  const node = actionMenuNode;
                  setActionMenuNode(null);
                  if (onOpenTransaction) {
                    onOpenTransaction(node.id, 'buyer');
                  }
                }}
                className="w-full p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 flex items-center gap-3 text-left transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    অন্য কারো জমি এই ওয়ারিশ ক্রয় করেছে (ক্রয় যোগ)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    অন্য ওয়ারিশের কাছ থেকে জমি কিনে {actionMenuNode.name}-এর সম্পত্তিতে যোগ হবে
                  </p>
                </div>
              </button>

              {/* Option 3: View Full Ledger & Details */}
              <button
                type="button"
                onClick={() => {
                  const node = actionMenuNode;
                  setActionMenuNode(null);
                  onViewDetails(node);
                }}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-3 text-left transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-700 text-white flex items-center justify-center font-bold shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    বিস্তারিত খতিয়ান ও ক্রয়-বিক্রয়ের রিপোর্ট
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    মূল প্রাপ্তি, ক্রয় ও বিক্রয়ের দলিলের সম্পূর্ণ তালিকা ও হিসাব
                  </p>
                </div>
              </button>

              {/* Option 4: Add next gen heirs */}
              <button
                type="button"
                onClick={() => {
                  const node = actionMenuNode;
                  setActionMenuNode(null);
                  onSelectNodeForHeirs(node);
                }}
                className="w-full p-3 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 flex items-center gap-3 text-left transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {actionMenuNode.relationship === 'root' ? '১ম প্রজন্মের ওয়ারিশ বণ্টন' : 'পরবর্তী প্রজন্মের ওয়ারিশ বণ্টন যোগ করুন'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    স্ত্রী, ছেলে, মেয়ে ইত্যাদি ওয়ারিশ নির্বাচন করে হিস্যা বণ্টন
                  </p>
                </div>
              </button>

              {/* Option 5: Delete if not root */}
              {actionMenuNode.relationship !== 'root' && (
                <button
                  type="button"
                  onClick={() => {
                    const node = actionMenuNode;
                    setActionMenuNode(null);
                    if (window.confirm(`আপনি কি "${node.name}" কে মুছে ফেলতে চান?`)) {
                      onDeleteNode(node.id);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-rose-50 text-rose-600 border border-transparent hover:border-rose-200 flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer mt-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>এই ওয়ারিশকে মুছে ফেলুন</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
