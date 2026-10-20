import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Layers, SquareDot, Trash2, X, Eye } from 'lucide-react';
import { useFlowStore } from '../../store/useFlowStore';

export const UnitNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const label = (data?.label as string) || 'Learning Unit';
  const config = (data?.config as any) || {};
  const isGroup = config.isGroup || (data?.componentId as string)?.includes('group') || label.toLowerCase().includes('group') || label.toLowerCase().includes('adaptive');
  const duration = config.approximateDurationMinutes ?? 35;
  const questionsCount = config.questionsCount ?? 22;
  const removeNode = useFlowStore((s) => s.removeNode);
  const edges = useFlowStore((s) => s.edges);
  const nodes = useFlowStore((s) => s.nodes);

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!selected) {
      setShowPreview(false);
    }
  }, [selected]);

  if (isGroup) {
    const childEdges = edges.filter((e) => e.source === id);

    return (
      <div
        onClick={() => setShowPreview((prev) => !prev)}
        className={`group relative w-64 bg-white rounded-xl border-2 transition-all p-3.5 shadow-sm hover:shadow-md cursor-pointer ${
          selected ? 'border-purple-600 ring-3 ring-purple-100 shadow-md' : 'border-purple-500 hover:border-purple-600'
        }`}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-purple-600 !w-3 !h-3 !border-2 !border-white !-top-1.5 transition-transform hover:!scale-125"
        />

        {/* Delete button on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeNode(id);
          }}
          title="Delete section"
          className="nodrag absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xs z-10"
        >
          <Trash2 className="w-3 h-3" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm font-semibold text-slate-900 truncate" title={label}>
                {label.replace(' (Group)', '').replace(' (Adaptive)', '')}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 shrink-0">
                Group
              </span>
            </div>
            <div className="text-xs text-purple-700 mt-0.5 font-medium truncate">
              {config.description || 'Adaptive based on Module 1 performance'}
            </div>
          </div>
        </div>

        {/* Temporary Preview Popover on Click */}
        {showPreview && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="nodrag cursor-default absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border-2 border-purple-500 p-3 z-50 animate-fade-in text-left"
          >
            <div className="flex items-center justify-between pb-2 border-b border-purple-100 mb-2">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-xs font-bold text-slate-900">
                  Group Sections ({childEdges.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close preview"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {childEdges.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-2">
                No downstream sections connected yet. Connect this group to sections to define routing branches.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {childEdges.map((edge) => {
                  const targetNode = nodes.find((n) => n.id === edge.target);
                  const targetLabel = (targetNode?.data as any)?.label || edge.target;
                  const edgeData = edge.data as any;
                  const firstRule = edgeData?.conditions?.rules?.[0];
                  const condSummary = edgeData?.label
                    ? edgeData.label
                    : firstRule
                    ? `${firstRule.metric} ${firstRule.operator} ${firstRule.value ?? ''}`
                    : edgeData?.isDefault
                    ? 'Default path'
                    : 'Always';

                  return (
                    <div
                      key={edge.id}
                      className="p-2 rounded-lg bg-purple-50/70 border border-purple-100 text-xs flex items-center justify-between gap-2"
                    >
                      <span className="font-semibold text-purple-950 truncate max-w-[130px]" title={targetLabel}>
                        ▸ {targetLabel}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-purple-700 border border-purple-200 shrink-0">
                        {condSummary}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-purple-50 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Temporary group view</span>
              <span className="text-purple-600 font-medium">Click ✕ to dismiss</span>
            </div>
          </div>
        )}

        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-purple-600 !w-3 !h-3 !border-2 !border-white !-bottom-1.5 transition-transform hover:!scale-125"
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className="!bg-purple-500 !w-2.5 !h-2.5 !border-2 !border-white !-left-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="!bg-purple-500 !w-2.5 !h-2.5 !border-2 !border-white !-right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    );
  }

  return (
    <div
      className={`group relative w-64 bg-white rounded-xl border-2 transition-all p-3.5 shadow-sm hover:shadow-md cursor-move ${
        selected ? 'border-blue-600 ring-3 ring-blue-100 shadow-md' : 'border-blue-500 hover:border-blue-600'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-600 !w-3 !h-3 !border-2 !border-white !-top-1.5 transition-transform hover:!scale-125"
      />

      {/* Delete button on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeNode(id);
        }}
        title="Delete unit"
        className="nodrag absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xs z-10"
      >
        <Trash2 className="w-3 h-3" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
          <SquareDot className="w-5 h-5 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900 truncate" title={label}>
            {label}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {questionsCount > 0 && `${questionsCount} questions • `}
            {duration} minutes
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-600 !w-3 !h-3 !border-2 !border-white !-bottom-1.5 transition-transform hover:!scale-125"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!bg-blue-500 !w-2.5 !h-2.5 !border-2 !border-white !-left-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-blue-500 !w-2.5 !h-2.5 !border-2 !border-white !-right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
});

UnitNode.displayName = 'UnitNode';
