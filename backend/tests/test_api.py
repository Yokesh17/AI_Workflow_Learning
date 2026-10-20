import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine
from app.seed import seed_database

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_get_components():
    response = client.get("/api/components")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "totalCount" in data
    assert data["totalCount"] >= 2
    assert len(data["items"]) == data["totalCount"]

    first_item = data["items"][0]
    assert "id" in first_item
    assert "title" in first_item
    assert "shortDescription" in first_item
    assert first_item["type"] in ["unit", "assessment"]
    assert "approximateDurationMinutes" in first_item

def test_save_and_get_learning_path():
    payload = {
        "id": "lp-test-unit-01",
        "name": "Integration Test Learning Path",
        "description": "Testing save and retrieval",
        "status": "draft",
        "version": 1,
        "canvas": {"zoom": 1.0, "offsetX": 0, "offsetY": 0},
        "nodes": [
            {
                "id": "node-1",
                "componentId": "cmp-assess-math-1",
                "type": "assessment",
                "label": "Math Diagnostic",
                "position": {"x": 100, "y": 100},
                "config": {
                    "approximateDurationMinutes": 35,
                    "assessment": {"maxScore": 100, "passingScore": 50}
                }
            },
            {
                "id": "node-2",
                "componentId": "cmp-unit-math-2-easy",
                "type": "unit",
                "label": "Math Easy Unit",
                "position": {"x": 100, "y": 250}
            }
        ],
        "edges": [
            {
                "id": "edge-1-2",
                "sourceNodeId": "node-1",
                "targetNodeId": "node-2",
                "label": "Low score route",
                "priority": 1,
                "isDefault": False,
                "conditions": {
                    "operator": "AND",
                    "rules": [
                        {
                            "id": "rule-score-low",
                            "sourceType": "assessment",
                            "sourceNodeId": "node-1",
                            "metric": "score",
                            "operator": "lt",
                            "value": 50
                        }
                    ]
                }
            }
        ]
    }

    # Save
    post_res = client.post("/api/learning-paths", json=payload)
    assert post_res.status_code == 201
    saved_data = post_res.json()
    assert saved_data["id"] == "lp-test-unit-01"
    assert len(saved_data["nodes"]) == 2
    assert len(saved_data["edges"]) == 1

    # Retrieve
    get_res = client.get("/api/learning-paths/lp-test-unit-01")
    assert get_res.status_code == 200
    retrieved_data = get_res.json()
    assert retrieved_data["name"] == "Integration Test Learning Path"
    assert retrieved_data["nodes"][0]["id"] == "node-1"

def test_evaluate_endpoint_low_score():
    # Evaluate with score < 50
    req_body = {
        "currentNodeId": "node-1",
        "learnerContext": {
            "score": 35,
            "completion": True,
            "passed": False
        }
    }
    response = client.post("/api/learning-paths/lp-test-unit-01/evaluate", json=req_body)
    assert response.status_code == 200
    eval_data = response.json()
    assert eval_data["nextNodeId"] == "node-2"
    assert eval_data["matchedEdgeId"] == "edge-1-2"
    assert "evaluationMode" in eval_data

def test_evaluate_endpoint_no_match():
    # Evaluate with score >= 50 which doesn't match edge-1-2 and there's no default edge
    req_body = {
        "currentNodeId": "node-1",
        "learnerContext": {
            "score": 85,
            "completion": True,
            "passed": True
        }
    }
    response = client.post("/api/learning-paths/lp-test-unit-01/evaluate", json=req_body)
    assert response.status_code == 200
    eval_data = response.json()
    assert eval_data["nextNodeId"] is None
    assert eval_data["matchedEdgeId"] is None

def test_delete_learning_path():
    # Delete the test path
    del_res = client.delete("/api/learning-paths/lp-test-unit-01")
    assert del_res.status_code == 204

    # Verify 404 on get
    get_res = client.get("/api/learning-paths/lp-test-unit-01")
    assert get_res.status_code == 404

def test_evaluate_unit_percentage_completion():
    # Test Unit progression rule (Table 7: percentage_completion >= 80 routes learner forward)
    payload = {
        "id": "lp-test-unit-rules",
        "name": "Unit Rules Test Path",
        "status": "draft",
        "nodes": [
            {
                "id": "node-u1",
                "componentId": "cmp-unit-1",
                "type": "unit",
                "label": "Foundation Unit",
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "node-u2",
                "componentId": "cmp-unit-2",
                "type": "unit",
                "label": "Advanced Unit",
                "position": {"x": 100, "y": 300}
            }
        ],
        "edges": [
            {
                "id": "edge-u1-u2",
                "sourceNodeId": "node-u1",
                "targetNodeId": "node-u2",
                "label": "80% completion route",
                "priority": 1,
                "isDefault": False,
                "conditions": {
                    "operator": "AND",
                    "rules": [
                        {
                            "id": "rule-pct-comp",
                            "sourceType": "unit",
                            "sourceNodeId": "node-u1",
                            "metric": "percentage_completion",
                            "operator": "gte",
                            "value": 80
                        }
                    ]
                }
            }
        ]
    }
    client.post("/api/learning-paths", json=payload)

    # Context with 85% completion should match
    res_match = client.post("/api/learning-paths/lp-test-unit-rules/evaluate", json={
        "currentNodeId": "node-u1",
        "learnerContext": {"percentage_completion": 85}
    })
    assert res_match.status_code == 200
    assert res_match.json()["nextNodeId"] == "node-u2"

    # Context with 60% completion should NOT match
    res_nomatch = client.post("/api/learning-paths/lp-test-unit-rules/evaluate", json={
        "currentNodeId": "node-u1",
        "learnerContext": {"percentage_completion": 60}
    })
    assert res_nomatch.status_code == 200
    assert res_nomatch.json()["nextNodeId"] is None

def test_table7_schema_metric_validation():
    # Attempting to assign 'score' to a Unit node must fail Table 7 validation with 422
    invalid_payload = {
        "name": "Invalid Table 7 Path",
        "status": "draft",
        "nodes": [
            {"id": "n1", "componentId": "c1", "type": "unit", "label": "U1", "position": {"x": 0, "y": 0}},
            {"id": "n2", "componentId": "c2", "type": "unit", "label": "U2", "position": {"x": 0, "y": 100}}
        ],
        "edges": [
            {
                "id": "e1",
                "sourceNodeId": "n1",
                "targetNodeId": "n2",
                "conditions": {
                    "operator": "AND",
                    "rules": [
                        {
                            "id": "r1",
                            "sourceType": "unit",
                            "sourceNodeId": "n1",
                            "metric": "score",  # Invalid for unit!
                            "operator": "gte",
                            "value": 50
                        }
                    ]
                }
            }
        ]
    }
    res = client.post("/api/learning-paths", json=invalid_payload)
    assert res.status_code == 422

def test_ai_review_endpoint():
    res = client.post("/api/learning-paths/lp-sat-adaptive-001/ai-review")
    assert res.status_code == 200
    data = res.json()
    assert "overallScore" in data
    assert "structuralHealth" in data
    assert "recommendations" in data
    assert data["pathId"] == "lp-sat-adaptive-001"


