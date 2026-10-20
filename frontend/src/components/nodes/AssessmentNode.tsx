import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { SquareDot, Trash2 } from 'lucide-react';
import { useFlowStore } from '../../store/useFlowStore';

export const AssessmentNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const label = (data?.label as string) || 'Assessment Module';
  const config = (data?.config as any) || {};
  const questionsCount = config.questionsCount ?? 22;
  const duration = config.approximateDurationMinutes ?? 35;
  const removeNode = useFlowStore((s) => s.removeNode);

  return (
    <div
      className={`group relative w-64 bg-white rounded-xl border-2 transition-all p-3.5 shadow-sm hover:shadow-md cursor-move ${
        selected ? 'border-blue-600 ring-3 ring-blue-100 shadow-md' : 'border-blue-500 hover:border-blue-600'
      }`}
    >
      {/* Target Handle Top */}
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
        title="Delete section"
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

      {/* Source Handles */}
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

AssessmentNode.displayName = 'AssessmentNode';
