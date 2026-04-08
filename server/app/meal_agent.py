import json
from pydantic import BaseModel
from typing import List, Optional
from .orchestrator import SwarmOrchestrator

class MealAgent:
    """
    Acts as the Intent Decomposer and Context Builder from the NOOR Swarm model.
    Takes user input, health modifiers, and persona, structuring them into a rigid prompt.
    """
    def __init__(self):
        self.orchestrator = SwarmOrchestrator()
        
    async def process_cooking_intent(self, available_ingredients: List[str], chef_persona: str, health_modifiers: List[str]) -> dict:
        """
        Decomposes the intent and calls the cascade.
        """
        system_prompt = f"""
You are the GS FOOD AI Meal Orchestrator, operating under the NOOR design principles.
Your active Chef Persona is: {chef_persona}.

You must output valid JSON containing exactly a an array of "cards".
Each card must perfectly match this schema:
{{
   "title": "String name of the dish",
   "time": "String estimated time (e.g., '15 min')",
   "cuisine": "String inferred cuisine based on Persona",
   "matchType": "String category (e.g., 'Best Match', 'Save Food', 'Fastest')",
   "available": ["Array of ingredients from user list"],
   "missing": ["Array of additional ingredients required"],
   "whyThis": "Brief string explaining why this matches their health context and persona."
}}

The user's dietary & health restrictions: {', '.join(health_modifiers) if health_modifiers else 'None'}.
You MUST return ONLY JSON.
"""
        user_prompt = f"Available ingredients: {', '.join(available_ingredients) if available_ingredients else 'None provided'}."

        orchestrator_output = await self.orchestrator.execute_cascade(system_prompt, user_prompt)
        
        try:
            # Strip potential Markdown backticks if the cascade returned them
            if orchestrator_output.startswith("```json"):
                orchestrator_output = orchestrator_output[7:-3]
            
            payload = json.loads(orchestrator_output)
            return payload
        except Exception as e:
            # Fallback wrapper ensuring structured output never fails the UI
            return {
                "cards": [
                    {
                        "title": "Chef's Safety Wrap",
                        "time": "5 min",
                        "cuisine": chef_persona,
                        "matchType": "Fastest",
                        "available": available_ingredients[:2] if available_ingredients else ["Bread"],
                        "missing": ["Any filler"],
                        "whyThis": f"Fallback UI invoked."
                    }
                ]
            }
