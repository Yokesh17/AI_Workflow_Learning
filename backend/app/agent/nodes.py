import os
import json
import httpx
from typing import Any
from app.agent.state import LearnerState
from dotenv import load_dotenv

load_dotenv()

def evaluate_single_rule(rule: dict[str, Any], context: dict[str, Any]) -> bool:
    """Evaluates a single condition rule against learner context."""
    metric = rule.get("metric")
    op = rule.get("operator")
    expected_value = rule.get("value")
    rule_range = rule.get("range")

    # Extract actual value from context
    actual_value = context.get(metric)
    if actual_value is None:
        source_node_id = rule.get("sourceNodeId")
        if source_node_id and isinstance(context.get(source_node_id), dict):
            actual_value = context[source_node_id].get(metric)

    if actual_value is None:
        return False

    if op == "eq":
        return actual_value == expected_value
    elif op == "ne":
        return actual_value != expected_value
    elif op == "gt":
        return float(actual_value) > float(expected_value)
    elif op == "gte":
        return float(actual_value) >= float(expected_value)
    elif op == "lt":
        return float(actual_value) < float(expected_value)
    elif op == "lte":
        return float(actual_value) <= float(expected_value)
    elif op == "between":
        if not rule_range:
            return False
        val = float(actual_value)
        min_val = float(rule_range.get("min", float("-inf")))
        max_val = float(rule_range.get("max", float("inf")))
        min_inc = rule_range.get("minInclusive", True)
        max_inc = rule_range.get("maxInclusive", True)

        min_ok = (val >= min_val) if min_inc else (val > min_val)
        max_ok = (val <= max_val) if max_inc else (val < max_val)
        return min_ok and max_ok

    return False

def evaluate_edge_conditions(edge: dict[str, Any], context: dict[str, Any]) -> bool:
    """Evaluates whether all or any rules for an edge are satisfied."""
    conditions = edge.get("conditions")
    if not conditions:
        return edge.get("isDefault", False)

    rules = conditions.get("rules", [])
    if not rules:
        return edge.get("isDefault", False)

    logical_op = conditions.get("operator", "AND").upper()
    results = [evaluate_single_rule(rule, context) for rule in rules]

    if logical_op == "OR":
        return any(results)
    else:  # AND
        return all(results)

def find_outgoing_edges(state: LearnerState) -> LearnerState:
    """Finds all candidate edges originating from the current node."""
    current_node_id = state["current_node_id"]
    edges = state.get("edges", [])

    candidates = [e for e in edges if e.get("sourceNodeId") == current_node_id]
    # Sort candidates by priority ascending (1 = highest priority)
    candidates.sort(key=lambda x: x.get("priority", 999))

    return {
        **state,
        "candidate_edges": candidates
    }

def rule_evaluator_node(state: LearnerState) -> LearnerState:
    """Evaluates rules deterministically across candidate edges."""
    candidates = state.get("candidate_edges", [])
    context = state.get("learner_context", {})

    matched_edge = None
    default_edge = None

    for edge in candidates:
        if edge.get("isDefault"):
            default_edge = edge
        if evaluate_edge_conditions(edge, context):
            matched_edge = edge
            break

    # If no rule matched, fallback to default edge
    chosen_edge = matched_edge or default_edge

    if chosen_edge:
        matched_edge_id = chosen_edge.get("id")
        next_node_id = chosen_edge.get("targetNodeId")
        if matched_edge:
            label = matched_edge.get("label", "conditional route")
            reason = f"Learner satisfied progression criteria for edge '{label}' (ID: {matched_edge_id}) transitioning to node '{next_node_id}' with context {context}."
        else:
            label = default_edge.get("label", "default fallback")
            reason = f"No conditional rules matched; routed via default fallback edge '{label}' (ID: {matched_edge_id}) to node '{next_node_id}'."
    else:
        matched_edge_id = None
        next_node_id = None
        reason = f"No eligible transition found from node '{state['current_node_id']}' with context {context}."

    return {
        **state,
        "matched_edge_id": matched_edge_id,
        "next_node_id": next_node_id,
        "reasoning": reason,
        "evaluation_mode": "deterministic"
    }

def llm_reasoning_node(state: LearnerState) -> LearnerState:
    """Uses Grok or local LLM (OpenAI-compatible) to enrich pedagogical explanation."""
    api_key = os.getenv("LLM_API_KEY", "")
    base_url = os.getenv("LLM_BASE_URL", "https://api.x.ai/v1").rstrip("/")
    model_name = os.getenv("LLM_MODEL_NAME", "grok-2-latest")

    # If no API key or dummy placeholder, keep deterministic reasoning
    if not api_key or api_key.strip() in ("", "your_api_key_here"):
        return state

    try:
        endpoint = f"{base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json"
        }
        prompt = (
            f"You are an adaptive curriculum engine for an online learning path.\n"
            f"A learner just finished node '{state['current_node_id']}'.\n"
            f"Learner Context: {json.dumps(state['learner_context'])}\n"
            f"Target Next Node: {state.get('next_node_id')}\n"
            f"Transition Rule: {state.get('reasoning')}\n\n"
            f"Provide 2 concise sentences explaining the pedagogical justification for routing the learner here."
        )
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": "You are an expert AI curriculum routing assistant."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 120
        }

        with httpx.Client(timeout=8.0) as client:
            resp = client.post(endpoint, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"].strip()
                return {
                    **state,
                    "reasoning": content,
                    "evaluation_mode": "langgraph-llm"
                }
            else:
                return {
                    **state,
                    "reasoning": f"{state['reasoning']} (LLM response code: {resp.status_code})",
                    "evaluation_mode": "deterministic"
                }
    except Exception as e:
        return {
            **state,
            "reasoning": f"{state['reasoning']} (LLM enrichment skipped: {str(e)})",
            "evaluation_mode": "deterministic"
        }

