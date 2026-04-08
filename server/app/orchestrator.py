import os
import aiohttp
import json
import logging
import asyncio

logger = logging.getLogger(__name__)

class CascadeException(Exception):
    pass

class SwarmOrchestrator:
    """
    Python implementation of the NOOR Free-Tier Cascade logic.
    Attempts multiple providers (Groq -> OpenRouter) sequentially.
    """
    def __init__(self):
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.or_key = os.getenv("OPENROUTER_API_KEY")

        self.tiers = []
        if self.groq_key:
            self.tiers.append({
                "name": "Groq",
                "url": "https://api.groq.com/openai/v1/chat/completions",
                "key": self.groq_key,
                "model": "llama-3.1-8b-instant"
            })
        if self.or_key:
            self.tiers.append({
                "name": "OpenRouter",
                "url": "https://openrouter.ai/api/v1/chat/completions",
                "key": self.or_key,
                "model": "open-chat/openchat-7b:free"
            })

    async def execute_cascade(self, system_prompt: str, user_prompt: str) -> str:
        """
        Executes a prompt through the defined tiers.
        If no API keys are present or all tiers fail, falls back to the deterministic mock,
        which returns exactly the structural JSON expected by the GS FOOD NOOR UI.
        """
        for tier in self.tiers:
            try:
                response = await self._call_provider(tier, system_prompt, user_prompt)
                if response:
                    return response
            except Exception as e:
                logger.warning(f"Tier {tier['name']} failed: {e}")
                continue # Exponential fallback / cascade to next tier

        # FALLBACK: If cascade exhausted or no keys present
        return self._get_fallback_mock_data(user_prompt)

    async def _call_provider(self, tier: dict, system_prompt: str, user_prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {tier['key']}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": tier["model"],
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"} if tier["name"] == "Groq" else None
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(tier["url"], headers=headers, json=payload, timeout=10) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data["choices"][0]["message"]["content"]
                elif resp.status == 429: # Rate limit
                    raise CascadeException(f"429 Too Many Requests on {tier['name']}")
                else:
                    raise CascadeException(f"API Error {resp.status} on {tier['name']}")

    def _get_fallback_mock_data(self, user_prompt: str) -> str:
        """
        Deterministic NOOR-style structural JSON output perfectly aligned to Flutter's MealCard.
        """
        return json.dumps({
            "cards": [
                {
                    "title": "Mediterranean Spinach Skillet",
                    "time": "15 min",
                    "cuisine": "Mediterranean",
                    "matchType": "Best Match",
                    "available": ["Spinach", "Eggs"],
                    "missing": ["Feta Cheese"],
                    "whyThis": "Matches your prompt directly and fits a high-protein diet."
                },
                {
                    "title": "Egg Rescue Bowl",
                    "time": "10 min",
                    "cuisine": "Fast Family",
                    "matchType": "Save Food",
                    "available": ["Eggs"],
                    "missing": [],
                    "whyThis": "Rescues your eggs before expiry tomorrow."
                }
            ]
        })
