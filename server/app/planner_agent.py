import json
import logging
from typing import List, Dict
from datetime import datetime, timedelta
from .orchestrator import SwarmOrchestrator

logger = logging.getLogger(__name__)

class LongTermPlanner:
    """
    Handles Advanced Monthly Meal Planning and Smart Staggered Shopping Lists.
    Parses current pantry vs missing items, and routes them to chronological shopping trips
    based on inferred perishability rules.
    """
    def __init__(self):
        self.orchestrator = SwarmOrchestrator()
        
        # Hardcoded perishability logic referencing the local SQLite equivalents 
        # (High-Risk/Fresh vs Stable vs Bulk)
        self.highly_perishable = ["raw meat", "chicken", "fish", "spinach", "lettuce", "fresh berries", "milk", "bread"]
        self.semi_perishable = ["eggs", "cheese", "apples", "oranges", "butter", "carrot"]
        # All else defaults to stable bulk

    async def generate_monthly_plan(self, current_inventory: List[str], dietary_prefs: List[str], weeks: int = 4) -> Dict:
        """
        Takes the user's digitized fridge list (from Vision/Camera scan) and
        returns a full X-week meal plan AND a partitioned shopping cart.
        """
        system_prompt = f"""
        You are the GS FOOD Monthly Kitchen Planner.
        The user wants a {weeks}-week meal plan. 
        Current Inventory: {', '.join(current_inventory) if current_inventory else 'Empty Fridge.'}
        Preferences: {', '.join(dietary_prefs) if dietary_prefs else 'None.'}
        
        Generate a JSON output EXCLUSIVELY.
        {{
           "meals_per_week": {{
              "week_1": ["List of 7 dish names leveraging primarily what they have NOW"],
              "week_2": ["List of 7 dish names requiring Trip 2"],
              "week_3": ["List of 7 dish names"],
              "week_4": ["List of 7 dish names"]
           }},
           "total_missing_ingredients": ["list of EVERYTHING needed over the 4 weeks"]
        }}
        """
        
        user_prompt = "Generate the 4-week unified meal plan and identify total missing ingredients."
        
        try:
            raw_response = await self.orchestrator.execute_cascade(system_prompt, user_prompt)
            payload = json.loads(self._clean_json(raw_response))
            
            missing_items = payload.get("total_missing_ingredients", [])
            
            # Smart Orchestration: Partition the shopping cart by perishability velocity
            shopping_trips = self._stagger_shopping_cart(missing_items, weeks)
            
            return {
                "status": "APPROVED",
                "shopping_trips": shopping_trips,
                "meal_plan": payload.get("meals_per_week", {})
            }
            
        except Exception as e:
            logger.error(f"Monthly Planner Failed: {e}")
            return self._fallback_plan(weeks)
            
    def _stagger_shopping_cart(self, missing_items: List[str], weeks: int) -> Dict:
        """
        Divides the shopping cart into logical trips over the month.
        """
        trips = {
            "trip_1_immediate_fresh_re_stock": [],
            "trip_2_mid_month_perishables": [],
            "trip_3_bulk_stable_goods": []
        }
        
        for item in missing_items:
            lower_item = str(item).lower()
            
            is_high = any(hp in lower_item for hp in self.highly_perishable)
            is_semi = any(sp in lower_item for sp in self.semi_perishable)
            
            if is_high:
                # Need fresh meat and greens immediately for Week 1
                trips["trip_1_immediate_fresh_re_stock"].append(item)
            elif is_semi:
                # Eggs and cheese can wait slightly longer
                trips["trip_2_mid_month_perishables"].append(item)
            else:
                # Rice, Cans, Frozen go to bulk shopping
                trips["trip_3_bulk_stable_goods"].append(item)
                
        return trips

    def _clean_json(self, raw: str) -> str:
        if raw.startswith("```json"):
            return raw[7:-3]
        if raw.startswith("```"):
            return raw[3:-3]
        return raw.strip()

    def _fallback_plan(self, weeks: int) -> Dict:
        return {
            "status": "FALLBACK - LLM ERROR",
            "shopping_trips": {
                "trip_1_immediate_fresh": ["Chicken", "Spinach"],
                "trip_3_bulk": ["Rice", "Beans"]
            },
            "meal_plan": {
                "week_1": ["Chicken and Rice", "Spinach Salad"]
            }
        }
