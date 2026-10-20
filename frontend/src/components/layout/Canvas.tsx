import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useReactFlow,
  useViewport,
  ReactFlowProvider,
  NodeTypes,
  EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ZoomIn, ZoomOut, Maximize2, Plus, Sparkles } from 'lucide-react';
import { useFlowStore } from '../../store/useFlowStore';
import { StartNode } from '../nodes/StartNode';
import { EndNode } from '../nodes/EndNode';
import { AssessmentNode } from '../nodes/AssessmentNode';
import { UnitNode } from '../nodes/UnitNode';
import { ConditionalEdge } from '../edges/ConditionalEdge';
import { ContextMenu, ContextMenuProps } from '../ui/ContextMenu';

const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  assessment: AssessmentNode,
  unit: UnitNode,
};

const edgeTypes: EdgeTypes = {
  conditional: ConditionalEdge,
};

const FlowCanvasInner: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom: viewportZoom } = useViewport();
  const currentZoom = Math.round(viewportZoom * 100);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStop,
    selectedNodeId,
    selectedEdgeId,
    selectNode,
    selectEdge,
    clearSelection,
    addNodeFromComponent,
    addGenericNode,
    removeNode,
    removeEdge,
    duplicateNode,
    undo,
    redo,
    zoom: storeZoom,
    setZoom,
  } = useFlowStore();

  const [menu, setMenu] = useState<Omit<ContextMenuProps, 'onClose'> | null>(null);

  // Keyboard shortcut listener (Delete, Ctrl+Z, Ctrl+Y, Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      if (!isInput) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedNodeId) {
            e.preventDefault();
            removeNode(selectedNodeId);
          } else if (selectedEdgeId) {
            e.preventDefault();
            removeEdge(selectedEdgeId);
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
          if (selectedNodeId) {
            e.preventDefault();
            duplicateNode(selectedNodeId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, removeNode, removeEdge, undo, redo, duplicateNode]);

  // Drag over canvas handler
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Drop onto canvas handler
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const rawData = event.dataTransfer.getData('application/json');
      if (!rawData) return;

      try {
        const parsed = JSON.parse(rawData);
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        if (parsed.kind === 'component') {
          addNodeFromComponent(parsed.data, position);
        } else if (parsed.kind === 'generic') {
          addGenericNode(parsed.type, position);
        }
      } catch (err) {
        console.error('Failed to parse dropped item', err);
      }
    },
    [screenToFlowPosition, addNodeFromComponent, addGenericNode]
  );

  // Right-click on node
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent, node: any) => {
      event.preventDefault();
      selectNode(node.id);
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setMenu({
        x: event.clientX,
        y: event.clientY,
        flowPosition: flowPos,
        targetNodeId: node.id,
      });
    },
    [screenToFlowPosition, selectNode]
  );

  // Right-click on empty pane
  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setMenu({
        x: event.clientX,
        y: event.clientY,
        flowPosition: flowPos,
        targetNodeId: null,
      });
    },
    [screenToFlowPosition]
  );

  return (
    <div
      ref={reactFlowWrapper}
      className="flex-1 h-full relative bg-slate-50 overflow-hidden"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        snapToGrid={true}
        snapGrid={[15, 15]}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        preventScrolling={true}
        onNodeClick={(_, node) => {
          selectNode(node.id);
          setMenu(null);
        }}
        onEdgeClick={(_, edge) => {
          selectEdge(edge.id);
          setMenu(null);
        }}
        onPaneClick={() => {
          clearSelection();
          setMenu(null);
        }}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        defaultViewport={{ x: 0, y: 0, zoom: storeZoom || 0.8 }}
        onMoveEnd={(_, viewport) => setZoom(viewport.zoom)}
        minZoom={0.2}
        maxZoom={2.0}
        defaultEdgeOptions={{ type: 'conditional' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
      </ReactFlow>

      {/* Floating Canvas Controls Matching the Mockup [ - | 70% | + | ⛶ ] */}
      <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg shadow-sm flex items-center p-1 divide-x divide-slate-200">
        <button
          onClick={() => zoomOut()}
          title="Zoom Out"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="px-3 text-xs font-semibold text-slate-600 min-w-[50px] text-center select-none">
          {currentZoom}%
        </div>
        <button
          onClick={() => zoomIn()}
          title="Zoom In"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => fitView({ padding: 0.2 })}
          title="Fit to Screen"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors ml-1"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Empty State Banner if no nodes */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-xs border border-dashed border-slate-300 rounded-2xl p-8 max-w-md text-center shadow-sm space-y-3 pointer-events-auto">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Your Canvas is Ready</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Drag modules from the left panel onto the canvas, or click the button below to add your first assessment section.
              </p>
            </div>
            <button
              onClick={() => addGenericNode('section', { x: 380, y: 180 })}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Starting Section</span>
            </button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {menu && <ContextMenu {...menu} onClose={() => setMenu(null)} />}
    </div>
  );
};

export const Canvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  );
};
