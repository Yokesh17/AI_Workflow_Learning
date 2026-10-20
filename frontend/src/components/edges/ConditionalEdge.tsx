import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from '@xyflow/react';

export const ConditionalEdge: React.FC<EdgeProps> = memo((props) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    selected,
    data,
  } = props;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const conditions = (data?.conditions as any) || {};
  const rules = conditions?.rules || [];
  const label = (data?.label as string) || '';
  const isDefault = Boolean(data?.isDefault);
  const hasRules = rules.length > 0;

  // Generate clean summary text for badge
  let badgeText = label;
  if (!badgeText) {
    if (hasRules) {
      const r = rules[0];
      if (r.operator === 'between' && r.range) {
        badgeText = `${r.metric}: ${r.range.min} - ${r.range.max}`;
      } else if (r.metric === 'score') {
        badgeText = `Score ${r.operator === 'gte' ? '≥' : r.operator === 'lte' ? '≤' : r.operator === 'lt' ? '<' : '>'} ${r.value}`;
      } else {
        badgeText = `${r.metric} ${r.operator} ${r.value}`;
      }
    } else if (isDefault) {
      badgeText = 'Default';
    }
  }

  // Edge styling
  const isConditional = hasRules && !isDefault;
  const strokeColor = selected
    ? '#2563eb'
    : isConditional
    ? '#9333ea'
    : '#64748b';

  const strokeDash = isConditional ? '5 5' : undefined;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: selected ? 2.5 : 2,
          strokeDasharray: strokeDash,
        }}
      />
      {badgeText && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border shadow-xs transition-transform hover:scale-105 cursor-pointer whitespace-nowrap ${
              selected
                ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-200'
                : isConditional
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {badgeText}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

ConditionalEdge.displayName = 'ConditionalEdge';

