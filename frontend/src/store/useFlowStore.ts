import { create } from 'zustand';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import {
  ContentComponent,
  LearningPathPayload,
  LearningPathNode,
  LearningPathEdge,
} from '../types';
import { getLearningPath } from '../api/client';

interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
}

interface FlowState {
  // Navigation / Views
  appView: 'dashboard' | 'builder';
  setAppView: (view: 'dashboard' | 'builder') => void;

  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // Path Metadata
  pathId: string;
  pathName: string;
  pathDescription: string;
  pathStatus: 'draft' | 'published';
  pathVersion: number;
  zoom: number;

  // UI state
  activeTab: 'builder' | 'preview';
  isSaving: boolean;
  saveMessage: string | null;
  isDirty: boolean;

  // Undo / Redo
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  canUndo: boolean;
  canRedo: boolean;
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;

  // React Flow Handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeDragStop: () => void;

  // Selection
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  clearSelection: () => void;

  // Node Mutations
  addNodeFromComponent: (component: ContentComponent, position: { x: number; y: number }) => void;
  addGenericNode: (type: 'start' | 'unit' | 'assessment' | 'end' | 'section' | 'group', position: { x: number; y: number }) => void;
  duplicateNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<LearningPathNode>) => void;
  removeNode: (id: string) => void;

  // Edge Mutations
  updateEdge: (id: string, updates: Partial<LearningPathEdge>) => void;
  removeEdge: (id: string) => void;

  // Path Lifecycle
  newPath: () => void;
  openPath: (id: string) => Promise<void>;
  backToDashboard: () => void;
  setPathName: (name: string) => void;
  setPathDescription: (desc: string) => void;
  setPathStatus: (status: 'draft' | 'published') => void;
  setActiveTab: (tab: 'builder' | 'preview') => void;
  setSaveMessage: (msg: string | null) => void;
  setIsSaving: (saving: boolean) => void;
  setIsDirty: (dirty: boolean) => void;
  setZoom: (zoom: number) => void;

  // Node Type & Role
  updateNodeType: (id: string, type: 'unit' | 'assessment') => void;
  updateNodeContentType: (id: string, type: 'assessment' | 'unit') => void;
  setNodeParentGroup: (nodeId: string, parentGroupId: string | null) => void;
  convertNodeToGroup: (nodeId: string) => void;
  convertNodeToSection: (nodeId: string) => void;
  addSectionToGroup: (groupId: string) => void;
  assignSectionToGroup: (sectionId: string, targetGroupId: string | null) => void;

  // Load/Export
  loadLearningPathData: (payload: LearningPathPayload) => void;
  getPayload: () => LearningPathPayload;
}

const MAX_HISTORY = 30;

const getInitialAppView = (): 'dashboard' | 'builder' => {
  try {
    const saved = localStorage.getItem('active_app_view');
    if (saved === 'builder' || saved === 'dashboard') return saved;
  } catch {}
  return 'dashboard';
};

const getInitialPathId = (): string => {
  try {
    const saved = localStorage.getItem('active_path_id');
    if (saved) return saved;
  } catch {}
  return 'lp-sat-adaptive-001';
};

const getInitialZoom = (pathId: string = 'lp-sat-adaptive-001', fallback: number = 0.8): number => {
  try {
    const saved = localStorage.getItem(`canvas_zoom_${pathId}`);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.2 && parsed <= 2.0) return parsed;
    }
  } catch {}
  return fallback;
};

export const useFlowStore = create<FlowState>((set, get) => ({
  appView: getInitialAppView(),
  setAppView: (view) => {
    try {
      localStorage.setItem('active_app_view', view);
    } catch {}
    set({ appView: view });
  },

  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,

  pathId: getInitialPathId(),
  pathName: 'SAT Adaptive Path',
  pathDescription: 'Routes learners based on math and reading performance.',
  pathStatus: 'draft',
  pathVersion: 1,
  zoom: getInitialZoom(),

  activeTab: 'builder',
  isSaving: false,
  saveMessage: null,
  isDirty: false,

  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  takeSnapshot: () => {
    const { nodes, edges, past } = get();
    const newPast = [...past, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }];
    if (newPast.length > MAX_HISTORY) newPast.shift();
    set({
      past: newPast,
      future: [],
      canUndo: true,
      canRedo: false,
    });
  },

  undo: () => {
    const { past, future, nodes, edges } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const newFuture = [{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }, ...future];

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: newPast,
      future: newFuture,
      canUndo: newPast.length > 0,
      canRedo: true,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  redo: () => {
    const { past, future, nodes, edges } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const newPast = [...past, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }];

    set({
      nodes: next.nodes,
      edges: next.edges,
      past: newPast,
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onNodeDragStop: () => {
    get().takeSnapshot();
  },

  onConnect: (connection) => {
    if (!connection.source || !connection.target) return;
    get().takeSnapshot();

    const newEdgeId = `edge-${connection.source}-${connection.target}-${Date.now().toString().slice(-4)}`;
    const newEdge: Edge = {
      id: newEdgeId,
      source: connection.source,
      target: connection.target,
      type: 'conditional',
      data: {
        label: 'Progression rule',
        priority: 1,
        isDefault: false,
        conditions: {
          operator: 'AND',
          rules: [],
        },
      },
    };
    set({
      edges: addEdge(newEdge, get().edges),
      selectedEdgeId: newEdgeId,
      selectedNodeId: null,
      isDirty: true,
    });
  },

  selectNode: (id) => {
    set({
      selectedNodeId: id,
      selectedEdgeId: null,
    });
  },

  selectEdge: (id) => {
    set({
      selectedEdgeId: id,
      selectedNodeId: null,
    });
  },

  clearSelection: () => {
    set({
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  addNodeFromComponent: (component, position) => {
    get().takeSnapshot();
    const nodeId = `node-${component.id.replace('cmp-', '')}-${Date.now().toString().slice(-4)}`;
    const isAssessment = component.type === 'assessment';

    const newNode: Node = {
      id: nodeId,
      type: isAssessment ? 'assessment' : 'unit',
      position,
      draggable: true,
      data: {
        id: nodeId,
        componentId: component.id,
        type: component.type,
        label: component.title,
        description: component.shortDescription,
        config: {
          approximateDurationMinutes: component.approximateDurationMinutes,
          questionsCount: isAssessment ? 22 : 0,
          difficulty: isAssessment ? 'Adaptive' : 'Medium',
          assessment: component.metadata?.assessment
            ? {
                maxScore: component.metadata.assessment.maxScore,
                passingScore: component.metadata.assessment.passingScore,
              }
            : undefined,
        },
      },
    };

    set({
      nodes: [...get().nodes, newNode],
      selectedNodeId: nodeId,
      selectedEdgeId: null,
      isDirty: true,
    });
  },

  addGenericNode: (type, position) => {
    get().takeSnapshot();
    const idSuffix = Date.now().toString().slice(-4);
    let nodeId = `node-${type}-${idSuffix}`;
    let componentId = `system-${type}-${idSuffix}`;
    let reactType: 'start' | 'unit' | 'assessment' | 'end' = 'assessment';
    let label = 'Section';
    let config: any = {
      approximateDurationMinutes: 30,
      questionsCount: 20,
      difficulty: 'Medium',
    };

    if (type === 'group') {
      nodeId = `node-group-${idSuffix}`;
      componentId = `group-${idSuffix}`;
      reactType = 'unit';
      label = `Adaptive Group ${idSuffix}`;
      config = {
        isGroup: true,
        approximateDurationMinutes: 35,
        difficulty: 'Adaptive',
      };
    } else if (type === 'section') {
      nodeId = `node-section-${idSuffix}`;
      componentId = `cmp-assess-${idSuffix}`;
      reactType = 'assessment';
      label = `Section ${idSuffix}`;
      config = {
        isGroup: false,
        approximateDurationMinutes: 30,
        questionsCount: 22,
        difficulty: 'Medium',
        assessment: {
          maxScore: 100,
          passingScore: 50,
        },
      };
    } else if (type === 'start') {
      const existingStart = get().nodes.find((n) => n.type === 'start');
      if (existingStart) {
        set({ selectedNodeId: existingStart.id });
        return;
      }
      nodeId = 'node-start';
      componentId = 'system-start';
      reactType = 'start';
      label = 'START';
      config = {};
    } else if (type === 'end') {
      const existingEnd = get().nodes.find((n) => n.type === 'end');
      if (existingEnd) {
        set({ selectedNodeId: existingEnd.id });
        return;
      }
      nodeId = 'node-end';
      componentId = 'system-end';
      reactType = 'end';
      label = 'END';
      config = {};
    } else if (type === 'assessment') {
      nodeId = `node-section-${idSuffix}`;
      componentId = `cmp-assess-${idSuffix}`;
      reactType = 'assessment';
      label = `Assessment Module ${idSuffix}`;
      config = {
        isGroup: false,
        approximateDurationMinutes: 30,
        questionsCount: 20,
        difficulty: 'Medium',
        assessment: {
          maxScore: 100,
          passingScore: 50,
        },
      };
    } else if (type === 'unit') {
      nodeId = `node-unit-${idSuffix}`;
      componentId = `cmp-unit-${idSuffix}`;
      reactType = 'unit';
      label = `Learning Unit ${idSuffix}`;
      config = {
        isGroup: false,
        approximateDurationMinutes: 30,
        difficulty: 'Medium',
      };
    }

    const newNode: Node = {
      id: nodeId,
      type: reactType,
      position,
      draggable: true,
      data: {
        id: nodeId,
        componentId,
        type: reactType,
        label,
        description: '',
        config,
      },
    };

    set({
      nodes: [...get().nodes, newNode],
      selectedNodeId: nodeId,
      selectedEdgeId: null,
      isDirty: true,
    });
  },

  duplicateNode: (id) => {
    const node = get().nodes.find((n) => n.id === id);
    if (!node || node.type === 'start' || node.type === 'end') return;
    get().takeSnapshot();

    const idSuffix = Date.now().toString().slice(-4);
    const newNodeId = `node-copy-${idSuffix}`;
    const newNode: Node = {
      ...node,
      id: newNodeId,
      position: {
        x: node.position.x + 40,
        y: node.position.y + 40,
      },
      draggable: true,
      selected: true,
      data: {
        ...(node.data as any),
        id: newNodeId,
        label: `${(node.data as any)?.label || 'Node'} (Copy)`,
      },
    };

    set({
      nodes: [...get().nodes.map((n) => ({ ...n, selected: false })), newNode],
      selectedNodeId: newNodeId,
      selectedEdgeId: null,
      isDirty: true,
    });
  },

  updateNode: (id, updates) => {
    set({
      nodes: get().nodes.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...(n.data as object),
              ...updates,
              config: {
                ...((n.data as any)?.config || {}),
                ...(updates.config || {}),
              },
            },
          };
        }
        return n;
      }),
      isDirty: true,
    });
  },

  removeNode: (id) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
      isDirty: true,
    });
  },

  updateEdge: (id, updates) => {
    set({
      edges: get().edges.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            data: {
              ...(e.data as object),
              ...updates,
            },
          };
        }
        return e;
      }),
      isDirty: true,
    });
  },

  removeEdge: (id) => {
    get().takeSnapshot();
    set({
      edges: get().edges.filter((e) => e.id !== id),
      selectedEdgeId: get().selectedEdgeId === id ? null : get().selectedEdgeId,
      isDirty: true,
    });
  },

  newPath: () => {
    const id = `lp-${Date.now().toString(36)}`;
    try {
      localStorage.setItem('active_app_view', 'builder');
      localStorage.setItem('active_path_id', id);
    } catch {}
    const startNode: Node = {
      id: 'node-start',
      type: 'start',
      position: { x: 380, y: 80 },
      draggable: true,
      data: {
        id: 'node-start',
        componentId: 'system-start',
        type: 'start',
        label: 'START',
        description: 'Entry point for learners',
      },
    };
    const endNode: Node = {
      id: 'node-end',
      type: 'end',
      position: { x: 380, y: 480 },
      draggable: true,
      data: {
        id: 'node-end',
        componentId: 'system-end',
        type: 'end',
        label: 'END',
        description: 'Final submission point',
      },
    };

    set({
      appView: 'builder',
      pathId: id,
      pathName: 'Untitled Learning Path',
      pathDescription: 'Custom adaptive learning curriculum',
      pathStatus: 'draft',
      pathVersion: 1,
      zoom: 0.85,
      nodes: [startNode, endNode],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      activeTab: 'builder',
      saveMessage: null,
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
      isDirty: false,
    });
  },

  openPath: async (id: string) => {
    try {
      set({ isSaving: true });
      try {
        localStorage.setItem('active_app_view', 'builder');
        localStorage.setItem('active_path_id', id);
      } catch {}
      const data = await getLearningPath(id);
      get().loadLearningPathData(data);
      set({ appView: 'builder', isSaving: false });
    } catch (err: any) {
      set({ isSaving: false, saveMessage: `Error loading path: ${err.message}` });
    }
  },

  backToDashboard: () => {
    try {
      localStorage.setItem('active_app_view', 'dashboard');
    } catch {}
    set({
      appView: 'dashboard',
      selectedNodeId: null,
      selectedEdgeId: null,
      saveMessage: null,
    });
  },

  setPathName: (name) => set({ pathName: name }),
  setPathDescription: (desc) => set({ pathDescription: desc }),
  setPathStatus: (status) => set({ pathStatus: status }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSaveMessage: (msg) => set({ saveMessage: msg }),
  setIsSaving: (saving) => set({ isSaving: saving }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),

  setZoom: (zoom) => {
    const rounded = Math.round(zoom * 100) / 100;
    try {
      localStorage.setItem(`canvas_zoom_${get().pathId}`, rounded.toString());
    } catch {}
    set({ zoom: rounded });
  },

  updateNodeType: (id, type) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            type,
            data: {
              ...(n.data as object),
              type,
            },
          };
        }
        return n;
      }),
      isDirty: true,
    });
  },

  updateNodeContentType: (id, type) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.map((n) => {
        if (n.id === id) {
          const prevConfig = (n.data as any)?.config || {};
          return {
            ...n,
            type,
            data: {
              ...(n.data as object),
              type,
              config: {
                ...prevConfig,
                isGroup: false,
                assessment:
                  type === 'assessment'
                    ? prevConfig.assessment || { maxScore: 100, passingScore: 50 }
                    : undefined,
                questionsCount: type === 'assessment' ? prevConfig.questionsCount || 20 : 0,
              },
            },
          };
        }
        return n;
      }),
      isDirty: true,
    });
  },

  setNodeParentGroup: (nodeId, parentGroupId) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...(n.data as object),
              parentGroupId: parentGroupId || undefined,
            },
          };
        }
        return n;
      }),
      isDirty: true,
    });
  },

  convertNodeToGroup: (nodeId) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.map((n) => {
        if (n.id === nodeId) {
          const d = (n.data as any) || {};
          const cleanLabel = (d.label || 'Section').replace(' (Group)', '').replace(' (Adaptive)', '') + ' (Group)';
          return {
            ...n,
            type: 'unit',
            data: {
              ...d,
              label: cleanLabel,
              type: 'unit',
              componentId: d.componentId?.startsWith('group-') ? d.componentId : `group-${nodeId.replace('node-', '')}`,
              config: {
                ...(d.config || {}),
                isGroup: true,
                difficulty: 'Adaptive',
              },
            },
          };
        }
        return n;
      }),
      isDirty: true,
    });
  },

  convertNodeToSection: (nodeId) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.map((n) => {
        if (n.id === nodeId) {
          const d = (n.data as any) || {};
          const cleanLabel = (d.label || 'Group').replace(' (Group)', '').replace(' (Adaptive)', '');
          return {
            ...n,
            type: 'assessment',
            data: {
              ...d,
              label: cleanLabel,
              type: 'assessment',
              componentId: `cmp-assess-${nodeId.replace('node-', '')}`,
              config: {
                ...(d.config || {}),
                isGroup: false,
                questionsCount: (d.config as any)?.questionsCount || 20,
                assessment: (d.config as any)?.assessment || { maxScore: 100, passingScore: 50 },
              },
            },
          };
        }
        return n;
      }),
      isDirty: true,
    });
  },

  addSectionToGroup: (groupId) => {
    get().takeSnapshot();
    const groupNode = get().nodes.find((n) => n.id === groupId);
    if (!groupNode) return;

    const idSuffix = Date.now().toString().slice(-4);
    const newSectionId = `node-section-${idSuffix}`;
    const groupLabel = (groupNode.data as any)?.label?.replace(' (Group)', '') || 'Module';

    const existingChildren = get().edges.filter((e) => e.source === groupId);
    const childCount = existingChildren.length;
    const offsetX = childCount === 0 ? -120 : childCount === 1 ? 120 : (childCount - 1) * 160;

    const newSectionNode: Node = {
      id: newSectionId,
      type: 'assessment',
      position: {
        x: groupNode.position.x + offsetX,
        y: groupNode.position.y + 130,
      },
      draggable: true,
      data: {
        id: newSectionId,
        componentId: `cmp-assess-${idSuffix}`,
        type: 'assessment',
        label: `${groupLabel} - Tier ${childCount + 1}`,
        description: `Adaptive branch tier belonging to ${groupLabel}`,
        parentGroupId: groupId,
        config: {
          approximateDurationMinutes: 30,
          questionsCount: 20,
          difficulty: childCount === 0 ? 'Easy' : 'Hard',
          assessment: {
            maxScore: 100,
            passingScore: 50,
          },
        },
      },
    };

    const newEdgeId = `edge-${groupId}-${newSectionId}-${idSuffix}`;
    const newEdge: Edge = {
      id: newEdgeId,
      source: groupId,
      target: newSectionId,
      type: 'conditional',
      data: {
        label: childCount === 0 ? 'Score < 50%' : 'Score ≥ 50%',
        priority: childCount + 1,
        isDefault: childCount === 0,
        conditions: {
          operator: 'AND',
          rules: [
            childCount === 0
              ? {
                  id: `rule-${idSuffix}`,
                  sourceType: 'assessment',
                  sourceNodeId: groupId,
                  metric: 'score_range',
                  operator: 'between',
                  range: { min: 0, max: 49, minInclusive: true, maxInclusive: true },
                }
              : {
                  id: `rule-${idSuffix}`,
                  sourceType: 'assessment',
                  sourceNodeId: groupId,
                  metric: 'score',
                  operator: 'gte',
                  value: 50,
                },
          ],
        },
      },
    };

    set({
      nodes: [...get().nodes, newSectionNode],
      edges: [...get().edges, newEdge],
      selectedNodeId: newSectionId,
      selectedEdgeId: null,
      isDirty: true,
    });
  },

  assignSectionToGroup: (sectionId, targetGroupId) => {
    get().takeSnapshot();
    const sectionNode = get().nodes.find((n) => n.id === sectionId);
    if (!sectionNode) return;

    const allGroupIds = new Set(
      get().nodes.filter((n) => (n.data as any)?.config?.isGroup).map((n) => n.id)
    );
    let updatedEdges = get().edges.filter(
      (e) => !(e.target === sectionId && allGroupIds.has(e.source))
    );

    if (targetGroupId) {
      const idSuffix = Date.now().toString().slice(-4);
      const newEdgeId = `edge-${targetGroupId}-${sectionId}-${idSuffix}`;
      const newEdge: Edge = {
        id: newEdgeId,
        source: targetGroupId,
        target: sectionId,
        type: 'conditional',
        data: {
          label: 'Branch route',
          priority: 1,
          isDefault: false,
          conditions: { operator: 'AND', rules: [] },
        },
      };
      updatedEdges = [...updatedEdges, newEdge];
    }

    set({
      nodes: get().nodes.map((n) => {
        if (n.id === sectionId) {
          return {
            ...n,
            data: {
              ...(n.data as object),
              parentGroupId: targetGroupId || undefined,
            },
          };
        }
        return n;
      }),
      edges: updatedEdges,
      isDirty: true,
    });
  },

  loadLearningPathData: (payload) => {
    const initialZoom = getInitialZoom(payload.id || 'lp-sat-adaptive-001', payload.canvas?.zoom || 0.8);

    let seenStart = false;
    let seenEnd = false;
    const seenIds = new Set<string>();

    const convertedNodes: Node[] = [];
    for (const n of payload.nodes) {
      if (seenIds.has(n.id)) continue;
      if (n.type === 'start') {
        if (seenStart) continue;
        seenStart = true;
      }
      if (n.type === 'end') {
        if (seenEnd) continue;
        seenEnd = true;
      }
      seenIds.add(n.id);

      let cleanLabel = n.label;
      if (n.type === 'start' && (!cleanLabel || cleanLabel.toLowerCase().includes('start'))) {
        cleanLabel = 'START';
      } else if (n.type === 'end' && (!cleanLabel || cleanLabel.toLowerCase().includes('complete') || cleanLabel.toLowerCase().includes('end'))) {
        cleanLabel = 'END';
      }

      convertedNodes.push({
        id: n.id,
        type: n.type,
        position: n.position,
        draggable: true,
        data: {
          id: n.id,
          componentId: n.componentId,
          type: n.type,
          label: cleanLabel,
          description: n.description || '',
          config: n.config || {},
        },
      });
    }

    const convertedEdges: Edge[] = payload.edges.map((e) => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      type: 'conditional',
      data: {
        label: e.label || '',
        priority: e.priority || 1,
        isDefault: e.isDefault || false,
        conditions: e.conditions || { operator: 'AND', rules: [] },
      },
    }));

    set({
      pathId: payload.id || 'lp-sat-adaptive-001',
      pathName: payload.name || 'Untitled Learning Path',
      pathDescription: payload.description || '',
      pathStatus: payload.status || 'draft',
      pathVersion: payload.version || 1,
      zoom: initialZoom,
      nodes: convertedNodes,
      edges: convertedEdges,
      selectedNodeId: null,
      selectedEdgeId: null,
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
      isDirty: false,
    });
  },

  getPayload: () => {
    const state = get();
    const formattedNodes: LearningPathNode[] = state.nodes.map((n) => {
      const d = n.data as any;
      return {
        id: n.id,
        componentId: d?.componentId || `comp-${n.id}`,
        type: (n.type as any) || 'unit',
        label: d?.label || 'Untitled Node',
        description: d?.description || '',
        position: {
          x: Math.round(n.position.x),
          y: Math.round(n.position.y),
        },
        config: d?.config,
      };
    });

    const formattedEdges: LearningPathEdge[] = state.edges.map((e) => {
      const d = e.data as any;
      return {
        id: e.id,
        sourceNodeId: e.source,
        targetNodeId: e.target,
        label: d?.label || '',
        priority: d?.priority || 1,
        isDefault: Boolean(d?.isDefault),
        conditions: d?.conditions || { operator: 'AND', rules: [] },
      };
    });

    return {
      id: state.pathId,
      name: state.pathName,
      description: state.pathDescription,
      status: state.pathStatus,
      version: state.pathVersion,
      canvas: {
        zoom: state.zoom,
        offsetX: 0,
        offsetY: 0,
      },
      nodes: formattedNodes,
      edges: formattedEdges,
    };
  },
}));
