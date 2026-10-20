from typing import TypedDict, Optional, Any

class LearnerState(TypedDict):
    path_id: str
    current_node_id: str
    learner_context: dict[str, Any]
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]
    candidate_edges: list[dict[str, Any]]
    matched_edge_id: Optional[str]
    next_node_id: Optional[str]
    reasoning: str
    evaluation_mode: str

