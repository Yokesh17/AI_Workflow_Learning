import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { PlayCircle } from 'lucide-react';

export const StartNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const label = (data?.label as string) || 'START';

  return (
    <div
      className={`px-5 py-2.5 rounded-full bg-white border-2 flex items-center gap-2.5 shadow-sm transition-all cursor-move ${
        selected ? 'border-emerald-600 ring-3 ring-emerald-100 shadow-md' : 'border-emerald-500 hover:border-emerald-600'
      }`}
    >
      <PlayCircle className="w-5 h-5 text-emerald-500 shrink-0" />
      <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">{label}</span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-white !-bottom-1.5 transition-transform hover:!scale-125"
      />
    </div>
  );
});

StartNode.displayName = 'StartNode';
