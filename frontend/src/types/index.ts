export type NodeType = 'start' | 'unit' | 'assessment' | 'end';

export interface ComponentMetadataAssessment {
  maxScore: number;
  passingScore: number;
}

export interface ComponentMetadataUnit {
  recommendedMinutes?: number;
}

export interface ComponentMetadata {
  assessment?: ComponentMetadataAssessment;
  unit?: ComponentMetadataUnit;
}

export interface ContentComponent {
  id: string;
  title: string;
  shortDescription: string;
  type: 'unit' | 'assessment';
  approximateDurationMinutes: number;
  metadata?: ComponentMetadata;
}

export interface AvailableContentResponse {
  items: ContentComponent[];
  totalCount: number;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeConfigAssessment {
  maxScore: number;
  passingScore: number;
}

export interface NodeConfig {
  approximateDurationMinutes?: number;
  questionsCount?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Adaptive';
  isGroup?: boolean;
  assessment?: NodeConfigAssessment;
}

export interface LearningPathNode {
  id: string;
  componentId: string;
  type: NodeType;
  label: string;
  description?: string;
  position: NodePosition;
  config?: NodeConfig;
}

export type MetricType =
  | 'completion'
  | 'passed'
  | 'score'
  | 'score_range'
  | 'time_spent_minutes'
  | 'percentage_completion';

export type OperatorType = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';

export interface RuleRange {
  min: number;
  max: number;
  minInclusive?: boolean;
  maxInclusive?: boolean;
}

export interface ConditionRule {
  id: string;
  sourceType: 'assessment' | 'unit';
  sourceNodeId: string;
  metric: MetricType;
  operator: OperatorType;
  value?: boolean | number | string;
  range?: RuleRange;
}

export interface EdgeConditions {
  operator: 'AND' | 'OR';
  rules: ConditionRule[];
}

export interface LearningPathEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  priority?: number;
  isDefault?: boolean;
  conditions: EdgeConditions;
}

export interface CanvasConfig {
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface LearningPathPayload {
  id?: string;
  name: string;
  description?: string;
  status: 'draft' | 'published';
  version?: number;
  canvas?: CanvasConfig;
  nodes: LearningPathNode[];
  edges: LearningPathEdge[];
}

export interface EvaluateResponse {
  pathId: string;
  currentNodeId: string;
  nextNodeId: string | null;
  matchedEdgeId: string | null;
  reasoning: string;
  evaluationMode: string;
}

