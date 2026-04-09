import json
from pydantic import BaseModel
from typing import List, Optional
import logging
from .orchestrator import SwarmOrchestrator

logger = logging.getLogger(__name__)

class MealAgent:
    """
    Acts as the Intent Decomposer, executing a primary generation pass,
    followed by an un-wrapped 0.KB CRAG Validator (Critic) pass to eliminate hallucinations.
    """
    def __init__(self):
        self.orchestrator = SwarmOrchestrator()
        
    async def process_cooking_intent(self, available_ingredients: List[str], chef_persona: str, health_modifiers: List[str]) -> dict:
        """
        Decomposes the intent and executes a multi-agent cascade.
        """
        system_prompt = f"""
You are the GS FOOD AI Meal Orchestrator. 
Your active Chef Persona is: {chef_persona}.

You must output valid JSON containing exactly an array of "cards".
Schema:
{{
   "title": "String name of the dish",
   "time": "String estimated time",
   "cuisine": "String cuisine",
   "match_type": "String category (e.g., 'Best Match')",
   "used_inventory_ingredients": [
      {{ "name": "Str", "quantity": 1.0, "unit": "Str", "category": "Str", "is_substitution": false, "substitution_for": null }}
   ],
   "missing_shopping_deficits": [
      {{ "name": "Str", "quantity": 1.0, "unit": "Str", "category": "Str", "is_substitution": false, "substitution_for": null }}
   ],
   "compliance": {{
      "is_compliant": true,
      "violated_rules": [],
      "blocked_ingredients": [],
      "warning_level": "SAFE",
      "explanation": "Brief explanation of health logic"
   }},
   "ai_explanation_trace": [
      "Reasoning string 1",
      "Reasoning string 2"
   ]
}}

Dietary restrictions: {', '.join(health_modifiers) if health_modifiers else 'None'}.
You MUST return ONLY JSON matching this exact structure.
"""
        user_prompt = f"Available ingredients: {', '.join(available_ingredients) if available_ingredients else 'None provided'}."

        # Pass 1: Generation
        initial_output = await self.orchestrator.execute_cascade(system_prompt, user_prompt)
        
        try:
            initial_output = self._clean_json(initial_output)
            initial_payload = json.loads(initial_output)
            
            # 0.KB SKILL INJECTION: CRAG VALIDATOR / CRITIC PASS
            # Un-wrapped direct LLM call to validate its own output
            validation_prompt = f"""
You are an uncompromising Culinary Critic Agent.
The user ONLY has these ingredients available: {', '.join(available_ingredients)}.
The generation agent just proposed this JSON recipe list: 
{json.dumps(initial_payload)}

TASK: Fix the JSON. 
1. If any recipe uses a core ingredient the user DOES NOT have, move its object to "missing_shopping_deficits".
2. If "used_inventory_ingredients" contains something not in the user's real list, fix it or mark it as a substitution.
3. Keep the strict JSON structure perfectly intact. Return ONLY the JSON.
"""
            validated_output = await self.orchestrator.execute_cascade(validation_prompt, "Review and fix the JSON.")
            validated_output = self._clean_json(validated_output)
            
            return json.loads(validated_output)

        except Exception as e:
            logger.error(f"Agent Pipeline Failed: {e}")
            # Strict fallback guaranteeing UI survival with structured data
            return {
                "cards": [
                    {
                        "title": "Chef's Safety Wrap",
                        "time": "5 min",
                        "cuisine": chef_persona,
                        "match_type": "Fastest",
                        "used_inventory_ingredients": [
                            {"name": available_ingredients[0] if available_ingredients else "Bread", "quantity": 1.0, "unit": "serving", "category": "Staple", "is_substitution": False, "substitution_for": None}
                        ],
                        "missing_shopping_deficits": [
                            {"name": "Any filler", "quantity": 1.0, "unit": "serving", "category": "Produce", "is_substitution": False, "substitution_for": None}
                        ],
                        "compliance": {
                            "is_compliant": True,
                            "violated_rules": [],
                            "blocked_ingredients": [],
                            "warning_level": "SAFE",
                            "explanation": "Fallback triggered."
                        },
                        "ai_explanation_trace": [
                            "System encountered an error.",
                            "Safety recipe loaded automatically."
                        ]
                    }
                ]
            }

    def _clean_json(self, raw: str) -> str:
        if raw.startswith("```json"):
            return raw[7:-3]
        if raw.startswith("```"):
            return raw[3:-3]
        return raw.strip()
