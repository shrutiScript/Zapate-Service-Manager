"""
Rules Engine Module.

Responsibility:
Match extracted symptoms against expert repair rules to generate candidate faults.

How it works:
Input (Symptoms, Brand, Model)
    ↓
1. Loop through all known repair fault rules
2. Add points when symptoms match (+20 to +50 points)
3. Deduct points when symptoms conflict
4. Apply phone-specific rules (e.g., iPhone Tristar IC, Samsung Sub-board)
    ↓
Output (List of possible fault candidates with evidence)
"""

import os
import json

class RulesEngine:
    def __init__(self, data_path=None):
        # Default path to expert repair rules JSON
        if not data_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            data_path = os.path.join(base_dir, "ai_data", "fault_rules.json")
            
        self.data_path = data_path
        self.raw_rules = []
        self._load_rules()

    def _load_rules(self):
        """Loads expert fault rules from JSON file."""
        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.raw_rules = data.get("hypotheses", [])
        except Exception as e:
            print(f"[Warning] Could not load fault rules: {e}")
            self.raw_rules = []

    def evaluate(self, symptoms, negative_confirmations=None, device_brand="", device_model=""):
        """
        Main function: Evaluates symptoms against repair rules.
        
        Returns:
          A list of candidate fault dictionaries with scores and evidence.
        """
        negative_confirmations = negative_confirmations or set()
        brand_lower = (device_brand or "").lower()
        model_lower = (device_model or "").lower()

        # Create quick lookup set of present symptom codes
        symptom_map = {s["code"] if isinstance(s, dict) else s.code: s for s in symptoms}
        symptom_codes = set(symptom_map.keys())

        candidate_results = []

        for rule in self.raw_rules:
            hyp_id = rule["id"]
            hyp_name = rule["name"]
            category = rule["category"]
            prior_prob = rule.get("prior_probability", 0.20)
            
            supporting_evidence = []
            conflicting_evidence = []
            symptom_score = 0.0
            penalty_score = 0.0
            device_model_score = 0.0

            # 1. Check for supporting symptoms
            # If the user reported symptoms that support this fault, increase the score
            req_symptoms = rule.get("required_or_supporting_symptoms", {})
            matched_count = 0

            for s_code, weight in req_symptoms.items():
                if s_code in symptom_codes:
                    matched_count += 1
                    symptom_score += weight
                    supporting_evidence.append(
                        f"Detected symptom '{s_code}' matches {hyp_name} (+{weight} pts)"
                    )

            # Skip faults with zero matching symptoms unless it's a general power issue
            if matched_count == 0 and not (symptom_codes & {"NO_POWER", "OVERHEATING"}):
                continue

            # 2. Check for conflicting symptoms
            # If symptoms conflict with this fault, reduce the score
            conf_symptoms = rule.get("conflicting_symptoms", {})
            for c_code, penalty in conf_symptoms.items():
                if c_code in symptom_codes:
                    penalty_val = abs(penalty)
                    penalty_score += penalty_val
                    conflicting_evidence.append(
                        f"Symptom '{c_code}' conflicts with {hyp_name} (-{penalty_val} pts)"
                    )

            # 3. Check for technician negative confirmations
            for neg_code in negative_confirmations:
                if neg_code in req_symptoms:
                    penalty_score += 40.0
                    conflicting_evidence.append(
                        f"Technician verified absence of '{neg_code}' (-40 pts)"
                    )

            # 4. Device Architecture Rules (Specific Phone Knowledge)
            # Rule for Apple: Charging problems often relate to the Tristar/Hydra IC
            if ("iphone" in brand_lower or "apple" in brand_lower) and hyp_id == "CHARGING_IC_PMIC_CIRCUIT_FAULT":
                device_model_score += 10.0
                supporting_evidence.append("Apple architecture uses dedicated Tristar/Hydra charging IC (+10 pts)")

            # Rule for Samsung: Drop shock often damages the charging sub-board flex
            elif ("samsung" in brand_lower or "galaxy" in model_lower) and hyp_id == "CHARGING_PORT_SUB_BOARD_DAMAGE":
                device_model_score += 10.0
                supporting_evidence.append("Samsung Galaxy series uses sub-board flex vulnerable to drop impact (+10 pts)")

            # Rule for AMOLED displays: They do not have a separate backlight circuit
            if hyp_id == "DISPLAY_BACKLIGHT_CIRCUIT_BLOWN":
                is_amoled = any(name in model_lower for name in ["oled", "amoled", "pro max", "s20", "s21", "s22", "s23", "s24", "fold", "flip"])
                if is_amoled:
                    penalty_score += 35.0
                    conflicting_evidence.append("AMOLED screen does not have a separate backlight circuit (-35 pts)")

            # Explanation of why this fault is suggested
            if matched_count > 0:
                matched_names = [s for s in req_symptoms if s in symptom_codes]
                why_suggested = f"Matched {matched_count} symptom(s): {', '.join(matched_names)}"
            else:
                why_suggested = "Possible cause under unpowered device conditions"

            # Add this candidate fault
            candidate_results.append({
                "id": hyp_id,
                "name": hyp_name,
                "category": category,
                "prior_probability": prior_prob,
                "symptom_score": symptom_score,
                "penalty_score": penalty_score,
                "device_model_score": device_model_score,
                "supporting_evidence": supporting_evidence,
                "conflicting_evidence": conflicting_evidence,
                "why_suggested": why_suggested,
                "confirmation_tests": rule.get("confirmation_tests", []),
                "recommended_parts": rule.get("recommended_parts", []),
                "bench_steps": rule.get("bench_steps", []),
                "risk_level": rule.get("risk_level", "LOW"),
                "est_bench_minutes_min": rule.get("est_bench_minutes_min", 20),
                "est_bench_minutes_max": rule.get("est_bench_minutes_max", 45)
            })

        return candidate_results
