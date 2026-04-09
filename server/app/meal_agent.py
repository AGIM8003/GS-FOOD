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
   "matchType": "String category (e.g., 'Best Match')",
   "available": ["Array of ingredients EXACTLY from user list"],
   "missing": ["Array of minimal additional ingredients"],
   "whyThis": "Brief string explaining why."
}}

Dietary restrictions: {', '.join(health_modifiers) if health_modifiers else 'None'}.
You MUST return ONLY JSON.
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
1. If any recipe uses a core ingredient the user DOES NOT have, move it to "missing".
2. If "available" contains something not in the user's real list, fix it.
3. Keep the JSON structure perfectly intact. Return ONLY the JSON.
"""
            validated_output = await self.orchestrator.execute_cascade(validation_prompt, "Review and fix the JSON.")
            validated_output = self._clean_json(validated_output)
            
            return json.loads(validated_output)

        except Exception as e:
            logger.error(f"Agent Pipeline Failed: {e}")
            # Strict fallback guaranteeing UI survival
            return {
                "cards": [
                    {
                        "title": "Chef's Safety Wrap",
                        "time": "5 min",
                        "cuisine": chef_persona,
                        "matchType": "Fastest",
                        "available": available_ingredients[:2] if available_ingredients else ["Bread"],
                        "missing": ["Any filler"],
                        "whyThis": f"Validator fallback invoked. Enjoy a quick wrap."
                    }
                ]
            }

    def _clean_json(self, raw: str) -> str:
        if raw.startswith("```json"):
            return raw[7:-3]
        if raw.startswith("```"):
            return raw[3:-3]
        return raw.strip()
