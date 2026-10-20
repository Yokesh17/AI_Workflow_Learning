import os
import json
import httpx
from typing import Any
from dotenv import load_dotenv

load_dotenv()

def generate_workflow_ai_review(
    path_id: str,
    path_name: str,
    nodes: list[dict[str, Any]],
    edges: list[dict[str, Any]]
) -> dict[str, Any]:
    """Generates an AI-driven and structural review of the complete curriculum workflow."""
    node_ids = {n.get("id") for n in nodes if n.get("id")}
    start_nodes = [n for n in nodes if n.get("type") == "start"]
    end_nodes = [n for n in nodes if n.get("type") == "end"]

    outgoing_map: dict[str, list[str]] = {nid: [] for nid in node_ids}
    incoming_map: dict[str, list[str]] = {nid: [] for nid in node_ids}

    for e in edges:
        src = e.get("sourceNodeId")
        tgt = e.get("targetNodeId")
        if src in outgoing_map and tgt:
            outgoing_map[src].append(tgt)
        if tgt in incoming_map and src:
            incoming_map[tgt].append(src)

    # Reachability from start
    reachable = set()
    if start_nodes:
        queue = [start_nodes[0].get("id")]
        while queue:
            curr = queue.pop(0)
            if curr not in reachable:
                reachable.add(curr)
                queue.extend(outgoing_map.get(curr, []))

    has_start = len(start_nodes) > 0
    has_end = len(end_nodes) > 0
    end_id = end_nodes[0].get("id") if has_end else None
    is_connected = bool(end_id and end_id in reachable)

    orphan_nodes = [nid for nid in node_ids if len(incoming_map.get(nid, [])) == 0 and len(outgoing_map.get(nid, [])) == 0]
    dead_ends = [
        nid for nid in node_ids
        if len(outgoing_map.get(nid, [])) == 0 and (not end_nodes or nid != end_nodes[0].get("id")) and nid not in orphan_nodes
    ]

    # Metrics
    total_duration = 0
    total_questions = 0
    assessments = 0
    units = 0
    groups = 0

    for n in nodes:
        ntype = n.get("type")
        cfg = n.get("config") or {}
        label = (n.get("label") or "").lower()
        if cfg.get("isGroup") or "group" in label or "adaptive" in label:
            groups += 1
        elif ntype == "assessment":
            assessments += 1
            total_questions += int(cfg.get("questionsCount") or 0)
        elif ntype == "unit":
            units += 1

        dur = cfg.get("approximateDurationMinutes")
        if dur:
            total_duration += int(dur)

    # Structural Score (0-100)
    score = 100
    if not has_start:
        score -= 25
    if not has_end:
        score -= 25
    if has_start and has_end and not is_connected:
        score -= 30
    if orphan_nodes:
        score -= len(orphan_nodes) * 10
    if dead_ends:
        score -= len(dead_ends) * 10
    score = max(10, min(100, score))

    status = "excellent" if score >= 90 else ("good" if score >= 70 else "needs_attention")

    structural_health = {
        "hasStart": has_start,
        "hasEnd": has_end,
        "isConnected": is_connected,
        "orphanNodes": orphan_nodes,
        "deadEndNodes": dead_ends,
        "totalNodes": len(nodes),
        "totalEdges": len(edges)
    }

    metrics = {
        "totalDurationMinutes": total_duration,
        "totalQuestions": total_questions,
        "assessmentCount": assessments,
        "unitCount": units,
        "groupCount": groups
    }

    # Query Groq LLM for Pedagogical and Workflow Review
    api_key = os.getenv("LLM_API_KEY", "")
    base_url = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
    model_name = os.getenv("LLM_MODEL_NAME", "openai/gpt-oss-120b")

    analysis_text = ""
    recommendations = []

    if api_key and api_key.strip() not in ("", "your_api_key_here"):
        try:
            summary = {
                "name": path_name,
                "node_count": len(nodes),
                "edge_count": len(edges),
                "has_start_and_end": has_start and has_end,
                "connected_to_end": is_connected,
                "assessments": assessments,
                "units": units,
                "groups": groups,
                "total_duration_minutes": total_duration,
                "total_questions": total_questions,
                "rules": [
                    {
                        "source": e.get("sourceNodeId"),
                        "target": e.get("targetNodeId"),
                        "label": e.get("label"),
                        "conditions": e.get("conditions")
                    }
                    for e in edges if e.get("conditions")
                ]
            }

            prompt = (
                f"You are a master curriculum architect and psychometrics expert.\n"
                f"Review this adaptive learning curriculum graph:\n"
                f"{json.dumps(summary, indent=2)}\n\n"
                f"Provide:\n"
                f"1. A concise 2-3 paragraph pedagogical critique evaluating learning flow, assessment rigor, adaptive branching, and pacing.\n"
                f"2. Exactly 3 concrete, bulleted recommendations to improve this curriculum."
            )

            payload = {
                "model": model_name,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert AI curriculum reviewer and psychometrics auditor. Provide rigorous, clear, encouraging feedback."
                    },
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 1200
            }

            with httpx.Client(timeout=15.0) as client:
                res = client.post(
                    f"{base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {api_key.strip()}", "Content-Type": "application/json"},
                    json=payload
                )
                if res.status_code == 200:
                    resp_data = res.json()
                    choice = resp_data.get("choices", [{}])[0]
                    content = choice.get("message", {}).get("content", "")
                    if not content and choice.get("message", {}).get("reasoning"):
                        content = choice.get("message", {}).get("reasoning")

                    if content:
                        parts = content.split("Recommendations")
                        if len(parts) >= 2:
                            analysis_text = parts[0].strip()
                            raw_recs = parts[1].strip()
                            for line in raw_recs.split("\n"):
                                clean = line.strip().lstrip("-*123456789. ")
                                if clean and len(clean) > 8:
                                    recommendations.append(clean)
                        else:
                            analysis_text = content.strip()

        except Exception as e:
            print("Groq review error, using deterministic fallback:", e)

    # High quality fallback if LLM is offline or output parsing needed
    if not analysis_text:
        if is_connected:
            analysis_text = (
                f"The curriculum '{path_name}' establishes an effective adaptive workflow comprising {len(nodes)} nodes "
                f"and {len(edges)} directed transitions. The path successfully connects the START terminal through "
                f"diagnostic assessments and adaptive modules down to the END completion node. "
                f"Learners encounter approximately {total_questions} questions across {total_duration} estimated minutes of engagement."
            )
        else:
            analysis_text = (
                f"The curriculum graph for '{path_name}' has structural discontinuities. The START node does not currently "
                f"reach the END terminal across all active branches. Review the transitions and connect orphan branches."
            )

    if not recommendations:
        if orphan_nodes:
            recommendations.append(f"Connect or remove {len(orphan_nodes)} disconnected orphan nodes from the canvas.")
        if dead_ends:
            recommendations.append(f"Provide exit transitions or default fallback routes for nodes without downstream paths ({', '.join(dead_ends)}).")
        if assessments > 0 and units == 0:
            recommendations.append("Consider interspersing instructional Unit modules alongside assessments to reinforce student mastery.")
        if total_duration > 120:
            recommendations.append("The total curriculum duration exceeds 2 hours; consider dividing it into smaller modular milestones.")
        if len(recommendations) < 3:
            recommendations.append("Verify Table 7 conditional boundaries (e.g. ensure both passing and failing score intervals have distinct target paths).")
            recommendations.append("Calibrate question counts to align with the recommended 1.5 - 2 minutes per question benchmark.")

    return {
        "pathId": path_id,
        "pathName": path_name,
        "overallScore": score,
        "status": status,
        "structuralHealth": structural_health,
        "metrics": metrics,
        "curriculumAnalysis": analysis_text,
        "recommendations": recommendations[:4],
        "modelUsed": model_name if api_key else "Deterministic Graph Engine"
    }

