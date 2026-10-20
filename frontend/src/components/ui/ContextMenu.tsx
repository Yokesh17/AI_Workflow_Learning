import React, { useEffect, useRef } from 'react';
import { Copy, Trash2, Edit3, Plus, Maximize2, SquareDot, Layers } from 'lucide-react';
import { useFlowStore } from '../../store/useFlowStore';

export interface ContextMenuProps {
  x: number;
  y: number;
  flowPosition: { x: number; y: number };
  targetNodeId: string | null;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  flowPosition,
  targetNodeId,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    selectNode,
    duplicateNode,
    removeNode,
    addGenericNode,
    convertNodeToGroup,
    addSectionToGroup,
    nodes,
  } = useFlowStore();

  const targetNode = nodes.find((n) => n.id === targetNodeId);
  const isStartOrEnd = targetNode?.type === 'start' || targetNode?.type === 'end';
  const isGroup =
    !isStartOrEnd &&
    Boolean(
      (targetNode?.data as any)?.config?.isGroup ||
        (targetNode?.data as any)?.componentId?.includes('group') ||
        targetNode?.id.includes('group') ||
        ((targetNode?.data as any)?.label || '').toLowerCase().includes('group')
    );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') onClose();
    });
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{ top: y, left: x }}
      className="fixed z-50 min-w-[180px] bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100"
    >
      {targetNodeId ? (
        <>
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 truncate">
            {(targetNode?.data as any)?.label || 'Node'}
          </div>

          <button
            onClick={() => {
              selectNode(targetNodeId);
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-medium text-left"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
            <span>Edit Properties</span>
          </button>

          <button
            onClick={() => {
              duplicateNode(targetNodeId);
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-medium text-left"
          >
            <Copy className="w-3.5 h-3.5 text-purple-500" />
            <span>Duplicate Node</span>
          </button>

          {!isStartOrEnd && isGroup && (
            <button
              onClick={() => {
                addSectionToGroup(targetNodeId);
                onClose();
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-purple-50 text-purple-700 font-medium text-left"
            >
              <Plus className="w-3.5 h-3.5 text-purple-600" />
              <span>Add Section to Group</span>
            </button>
          )}

          {!isStartOrEnd && !isGroup && (
            <button
              onClick={() => {
                convertNodeToGroup(targetNodeId);
                onClose();
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-purple-50 text-purple-700 font-medium text-left"
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Convert to Adaptive Group</span>
            </button>
          )}

          <div className="h-px bg-slate-100 my-1" />

          <button
            onClick={() => {
              removeNode(targetNodeId);
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-red-50 text-red-600 font-medium text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Node</span>
          </button>
        </>
      ) : (
        <>
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
            Canvas Actions
          </div>

          <button
            onClick={() => {
              addGenericNode('section', flowPosition);
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-medium text-left"
          >
            <SquareDot className="w-3.5 h-3.5 text-blue-500" />
            <span>Add Assessment Section</span>
          </button>

          <button
            onClick={() => {
              addGenericNode('group', flowPosition);
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-medium text-left"
          >
            <Layers className="w-3.5 h-3.5 text-purple-500" />
            <span>Add Adaptive Group</span>
          </button>
        </>
      )}
    </div>
  );
};

