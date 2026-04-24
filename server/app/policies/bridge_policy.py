from app.contracts.request_envelope import BudgetPolicy

class BridgePolicyEngine:
    @staticmethod
    def compute_budget_for_user(user_tier: str) -> BudgetPolicy:
        """
        Computes the target budget policy based on user's subscription tier.
        This dictates which provider the Free AI engine will select.
        """
        if user_tier == "premium":
            return BudgetPolicy(max_cost_tier="standard", latency_class="deep", repair_budget=3)
        elif user_tier == "registered":
            return BudgetPolicy(max_cost_tier="low", latency_class="balanced", repair_budget=1)
        else:
            return BudgetPolicy(max_cost_tier="free", latency_class="fast", repair_budget=0)
