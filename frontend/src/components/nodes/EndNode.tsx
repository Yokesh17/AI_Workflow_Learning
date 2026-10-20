import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { CheckCircle2 } from 'lucide-react';

export const EndNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const label = (data?.label as string) || 'END';

  return (
    <div
      className={`px-5 py-2.5 rounded-full bg-white border-2 flex items-center gap-2.5 shadow-sm transition-all cursor-move ${
        selected ? 'border-slate-800 ring-3 ring-slate-100 shadow-md' : 'border-slate-600 hover:border-slate-800'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-600 !w-3 !h-3 !border-2 !border-white !-top-1.5 transition-transform hover:!scale-125"
      />
      <CheckCircle2 className="w-5 h-5 text-slate-700 shrink-0" />
      <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">{label}</span>
    </div>
  );
});

EndNode.displayName = 'EndNode';
