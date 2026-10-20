import React from 'react';
import { SquareDot, Layers, BookOpen, PlayCircle, CheckCircle2, Info } from 'lucide-react';
import { useFlowStore } from '../../store/useFlowStore';

export const LeftPanel: React.FC = () => {
  const { addGenericNode } = useFlowStore();

  const handleGenericDragStart = (e: React.DragEvent, type: 'assessment' | 'unit' | 'section' | 'group' | 'start' | 'end') => {
    e.dataTransfer.setData('application/json', JSON.stringify({ kind: 'generic', type }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const commonComponents: Array<{
    type: 'section' | 'group' | 'unit' | 'start' | 'end';
    label: string;
    badge: string;
    badgeClass: string;
    iconBgClass: string;
    icon: React.ReactNode;
    description: string;
    defaultY: number;
  }> = [
    {
      type: 'section',
      label: 'Assessment Section',
      badge: 'Section',
      badgeClass: 'bg-blue-100 text-blue-700',
      iconBgClass: 'bg-blue-500',
      icon: <SquareDot className="w-5 h-5 text-white" />,
      description: 'Test module with configurable questions & passing score',
      defaultY: 200,
    },
    {
      type: 'group',
      label: 'Adaptive Group',
      badge: 'Group',
      badgeClass: 'bg-purple-100 text-purple-700',
      iconBgClass: 'bg-purple-600',
      icon: <Layers className="w-5 h-5 text-white" />,
      description: 'Container grouping sections for conditional routing',
      defaultY: 280,
    },
    {
      type: 'unit',
      label: 'Learning Unit',
      badge: 'Unit',
      badgeClass: 'bg-emerald-100 text-emerald-700',
      iconBgClass: 'bg-emerald-600',
      icon: <BookOpen className="w-5 h-5 text-white" />,
      description: 'Instructional lesson or study content module',
      defaultY: 360,
    },
    {
      type: 'start',
      label: 'START',
      badge: 'Start',
      badgeClass: 'bg-emerald-100 text-emerald-700',
      iconBgClass: 'bg-emerald-500',
      icon: <PlayCircle className="w-5 h-5 text-white" />,
      description: 'Initial entry point for the learning workflow',
      defaultY: 120,
    },
    {
      type: 'end',
      label: 'END',
      badge: 'End',
      badgeClass: 'bg-amber-100 text-amber-700',
      iconBgClass: 'bg-amber-500',
      icon: <CheckCircle2 className="w-5 h-5 text-white" />,
      description: 'Target completion point and score calculation',
      defaultY: 440,
    },
  ];

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 select-none overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900">Components</h2>
        <p className="text-xs text-slate-500 mt-0.5">Drag or click to add common node components</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Common Components List */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Common Components ({commonComponents.length})
          </div>

          {commonComponents.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => handleGenericDragStart(e, item.type)}
              onClick={() => addGenericNode(item.type, { x: 380, y: item.defaultY })}
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50/70 cursor-grab active:cursor-grabbing transition-all group shadow-2xs"
            >
              <div
                className={`w-9 h-9 rounded-lg ${item.iconBgClass} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform mt-0.5`}
              >
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-sm font-semibold text-slate-800 leading-tight">
                    {item.label}
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                  {item.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How it works guidance box */}
        <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>How it works:</span>
          </div>
          <ul className="space-y-1.5 pl-5 list-disc text-[11px] text-slate-600">
            <li><strong className="text-slate-800">Add Sections:</strong> Add assessment or learning modules.</li>
            <li><strong className="text-slate-800">Use Groups:</strong> Route multiple sections where only one is shown.</li>
            <li><strong className="text-slate-800">Set Conditions:</strong> Set conditions based on previous section scores.</li>
            <li><strong className="text-slate-800">Auto-Routing:</strong> System automatically routes learners based on performance.</li>
          </ul>
        </div>

        {/* Reference Example Structure */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 block">
            Example: SAT Adaptive Test
          </span>

          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
            <span className="font-semibold text-slate-800 block">Math Module 1</span>
            <span className="text-[10px] text-slate-500">Regular section</span>
          </div>

          <div className="p-2.5 rounded-xl border border-purple-300 bg-purple-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900">Math Module 2 (Group)</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                Group
              </span>
            </div>
            <div className="space-y-1.5 pl-2 border-l-2 border-purple-200">
              <div className="p-2 rounded bg-white border border-purple-100 text-[11px]">
                <span className="font-semibold text-slate-800 block">Easy Version</span>
                <span className="text-[10px] text-purple-700 font-mono">If score &lt; 50%</span>
              </div>
              <div className="p-2 rounded bg-white border border-purple-100 text-[11px]">
                <span className="font-semibold text-slate-800 block">Advanced</span>
                <span className="text-[10px] text-purple-700 font-mono">If score ≥ 50%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
