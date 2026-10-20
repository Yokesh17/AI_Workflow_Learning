import React from 'react';
import { Trash2, Plus, X, GitCommit, Sliders, ChevronDown, Layers, ArrowRight } from 'lucide-react';
import { useFlowStore } from '../../store/useFlowStore';
import { ConditionRule, MetricType, OperatorType } from '../../types';

export const RightPanel: React.FC = () => {
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    updateNode,
    removeNode,
    updateNodeType,
    updateNodeContentType,
    selectNode,
    convertNodeToGroup,
    convertNodeToSection,
    addSectionToGroup,
    assignSectionToGroup,
    updateEdge,
    removeEdge,
    pathName,
    setPathName,
    pathDescription,
    setPathDescription,
  } = useFlowStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  // 1. If a Node is selected
  if (selectedNode) {
    const data = selectedNode.data as any;
    const config = data.config || {};
    const isStartOrEnd = selectedNode.type === 'start' || selectedNode.type === 'end';
    const isGroup =
      !isStartOrEnd &&
      (config.isGroup ||
        (data?.componentId as string)?.includes('group') ||
        selectedNode.id.includes('group') ||
        (data.label || '').toLowerCase().includes('group') ||
        (data.label || '').toLowerCase().includes('adaptive'));
    const isAssessment = selectedNode.type === 'assessment';

    // Find incoming edges to show connected conditions
    const incomingEdges = edges.filter((e) => e.target === selectedNode.id);
    const outgoingEdges = edges.filter((e) => e.source === selectedNode.id);

    // Parent group detection for section nodes
    const allGroups = nodes.filter(
      (n) =>
        n.id !== selectedNode.id &&
        ((n.data as any)?.config?.isGroup ||
          (n.data as any)?.componentId?.includes('group') ||
          n.id.includes('group') ||
          ((n.data as any)?.label || '').toLowerCase().includes('group'))
    );
    const parentGroupEdge = edges.find((e) => e.target === selectedNode.id && allGroups.some((g) => g.id === e.source));
    const parentGroupNode = parentGroupEdge ? allGroups.find((g) => g.id === parentGroupEdge.source) : null;

    return (
      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 select-none overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Properties</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  isGroup
                    ? 'bg-purple-100 text-purple-700'
                    : isStartOrEnd
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {isGroup ? 'Group' : isStartOrEnd ? selectedNode.type : 'Section'}
              </span>
              {!isGroup && !isStartOrEnd && (
                <span className="text-[10px] text-slate-400 capitalize">
                  ({selectedNode.type})
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => removeNode(selectedNode.id)}
            title="Delete Section"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Content Type Selector (For Sections only) */}
          {!isGroup && !isStartOrEnd && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Content Type</label>
              <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => updateNodeContentType(selectedNode.id, 'assessment')}
                  className={`flex-1 py-1.5 rounded-md font-semibold transition-all text-center ${
                    selectedNode.type === 'assessment'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Assessment
                </button>
                <button
                  type="button"
                  onClick={() => updateNodeContentType(selectedNode.id, 'unit')}
                  className={`flex-1 py-1.5 rounded-md font-semibold transition-all text-center ${
                    selectedNode.type === 'unit'
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Unit
                </button>
              </div>
            </div>
          )}

          {/* Label */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Label</label>
            <input
              type="text"
              value={data.label || ''}
              onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50/50"
              placeholder={isGroup ? 'e.g. Math Module 2 (Group)' : 'e.g. Math Module 2 - Easy'}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={data.description || ''}
              onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50/50 resize-none"
              placeholder={isGroup ? 'Adaptive based on Module 1 performance' : 'Enter description'}
            />
          </div>

          {/* Grouping Actions for Section */}
          {!isGroup && !isStartOrEnd && (
            <button
              type="button"
              onClick={() => convertNodeToGroup(selectedNode.id)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-semibold text-purple-700 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Convert this Section into an Adaptive Group</span>
            </button>
          )}

          {/* If GROUP node: show Group details & Member sections */}
          {isGroup ? (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Adaptive Group Routing</span>
                </div>
                <p className="text-[11px] text-purple-700 leading-relaxed">
                  Connect multiple branching sections from this group. Only one section will be dynamically assigned to each learner based on their performance score.
                </p>
              </div>

              {/* Group Quick Actions */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => addSectionToGroup(selectedNode.id)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Section to this Group</span>
                </button>

                <button
                  type="button"
                  onClick={() => convertNodeToSection(selectedNode.id)}
                  className="w-full text-center text-[11px] text-slate-500 hover:text-slate-800 underline transition-colors"
                >
                  Convert back to Regular Section
                </button>
              </div>

              {/* Group Sections List */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-800">
                    Group Sections ({outgoingEdges.length})
                  </span>
                </div>
                {outgoingEdges.length === 0 ? (
                  <div className="p-3 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                    No sections connected yet. Connect this group to sections on the canvas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {outgoingEdges.map((edge) => {
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
                          className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-slate-800 truncate" title={targetLabel}>
                              ▸ {targetLabel}
                            </div>
                            <div className="text-[10px] text-purple-700 font-mono mt-0.5 truncate">
                              {condSummary}
                            </div>
                          </div>
                          {targetNode && (
                            <button
                              type="button"
                              onClick={() => selectNode(targetNode.id)}
                              className="px-2 py-1 text-[10px] font-semibold text-purple-600 bg-white border border-purple-200 rounded hover:bg-purple-50 transition-colors shrink-0"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : !isStartOrEnd ? (
            /* If SECTION node: show Section Details, Difficulty, Assessment Criteria, Parent Group */
            <>
              {/* Section Details */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  {isAssessment ? 'Assessment Section Details' : 'Learning Unit Details'}
                </label>
                {isAssessment ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Questions</span>
                      <input
                        type="number"
                        min={0}
                        value={config.questionsCount ?? 0}
                        onChange={(e) =>
                          updateNode(selectedNode.id, {
                            config: { ...config, questionsCount: parseInt(e.target.value) || 0 },
                          })
                        }
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Duration (min)</span>
                      <input
                        type="number"
                        min={1}
                        value={config.approximateDurationMinutes ?? 30}
                        onChange={(e) =>
                          updateNode(selectedNode.id, {
                            config: {
                              ...config,
                              approximateDurationMinutes: parseInt(e.target.value) || 30,
                            },
                          })
                        }
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50/50"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Duration (min)</span>
                    <input
                      type="number"
                      min={1}
                      value={config.approximateDurationMinutes ?? 30}
                      onChange={(e) =>
                        updateNode(selectedNode.id, {
                          config: {
                            ...config,
                            approximateDurationMinutes: parseInt(e.target.value) || 30,
                          },
                        })
                      }
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50/50"
                    />
                  </div>
                )}
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                <select
                  value={config.difficulty || 'Medium'}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      config: { ...config, difficulty: e.target.value as any },
                    })
                  }
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50/50"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Adaptive">Adaptive</option>
                </select>
              </div>

              {/* Assessment Criteria (if assessment) */}
              {isAssessment && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
                  <span className="text-xs font-semibold text-blue-900 block">Assessment Criteria</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-600 block mb-1">Max Score</span>
                      <input
                        type="number"
                        min={1}
                        value={config.assessment?.maxScore ?? 100}
                        onChange={(e) =>
                          updateNode(selectedNode.id, {
                            config: {
                              ...config,
                              assessment: {
                                maxScore: parseInt(e.target.value) || 100,
                                passingScore: config.assessment?.passingScore ?? 50,
                              },
                            },
                          })
                        }
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-600 block mb-1">Passing Score</span>
                      <input
                        type="number"
                        min={0}
                        value={config.assessment?.passingScore ?? 50}
                        onChange={(e) =>
                          updateNode(selectedNode.id, {
                            config: {
                              ...config,
                              assessment: {
                                maxScore: config.assessment?.maxScore ?? 100,
                                passingScore: parseInt(e.target.value) || 50,
                              },
                            },
                          })
                        }
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Parent Group with Dropdown Assignment */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-800">Parent Group</span>
                  {parentGroupNode && (
                    <button
                      type="button"
                      onClick={() => selectNode(parentGroupNode.id)}
                      className="text-[10px] font-semibold text-purple-700 hover:underline"
                    >
                      Focus Group
                    </button>
                  )}
                </div>
                <select
                  value={parentGroupNode?.id || ''}
                  onChange={(e) => assignSectionToGroup(selectedNode.id, e.target.value || null)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="">No parent group (Standalone Section)</option>
                  {allGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {(g.data as any)?.label || g.id}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  {parentGroupNode
                    ? `Assigned to "${(parentGroupNode.data as any)?.label}".`
                    : 'Select an adaptive group on the canvas to group this section.'}
                </p>
              </div>
            </>
          ) : null}

          {/* Incoming Connections / Assignment Conditions */}
          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-800">Assignment Conditions</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Define when this section should be shown to learners based on connected previous sections.
            </p>

            {incomingEdges.length === 0 ? (
              <div className="p-3 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                Connect a connector from a previous module to define entry rules.
              </div>
            ) : (
              <div className="space-y-2">
                {incomingEdges.map((edge, idx) => {
                  const edgeData = edge.data as any;
                  const sourceNode = nodes.find((n) => n.id === edge.source);
                  const sourceTitle = (sourceNode?.data as any)?.label || edge.source;
                  const rules = edgeData?.conditions?.rules || [];

                  return (
                    <div key={edge.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Condition {idx + 1}</span>
                        <span className="text-[10px] text-slate-400">From: {sourceTitle}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100 font-mono">
                        {rules.length > 0
                          ? rules.map((r: ConditionRule) => `${r.metric} ${r.operator} ${r.value ?? `${r.range?.min}-${r.range?.max}`}`).join(' AND ')
                          : edgeData?.isDefault
                          ? 'Default fallback path'
                          : 'Always active transition'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    );
  }

  // 2. If an Edge is selected
  if (selectedEdge) {
    const data = (selectedEdge.data as any) || {};
    const conditions = data.conditions || { operator: 'AND', rules: [] };
    const rules: ConditionRule[] = conditions.rules || [];

    const sourceNode = nodes.find((n) => n.id === selectedEdge.source);
    const targetNode = nodes.find((n) => n.id === selectedEdge.target);

    const sourceTitle = (sourceNode?.data as any)?.label || selectedEdge.source;
    const targetTitle = (targetNode?.data as any)?.label || selectedEdge.target;
    const isAssessmentSource =
      (sourceNode?.data as any)?.type === 'assessment' || sourceNode?.type === 'assessment';

    const handleAddRule = () => {
      const newRule: ConditionRule = {
        id: `rule-${Date.now().toString().slice(-4)}`,
        sourceType: isAssessmentSource ? 'assessment' : 'unit',
        sourceNodeId: selectedEdge.source,
        metric: isAssessmentSource ? 'score' : 'percentage_completion',
        operator: 'gte',
        value: isAssessmentSource ? 50 : 80,
      };

      updateEdge(selectedEdge.id, {
        conditions: {
          ...conditions,
          rules: [...rules, newRule],
        },
      });
    };

    const handleUpdateRule = (ruleId: string, updates: Partial<ConditionRule>) => {
      const updatedRules = rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r));
      updateEdge(selectedEdge.id, {
        conditions: {
          ...conditions,
          rules: updatedRules,
        },
      });
    };

    const handleRemoveRule = (ruleId: string) => {
      const updatedRules = rules.filter((r) => r.id !== ruleId);
      updateEdge(selectedEdge.id, {
        conditions: {
          ...conditions,
          rules: updatedRules,
        },
      });
    };

    return (
      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 select-none overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Connection Properties</h2>
            <p className="text-xs text-slate-500">
              {sourceTitle} → {targetTitle}
            </p>
          </div>
          <button
            onClick={() => removeEdge(selectedEdge.id)}
            title="Delete Connection"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Source node type context banner */}
          <div
            className={`p-2.5 rounded-xl border text-xs ${
              isAssessmentSource
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-purple-50/70 border-purple-200 text-purple-900'
            }`}
          >
            <div className="font-semibold flex items-center justify-between">
              <span>Source: {isAssessmentSource ? 'Assessment Section' : 'Learning Unit'}</span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white border border-slate-200">
                Table 7 Spec
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              {isAssessmentSource
                ? 'Allowed metrics: completion, passed, score, score_range'
                : 'Allowed metrics: completion, time_spent_minutes, percentage_completion'}
            </p>
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Label</label>
            <input
              type="text"
              value={data.label || ''}
              onChange={(e) => updateEdge(selectedEdge.id, { label: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50/50"
              placeholder="e.g. Score ≥ 50%"
            />
          </div>

          {/* Priority & Default */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <input
                type="number"
                min={1}
                value={data.priority ?? 1}
                onChange={(e) =>
                  updateEdge(selectedEdge.id, { priority: parseInt(e.target.value) || 1 })
                }
                className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50/50"
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 pb-2">
                <input
                  type="checkbox"
                  checked={Boolean(data.isDefault)}
                  onChange={(e) => updateEdge(selectedEdge.id, { isDefault: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Default Route
              </label>
            </div>
          </div>

          {/* Logical Operator (AND / OR) */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-xs font-semibold text-slate-700">Combine Rules With</span>
            <div className="flex rounded-md bg-slate-100 p-0.5 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() =>
                  updateEdge(selectedEdge.id, {
                    conditions: { ...conditions, operator: 'AND' },
                  })
                }
                className={`px-2.5 py-1 rounded font-semibold transition-all ${
                  conditions.operator === 'AND'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                AND
              </button>
              <button
                type="button"
                onClick={() =>
                  updateEdge(selectedEdge.id, {
                    conditions: { ...conditions, operator: 'OR' },
                  })
                }
                className={`px-2.5 py-1 rounded font-semibold transition-all ${
                  conditions.operator === 'OR'
                    ? 'bg-white text-purple-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                OR
              </button>
            </div>
          </div>

          {/* Rules Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Rules ({rules.length})</span>
              <button
                type="button"
                onClick={handleAddRule}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Condition
              </button>
            </div>

            {rules.length === 0 ? (
              <div className="p-3 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                No conditional rules defined. Click "+ Add Condition" to route learners dynamically.
              </div>
            ) : (
              rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5 relative"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Condition {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(rule.id)}
                      className="text-slate-400 hover:text-red-600 p-0.5 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Metric */}
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-0.5">Metric</span>
                    <select
                      value={rule.metric}
                      onChange={(e) => {
                        const newMetric = e.target.value as MetricType;
                        const isScoreRange = newMetric === 'score_range';
                        handleUpdateRule(rule.id, {
                          metric: newMetric,
                          operator: isScoreRange ? 'between' : rule.operator,
                          range: isScoreRange
                            ? { min: 0, max: 49, minInclusive: true, maxInclusive: true }
                            : undefined,
                          value: isScoreRange
                            ? undefined
                            : newMetric === 'percentage_completion'
                            ? 80
                            : newMetric === 'time_spent_minutes'
                            ? 30
                            : 50,
                        });
                      }}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      {isAssessmentSource ? (
                        <>
                          <option value="score">Score (Diagnostic Threshold)</option>
                          <option value="score_range">Score Range (Between Band)</option>
                          <option value="passed">Passed (True/False)</option>
                          <option value="completion">Completion (True/False)</option>
                        </>
                      ) : (
                        <>
                          <option value="percentage_completion">Percentage Completion (%)</option>
                          <option value="time_spent_minutes">Time Spent (Minutes)</option>
                          <option value="completion">Completion (True/False)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Operator */}
                  {rule.metric !== 'score_range' && (
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">Operator</span>
                      <select
                        value={rule.operator}
                        onChange={(e) =>
                          handleUpdateRule(rule.id, {
                            operator: e.target.value as OperatorType,
                          })
                        }
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="gte">Greater than or equal (≥)</option>
                        <option value="gt">Greater than (&gt;)</option>
                        <option value="lte">Less than or equal (≤)</option>
                        <option value="lt">Less than (&lt;)</option>
                        <option value="eq">Equals (=)</option>
                        <option value="ne">Not equals (≠)</option>
                        <option value="between">Between (Range)</option>
                      </select>
                    </div>
                  )}

                  {/* Value or Range */}
                  {rule.operator === 'between' || rule.metric === 'score_range' ? (
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">Range (Min - Max)</span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={rule.range?.min ?? 0}
                          onChange={(e) =>
                            handleUpdateRule(rule.id, {
                              range: {
                                ...(rule.range || { max: 100 }),
                                min: parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full text-xs px-2 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={rule.range?.max ?? 100}
                          onChange={(e) =>
                            handleUpdateRule(rule.id, {
                              range: {
                                ...(rule.range || { min: 0 }),
                                max: parseFloat(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full text-xs px-2 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ) : rule.metric === 'completion' || rule.metric === 'passed' ? (
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">Value</span>
                      <select
                        value={String(rule.value)}
                        onChange={(e) =>
                          handleUpdateRule(rule.id, { value: e.target.value === 'true' })
                        }
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="true">True (Yes)</option>
                        <option value="false">False (No)</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">Threshold Value</span>
                      <input
                        type="number"
                        value={rule.value as number ?? 50}
                        onChange={(e) =>
                          handleUpdateRule(rule.id, { value: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}

                  {/* Generated summary pill */}
                  <div className="pt-1">
                    <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                      {rule.operator === 'between' || rule.metric === 'score_range'
                        ? `Route if ${rule.metric} in [${rule.range?.min ?? 0}, ${rule.range?.max ?? 0}]`
                        : rule.metric === 'percentage_completion'
                        ? `Route if completion ${rule.operator === 'gte' ? '≥' : rule.operator === 'gt' ? '>' : rule.operator === 'lte' ? '≤' : rule.operator === 'lt' ? '<' : rule.operator} ${rule.value}%`
                        : rule.metric === 'time_spent_minutes'
                        ? `Route if time spent ${rule.operator === 'gte' ? '≥' : rule.operator === 'gt' ? '>' : rule.operator === 'lte' ? '≤' : rule.operator === 'lt' ? '<' : rule.operator} ${rule.value} min`
                        : `Route if ${rule.metric} ${rule.operator} ${rule.value}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    );
  }

  // 3. If nothing is selected: Overview panel
  return (
    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 select-none overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900">Learning Path</h2>
        <p className="text-xs text-slate-500">Global Settings & Summary</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Path Name</label>
          <input
            type="text"
            value={pathName}
            onChange={(e) => setPathName(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={pathDescription}
            onChange={(e) => setPathDescription(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50/50 resize-none"
            placeholder="Describe the target audience and learning objectives..."
          />
        </div>

        {/* Stats card */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <span className="text-xs font-semibold text-slate-700 block">Graph Summary</span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-white rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Total Nodes</span>
              <span className="text-base font-bold text-slate-800">{nodes.length}</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Connections</span>
              <span className="text-base font-bold text-slate-800">{edges.length}</span>
            </div>
          </div>
        </div>

        <div className="p-3 text-xs text-slate-500 bg-amber-50/60 rounded-xl border border-amber-200/60">
          💡 <strong>Tip:</strong> Click on any section node or connection line on the canvas to configure its properties and progression conditions.
        </div>
      </div>
    </aside>
  );
};

