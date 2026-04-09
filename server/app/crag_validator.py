import json
from datetime import datetime

class CRAGValidator:
    """
    Corrective Retrieval Augmented Generation (CRAG) node for GS FOOD Cook Mode.
    Ensures safe ingredient substitutions and flags hallucinatory / harmful combinations.
    """
    
    def __init__(self):
        # In a full implementation, this runs local Llama/Qwen SLMs or hits Swarm APIs
        self.safety_rules = {
            "chicken": ["must_be_cooked_through", "cross_contamination_risk"],
            "raw_egg": ["salmonella_risk", "requires_refrigeration"],
            "bleach": ["POISON_DO_NOT_CONSUME"]
        }

    def evaluate_generation(self, recipe_proposal: dict) -> dict:
        """
        Grades the recipe proposal. If the retrieval is correct and safe, returns 
        the recipe. If it hallucinates safety risks, triggers a rewrite.
        """
        ingredients = recipe_proposal.get("ingredients", [])
        
        for item in ingredients:
            lower_item = str(item).lower()
            if "bleach" in lower_item or "detergent" in lower_item:
                return {
                    "status": "REJECTED",
                    "reason": f"CRITICAL SAFETY VIOLATION: Inedible or hazardous item detected: {item}",
                    "rewrite_required": True,
                    "recipe": None
                }
                
            if "raw chicken" in lower_item and recipe_proposal.get("category") == "salad":
                return {
                    "status": "CORRECTED",
                    "reason": "Raw poultry applied to cold no-bake dish. Correcting to 'cooked chicken breast'.",
                    "rewrite_required": False,
                    "recipe": {
                         **recipe_proposal,
                         "ingredients": [i if i != item else "Fully cooked chicken breast" for i in ingredients]
                    }
                }

        # Safe Generation
        return {
            "status": "APPROVED",
            "reason": "Passed CRAG safety check.",
            "rewrite_required": False,
            "recipe": recipe_proposal
        }

# Simulated Route / FastApi Endpoint for CRAG
def crag_evaluation_route(payload: dict):
    validator = CRAGValidator()
    result = validator.evaluate_generation(payload)
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "crag_result": result
    }
