import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal, Base, engine
from app.models.component import Component
from app.models.learning_path import LearningPath

SEED_COMPONENTS = [
    {
        "id": "cmp-assess-math-1",
        "title": "Math Module 1 Assessment",
        "short_description": "Baseline math diagnostic used to route learners into adaptive tiers.",
        "type": "assessment",
        "approximate_duration_minutes": 35,
        "metadata_json": {
            "assessment": {
                "maxScore": 100,
                "passingScore": 50
            }
        }
    },
    {
        "id": "cmp-unit-math-2-easy",
        "title": "Math Module 2 - Easy",
        "short_description": "Foundational math remediation unit targeting core algebra and arithmetic.",
        "type": "unit",
        "approximate_duration_minutes": 35,
        "metadata_json": {
            "unit": {
                "recommendedMinutes": 30
            }
        }
    },
    {
        "id": "cmp-unit-math-2-advanced",
        "title": "Math Module 2 - Advanced",
        "short_description": "Challenging math unit covering advanced algebra, functions, and trigonometry.",
        "type": "unit",
        "approximate_duration_minutes": 35,
        "metadata_json": {
            "unit": {
                "recommendedMinutes": 35
            }
        }
    },
    {
        "id": "cmp-assess-reading-1",
        "title": "Reading & Comp Module 1 Assessment",
        "short_description": "Reading comprehension diagnostic to evaluate critical analysis and vocabulary.",
        "type": "assessment",
        "approximate_duration_minutes": 32,
        "metadata_json": {
            "assessment": {
                "maxScore": 100,
                "passingScore": 60
            }
        }
    },
    {
        "id": "cmp-unit-reading-2-easy",
        "title": "Reading & Comp Module 2 - Easy",
        "short_description": "Guided reading passages with paragraph-level summary prompts.",
        "type": "unit",
        "approximate_duration_minutes": 32,
        "metadata_json": {
            "unit": {
                "recommendedMinutes": 25
            }
        }
    },
    {
        "id": "cmp-unit-reading-2-advanced",
        "title": "Reading & Comp Module 2 - Advanced",
        "short_description": "Complex paired texts and rhetoric analysis for advanced learners.",
        "type": "unit",
        "approximate_duration_minutes": 32,
        "metadata_json": {
            "unit": {
                "recommendedMinutes": 35
            }
        }
    },
    {
        "id": "cmp-assess-diagnostic",
        "title": "General Diagnostic Benchmark",
        "short_description": "Quick multi-subject assessment to establish overall skill readiness.",
        "type": "assessment",
        "approximate_duration_minutes": 25,
        "metadata_json": {
            "assessment": {
                "maxScore": 80,
                "passingScore": 40
            }
        }
    },
    {
        "id": "cmp-unit-foundations",
        "title": "Academic Foundations & Study Strategies",
        "short_description": "Self-paced study unit covering exam timing and problem-solving heuristics.",
        "type": "unit",
        "approximate_duration_minutes": 40,
        "metadata_json": {
            "unit": {
                "recommendedMinutes": 40
            }
        }
    }
]

SAMPLE_LEARNING_PATH = {
    "id": "lp-sat-adaptive-001",
    "name": "SAT Adaptive Path",
    "description": "Routes learners based on math and reading performance across adaptive tiers.",
    "status": "draft",
    "version": 1,
    "canvas": {
        "zoom": 0.8,
        "offsetX": 0,
        "offsetY": 0
    },
    "nodes": [
        {
            "id": "node-start",
            "componentId": "system-start",
            "type": "start",
            "label": "Start Assessment",
            "description": "Initial entry point for all test candidates.",
            "position": {"x": 380, "y": 40}
        },
        {
            "id": "node-math-1",
            "componentId": "cmp-assess-math-1",
            "type": "assessment",
            "label": "Math Module 1",
            "description": "Baseline math diagnostic used to route learners.",
            "position": {"x": 380, "y": 140},
            "config": {
                "approximateDurationMinutes": 35,
                "assessment": {
                    "maxScore": 100,
                    "passingScore": 50
                }
            }
        },
        {
            "id": "node-math-2-group",
            "componentId": "group-math-2",
            "type": "unit",
            "label": "Math Module 2 (Adaptive)",
            "description": "Adaptive group routing learners based on Module 1 score.",
            "position": {"x": 380, "y": 270},
            "config": {
                "approximateDurationMinutes": 35
            }
        },
        {
            "id": "node-math-2-easy",
            "componentId": "cmp-unit-math-2-easy",
            "type": "unit",
            "label": "Math Module 2 - Easy",
            "description": "Foundational math remediation unit.",
            "position": {"x": 230, "y": 400},
            "config": {
                "approximateDurationMinutes": 35
            }
        },
        {
            "id": "node-math-2-advanced",
            "componentId": "cmp-unit-math-2-advanced",
            "type": "unit",
            "label": "Math Module 2 - Advanced",
            "description": "Challenging math unit covering advanced topics.",
            "position": {"x": 530, "y": 400},
            "config": {
                "approximateDurationMinutes": 35
            }
        },
        {
            "id": "node-reading-1",
            "componentId": "cmp-assess-reading-1",
            "type": "assessment",
            "label": "Reading & Comp Module 1",
            "description": "Reading comprehension diagnostic to evaluate critical analysis.",
            "position": {"x": 380, "y": 540},
            "config": {
                "approximateDurationMinutes": 32,
                "assessment": {
                    "maxScore": 100,
                    "passingScore": 60
                }
            }
        },
        {
            "id": "node-end",
            "componentId": "system-end",
            "type": "end",
            "label": "Complete Assessment",
            "description": "Final review and submission node.",
            "position": {"x": 380, "y": 680}
        }
    ],
    "edges": [
        {
            "id": "edge-start-math1",
            "sourceNodeId": "node-start",
            "targetNodeId": "node-math-1",
            "label": "Start assessment",
            "priority": 1,
            "isDefault": True,
            "conditions": {
                "operator": "AND",
                "rules": []
            }
        },
        {
            "id": "edge-math1-group",
            "sourceNodeId": "node-math-1",
            "targetNodeId": "node-math-2-group",
            "label": "Module 1 completed",
            "priority": 1,
            "isDefault": True,
            "conditions": {
                "operator": "AND",
                "rules": [
                    {
                        "id": "rule-math1-complete",
                        "sourceType": "assessment",
                        "sourceNodeId": "node-math-1",
                        "metric": "completion",
                        "operator": "eq",
                        "value": True
                    }
                ]
            }
        },
        {
            "id": "edge-group-easy",
            "sourceNodeId": "node-math-2-group",
            "targetNodeId": "node-math-2-easy",
            "label": "Score < 50%",
            "priority": 1,
            "isDefault": False,
            "conditions": {
                "operator": "AND",
                "rules": [
                    {
                        "id": "rule-math1-low-band",
                        "sourceType": "assessment",
                        "sourceNodeId": "node-math-1",
                        "metric": "score_range",
                        "operator": "between",
                        "range": {
                            "min": 0,
                            "max": 49,
                            "minInclusive": True,
                            "maxInclusive": True
                        }
                    }
                ]
            }
        },
        {
            "id": "edge-group-advanced",
            "sourceNodeId": "node-math-2-group",
            "targetNodeId": "node-math-2-advanced",
            "label": "Score >= 50%",
            "priority": 2,
            "isDefault": False,
            "conditions": {
                "operator": "AND",
                "rules": [
                    {
                        "id": "rule-math1-high-band",
                        "sourceType": "assessment",
                        "sourceNodeId": "node-math-1",
                        "metric": "score",
                        "operator": "gte",
                        "value": 50
                    }
                ]
            }
        },
        {
            "id": "edge-easy-reading",
            "sourceNodeId": "node-math-2-easy",
            "targetNodeId": "node-reading-1",
            "label": "Proceed to Reading",
            "priority": 1,
            "isDefault": True,
            "conditions": {
                "operator": "AND",
                "rules": []
            }
        },
        {
            "id": "edge-adv-reading",
            "sourceNodeId": "node-math-2-advanced",
            "targetNodeId": "node-reading-1",
            "label": "Proceed to Reading",
            "priority": 1,
            "isDefault": True,
            "conditions": {
                "operator": "AND",
                "rules": []
            }
        },
        {
            "id": "edge-reading-end",
            "sourceNodeId": "node-reading-1",
            "targetNodeId": "node-end",
            "label": "Finish Path",
            "priority": 1,
            "isDefault": True,
            "conditions": {
                "operator": "AND",
                "rules": []
            }
        }
    ]
}

def seed_database():
    """Initializes tables and seeds initial components and sample learning path."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed components
        for item in SEED_COMPONENTS:
            existing = db.query(Component).filter(Component.id == item["id"]).first()
            if not existing:
                comp = Component(
                    id=item["id"],
                    title=item["title"],
                    short_description=item["short_description"],
                    type=item["type"],
                    approximate_duration_minutes=item["approximate_duration_minutes"],
                    metadata_json=item["metadata_json"]
                )
                db.add(comp)

        # Seed sample learning path
        sample_path = db.query(LearningPath).filter(LearningPath.id == SAMPLE_LEARNING_PATH["id"]).first()
        if not sample_path:
            lp = LearningPath(
                id=SAMPLE_LEARNING_PATH["id"],
                name=SAMPLE_LEARNING_PATH["name"],
                description=SAMPLE_LEARNING_PATH["description"],
                status=SAMPLE_LEARNING_PATH["status"],
                version=SAMPLE_LEARNING_PATH["version"],
                canvas=SAMPLE_LEARNING_PATH["canvas"],
                nodes=SAMPLE_LEARNING_PATH["nodes"],
                edges=SAMPLE_LEARNING_PATH["edges"]
            )
            db.add(lp)

        db.commit()
        print("Database seeded successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

