import { AvailableContentResponse, LearningPathPayload, EvaluateResponse } from '../types';

const API_BASE = '/api';

export async function fetchComponents(): Promise<AvailableContentResponse> {
  const res = await fetch(`${API_BASE}/components`);
  if (!res.ok) {
    throw new Error(`Failed to load components: ${res.statusText}`);
  }
  return res.json();
}

export async function saveLearningPath(payload: LearningPathPayload): Promise<LearningPathPayload> {
  const res = await fetch(`${API_BASE}/learning-paths`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to save learning path: ${res.statusText}`);
  }
  return res.json();
}

export async function getLearningPath(id: string): Promise<LearningPathPayload> {
  const res = await fetch(`${API_BASE}/learning-paths/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch learning path: ${res.statusText}`);
  }
  return res.json();
}

export async function listLearningPaths(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/learning-paths`);
  if (!res.ok) {
    throw new Error(`Failed to list learning paths: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteLearningPath(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/learning-paths/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete learning path: ${res.statusText}`);
  }
}

export async function evaluatePath(
  pathId: string,
  currentNodeId: string,
  learnerContext: Record<string, any>
): Promise<EvaluateResponse> {
  const res = await fetch(`${API_BASE}/learning-paths/${pathId}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentNodeId, learnerContext }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Evaluation failed: ${res.statusText}`);
  }
  return res.json();
}

export interface AIWorkflowReviewData {
  pathId: string;
  pathName: string;
  overallScore: number;
  status: 'excellent' | 'good' | 'needs_attention';
  structuralHealth: {
    hasStart: boolean;
    hasEnd: boolean;
    isConnected: boolean;
    orphanNodes: string[];
    deadEndNodes: string[];
    totalNodes: number;
    totalEdges: number;
  };
  metrics: {
    totalDurationMinutes: number;
    totalQuestions: number;
    assessmentCount: number;
    unitCount: number;
    groupCount: number;
  };
  curriculumAnalysis: string;
  recommendations: string[];
  modelUsed: string;
}

export async function getAIWorkflowReview(pathId: string): Promise<AIWorkflowReviewData> {
  const res = await fetch(`${API_BASE}/learning-paths/${pathId}/ai-review`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `AI review request failed: ${res.statusText}`);
  }
  return res.json();
}

