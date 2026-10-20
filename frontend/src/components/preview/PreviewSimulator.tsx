import React, { useState, useMemo } from 'react';
import {
  Play,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  PlayCircle,
  ShieldCheck,
  Check,
  XCircle,
  FileText,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { useFlowStore } from '../../store/useFlowStore';
import { evaluatePath, getAIWorkflowReview, AIWorkflowReviewData } from '../../api/client';
import { EvaluateResponse } from '../../types';
import { Node, Edge } from '@xyflow/react';

function getOrderedNodes(nodes: Node[], edges: Edge[]): Node[] {
  let seenStart = false;
  let seenEnd = false;
  const uniqueNodesMap = new Map<string, Node>();

  for (const n of nodes) {
    if (uniqueNodesMap.has(n.id)) continue;
    if (n.type === 'start') {
      if (seenStart) continue;
      seenStart = true;
    }
    if (n.type === 'end') {
      if (seenEnd) continue;
      seenEnd = true;
    }
    uniqueNodesMap.set(n.id, n);
  }

  const uniqueNodes = Array.from(uniqueNodesMap.values());
  const startNode = uniqueNodes.find((n) => n.type === 'start') || uniqueNodes[0];
  if (!startNode) return uniqueNodes;

  const ordered: Node[] = [];
  const visited = new Set<string>();
  const queue: string[] = [startNode.id];

  while (queue.length > 0) {
    const currId = queue.shift()!;
    if (visited.has(currId)) continue;
    visited.add(currId);

    const node = uniqueNodes.find((n) => n.id === currId);
    if (node && node.type !== 'end') {
      ordered.push(node);
    }

    const outgoing = edges
      .filter((e) => e.source === currId)
      .sort((a, b) => ((a.data as any)?.priority || 99) - ((b.data as any)?.priority || 99));

    for (const edge of outgoing) {
      if (!visited.has(edge.target) && !queue.includes(edge.target)) {
        queue.push(edge.target);
      }
    }
  }

  for (const node of uniqueNodes) {
    if (!visited.has(node.id) && node.type !== 'end') {
      ordered.push(node);
    }
  }

  const endNode = uniqueNodes.find((n) => n.type === 'end');
  if (endNode) {
    ordered.push(endNode);
  }

  return ordered;
}

export const PreviewSimulator: React.FC = () => {
  const { pathId, pathName, nodes, edges } = useFlowStore();

  const orderedNodes = useMemo(() => getOrderedNodes(nodes, edges), [nodes, edges]);
  const startNode = orderedNodes.find((n) => n.type === 'start') || orderedNodes[0];

  const [currentNodeId, setCurrentNodeId] = useState<string>(startNode?.id || '');
  const [score, setScore] = useState<number>(45);
  const [passed, setPassed] = useState<boolean>(false);
  const [completion, setCompletion] = useState<boolean>(true);
  const [timeSpent, setTimeSpent] = useState<number>(30);
  const [percentageCompletion, setPercentageCompletion] = useState<number>(85);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{ from: string; to: string; reason: string; mode: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  // AI Review State
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);
  const [reviewData, setReviewData] = useState<AIWorkflowReviewData | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const currentNode = orderedNodes.find((n) => n.id === currentNodeId) || nodes.find((n) => n.id === currentNodeId);
  const currentLabel = (currentNode?.data as any)?.label || currentNodeId;

  const isStart = currentNode?.type === 'start';
  const isEnd = currentNode?.type === 'end';
  const isAssessment = currentNode?.type === 'assessment';
  const isUnit = currentNode?.type === 'unit';

  const handleStep = async () => {
    if (!currentNodeId || isEnd) return;
    setIsLoading(true);
    setError(null);

    const context = {
      score,
      passed: score >= 50 ? true : passed,
      completion,
      time_spent_minutes: timeSpent,
      percentage_completion: percentageCompletion,
    };

    try {
      const res: EvaluateResponse = await evaluatePath(pathId, currentNodeId, context);

      if (res.nextNodeId) {
        const nextNode = orderedNodes.find((n) => n.id === res.nextNodeId) || nodes.find((n) => n.id === res.nextNodeId);
        const nextLabel = (nextNode?.data as any)?.label || res.nextNodeId;

        setHistory((prev) => [
          ...prev,
          {
            from: currentLabel,
            to: nextLabel,
            reason: res.reasoning,
            mode: res.evaluationMode,
          },
        ]);
        setCurrentNodeId(res.nextNodeId);
      } else {
        setError(res.reasoning || 'No matching transition found for the current learner scores.');
      }
    } catch (err: any) {
      setError(err.message || 'Evaluation request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentNodeId(startNode?.id || '');
    setHistory([]);
    setError(null);
  };

  const handleRunAIReview = async () => {
    try {
      setReviewLoading(true);
      setReviewError(null);
      const data = await getAIWorkflowReview(pathId);
      setReviewData(data);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to generate AI workflow review');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="flex-1 h-full bg-slate-100/60 p-8 flex flex-col items-center justify-start overflow-y-auto">
      <div className="w-full max-w-3xl space-y-6">
        {/* Card Header & AI Review Trigger */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900">Adaptive Learner Simulator</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Test conditional routing node-by-node, or generate a comprehensive AI workflow review for the entire path.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleRunAIReview}
              disabled={reviewLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60"
            >
              {reviewLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Auditing Workflow...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Whole Workflow Review</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* AI Workflow Review Output Card */}
        {reviewError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{reviewError}</span>
          </div>
        )}

        {reviewData && (
          <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  AI Workflow Review & Health Audit: <span className="text-purple-700">{reviewData.pathName}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    reviewData.status === 'excellent'
                      ? 'bg-emerald-100 text-emerald-800'
                      : reviewData.status === 'good'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Score: {reviewData.overallScore}/100
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {reviewData.modelUsed}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Estimated Duration</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                  {reviewData.metrics.totalDurationMinutes} min
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Questions Load</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                  {reviewData.metrics.totalQuestions} questions
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Assessment Modules</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                  {reviewData.metrics.assessmentCount} modules
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Connectivity</span>
                <span className="text-sm font-bold text-emerald-600 mt-0.5 flex items-center justify-center gap-1">
                  {reviewData.structuralHealth.isConnected ? <Check className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                  {reviewData.structuralHealth.isConnected ? 'START → END Reached' : 'Broken Route'}
                </span>
              </div>
            </div>

            {/* Pedagogical Analysis */}
            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1.5">
              <span className="text-xs font-bold text-purple-900 block">Curriculum & Pacing Assessment</span>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {reviewData.curriculumAnalysis}
              </p>
            </div>

            {/* Recommendations */}
            {reviewData.recommendations.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Key Recommendations</span>
                <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-600">
                  {reviewData.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Current State & Simulator Controls */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Current Learner Location
              </span>
              <span className="text-base font-bold text-slate-800 flex items-center gap-2 mt-0.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isEnd ? 'bg-slate-700' : isStart ? 'bg-emerald-500' : 'bg-blue-500'
                  } animate-pulse`}
                />
                {currentLabel} ({currentNode?.type})
              </span>
            </div>

            {/* Topological Sorted Dropdown */}
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Jump to Node (Flow Order)</label>
              <select
                value={currentNodeId}
                onChange={(e) => setCurrentNodeId(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-medium"
              >
                {orderedNodes.map((n, idx) => (
                  <option key={n.id} value={n.id}>
                    {idx + 1}. {(n.data as any)?.label || n.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Input UI Based on Node Type */}
          {isStart ? (
            /* START NODE: No test options */
            <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950">START Node</h4>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  This is the initial entry point for all learners. No score or completion parameters are required for START. Click below to begin the assessment flow and evaluate progression into the first module.
                </p>
              </div>
            </div>
          ) : isEnd ? (
            /* END NODE: No test options, completion message */
            <div className="p-5 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>END Node Reached - Learning Path Complete!</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The learner has reached the terminal point of this curriculum. All diagnostic evaluations, adaptive branches, and lessons have finished.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restart Simulator from START
                </button>
              </div>
            </div>
          ) : isUnit ? (
            /* UNIT NODE: Only Unit Progression Inputs (No Exam Score) */
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700">
                  Unit Progression Parameters (Table 7):
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  Learning Unit Mode
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Time Spent (min)</span>
                  <input
                    type="number"
                    min={1}
                    value={timeSpent}
                    onChange={(e) => setTimeSpent(parseInt(e.target.value) || 30)}
                    className="w-full text-xs font-semibold px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-slate-50"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Completion Status</span>
                  <select
                    value={String(completion)}
                    onChange={(e) => setCompletion(e.target.value === 'true')}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-slate-50"
                  >
                    <option value="true">True (Completed)</option>
                    <option value="false">False (In Progress)</option>
                  </select>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Percentage Completion (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={percentageCompletion}
                    onChange={(e) => setPercentageCompletion(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-semibold px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-slate-50"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ASSESSMENT NODE: Diagnostic Evaluation Inputs */
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700">
                  Assessment Diagnostic Parameters (Table 7):
                </span>
                <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                  Assessment Mode
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Exam Score (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-semibold px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Passed (≥50%)</span>
                  <select
                    value={String(score >= 50)}
                    onChange={(e) => setPassed(e.target.value === 'true')}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50"
                  >
                    <option value="true">True (Passed)</option>
                    <option value="false">False (Failed)</option>
                  </select>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Completion</span>
                  <select
                    value={String(completion)}
                    onChange={(e) => setCompletion(e.target.value === 'true')}
                    className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50"
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {isEnd ? (
              <button
                disabled={true}
                className="w-full py-2.5 bg-slate-200 text-slate-500 rounded-xl text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Terminal Node Reached (No Outgoing Transitions)</span>
              </button>
            ) : isStart ? (
              <button
                onClick={handleStep}
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Initiating Workflow...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Begin Assessment Flow (Start Transition)
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleStep}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running LangGraph Workflow...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Evaluate Next Progression Step with LangGraph
                  </>
                )}
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* History / Decision Trail */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              LangGraph Routing Trail ({history.length})
            </h3>
            <div className="space-y-3">
              {history.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <span>{step.from}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                      <span className="text-purple-700">{step.to}</span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      {step.mode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                    {step.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
