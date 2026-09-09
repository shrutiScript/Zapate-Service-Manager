"""
Knowledge Retrieval Module.

Responsibility:
Return hardware confirmation tests, step-by-step repair guidance, safety alerts, and post-repair quality checklists.

How it works:
Input (Top fault, device brand/model, symptom codes)
    ↓
1. Lookup multimeter / bench testing procedures
2. Lookup manufacturer repair bulletins
3. Generate critical safety warnings (swollen battery, water damage, overheating)
4. Generate post-repair quality checklist
    ↓
Output (Lists of tests, guidance, warnings, checklist)
"""

import os
import json

class KnowledgeRetrievalEngine:
    def __init__(self, procedures_path=None, knowledge_path=None):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.procedures_path = procedures_path or os.path.join(base_dir, "ai_data", "test_procedures.json")
        self.knowledge_path = knowledge_path or os.path.join(base_dir, "ai_data", "curated_knowledge.json")
        
        self.test_procedures = {}
        self.knowledge_entries = []
        self._load_data()

    def _load_data(self):
        """Loads test procedures and curated repair bulletins from JSON."""
        try:
            with open(self.procedures_path, "r", encoding="utf-8") as f:
                self.test_procedures = json.load(f).get("test_procedures", {})
        except Exception as e:
            print(f"[Warning] Could not load test procedures: {e}")
            self.test_procedures = {}

        try:
            with open(self.knowledge_path, "r", encoding="utf-8") as f:
                self.knowledge_entries = json.load(f).get("knowledge_entries", [])
        except Exception as e:
            print(f"[Warning] Could not load curated knowledge: {e}")
            self.knowledge_entries = []

    def get_confirmation_tests(self, test_keys):
        """
        Retrieves bench confirmation test details (tools needed, procedure, expected readings).
        """
        tests = []
        for key in test_keys:
            if key in self.test_procedures:
                t = self.test_procedures[key]
                tests.append({
                    "test_id": key,
                    "name": t.get("name", key),
                    "tool_required": t.get("tool_required", "Multimeter / Bench Tool"),
                    "category": t.get("category", "BENCH_TEST"),
                    "procedure": t.get("procedure", ""),
                    "expected_reading": t.get("expected_reading", ""),
                    "fail_condition": t.get("fail_condition", ""),
                    "bench_time_minutes": t.get("bench_time_minutes", 5)
                })
        return tests

    def get_repair_guidance(self, device_brand, device_model, top_hypothesis):
        """
        Retrieves matching curated repair tips and bulletins for the device brand and fault.
        """
        guidance = []
        brand_lower = (device_brand or "").lower()
        top_cat = getattr(top_hypothesis, "category", "").upper() if top_hypothesis else ""

        for entry in self.knowledge_entries:
            e_brand = entry.get("device_brand", "").lower()
            e_cat = entry.get("category", "").upper()

            is_brand_match = (e_brand == "all" or e_brand in brand_lower or brand_lower in e_brand)
            is_cat_match = (e_cat == top_cat or e_cat == "ALL")

            if is_brand_match and is_cat_match:
                guidance.append({
                    "title": entry.get("title"),
                    "summary": entry.get("summary"),
                    "critical_checks": entry.get("critical_checks", []),
                    "source_metadata": {
                        "source_name": entry.get("source_name", "Workshop Knowledge Base"),
                        "source_type": entry.get("source_type", "General repair guide"),
                        "last_verified": entry.get("last_verified", "2026-01-01"),
                    }
                })

        return guidance

    def generate_safety_warnings(self, symptom_codes, top_hypothesis):
        """
        Generates mandatory safety warnings for high-risk hazards:
        1. Swollen battery (fire / thermal runaway danger)
        2. Water contact (corrosion short-circuit hazard)
        3. Overheating (board-level short circuit)
        """
        warnings = []
        top_id = getattr(top_hypothesis, "id", "") if top_hypothesis else ""

        # Hazard 1: Swollen battery
        if "BATTERY_SWOLLEN" in symptom_codes or "SWELLING" in top_id:
            warnings.append({
                "severity": "CRITICAL",
                "title": "Swollen Lithium-Ion Battery - Fire Hazard",
                "message": "Do not puncture, bend, or heat above 60°C. Never use metallic tools near the battery pouch.",
                "action_required": "Safely disconnect and isolate in a fireproof container immediately."
            })

        # Hazard 2: Water damage
        if "LIQUID_EXPOSURE" in symptom_codes or "LIQUID" in top_id:
            warnings.append({
                "severity": "DANGER",
                "title": "Liquid Corrosion Hazard",
                "message": "Do not plug in a charger or power on before completing ultrasonic cleaning and board drying.",
                "action_required": "Disconnect battery terminal first. Ultrasonic isopropyl alcohol bath required."
            })

        # Hazard 3: Board overheating / short circuit
        if "OVERHEATING" in symptom_codes or "SHORT_CIRCUIT" in top_id:
            warnings.append({
                "severity": "CAUTION",
                "title": "Board-Level Short Circuit",
                "message": "Inject voltage gradually with DC power supply current limit set to 1.5A.",
                "action_required": "Use thermal camera or rosin smoke to identify the hot shorted component."
            })

        return warnings

    def get_post_repair_checklist(self, top_hypothesis):
        """
        Generates standard 5-point quality checks to complete before handing the device to the customer.
        """
        top_cat = getattr(top_hypothesis, "category", "") if top_hypothesis else ""

        # Checklist for Screen / Display repairs
        if "DISPLAY" in top_cat:
            return [
                "Test multi-touch digitizer across the entire screen area",
                "Check auto-brightness and ambient light sensor",
                "Test earpiece speaker and proximity sensor during a test call",
                "Inspect screen frame adhesive for any backlight bleeding",
                "Verify touch responsiveness after sleep and wake cycle"
            ]

        # Checklist for Charging / Battery repairs
        elif "CHARGING" in top_cat or "POWER" in top_cat:
            return [
                "Charge battery by at least 15% to verify percentage increases steadily",
                "Connect to a computer to test USB data transfer",
                "Check fast charging protocol detection (QC/PD 9V/12V)",
                "Monitor device temperature during 15 minutes of continuous charging (< 38°C)",
                "Restart device to verify battery percentage does not suddenly drop"
            ]

        # Default general checklist
        return [
            "Verify device boots up completely to home screen without restarting",
            "Check charging current draw with USB ammeter (stable 1.0A - 2.0A)",
            "Test front & rear cameras, microphone, and speakers",
            "Verify WiFi and Cellular SIM connection with a test call",
            "Clean exterior with anti-static wipe and inspect case fit"
        ]
