from langgraph.graph import StateGraph, END
from app.agent.state import LearnerState
from app.agent.nodes import find_outgoing_edges, rule_evaluator_node, llm_reasoning_node

def build_evaluation_graph():
    """Builds and compiles the LangGraph evaluation workflow."""
    workflow = StateGraph(LearnerState)

    # Register workflow nodes
    workflow.add_node("find_outgoing", find_outgoing_edges)
    workflow.add_node("evaluate_rules", rule_evaluator_node)
    workflow.add_node("llm_reasoning", llm_reasoning_node)

    # Set workflow edges
    workflow.set_entry_point("find_outgoing")
    workflow.add_edge("find_outgoing", "evaluate_rules")
    workflow.add_edge("evaluate_rules", "llm_reasoning")
    workflow.add_edge("llm_reasoning", END)

    return workflow.compile()

# Cached compiled graph
compiled_graph = build_evaluation_graph()

def run_evaluation(
    path_id: str,
    current_node_id: str,
    learner_context: dict,
    nodes: list,
    edges: list
) -> LearnerState:
    """Executes the LangGraph evaluation pipeline."""
    initial_state: LearnerState = {
        "path_id": path_id,
        "current_node_id": current_node_id,
        "learner_context": learner_context,
        "nodes": nodes,
        "edges": edges,
        "candidate_edges": [],
        "matched_edge_id": None,
        "next_node_id": None,
        "reasoning": "",
        "evaluation_mode": "deterministic"
    }

    result = compiled_graph.invoke(initial_state)
    return result

