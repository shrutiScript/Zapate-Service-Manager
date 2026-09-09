"""
Symptom Normalizer Module.

Responsibility:
Convert user-described symptoms (in English, Hindi, or Gujarati) into standard symptom codes.

How it works:
Input (User symptom text)
    ↓
1. Clean text and convert to lowercase
2. Check for negative phrases (e.g., 'no water', 'screen working')
3. Check keywords for each symptom rule
    ↓
Output (List of standard symptom dictionaries)
"""

import os
import re
import json

class SymptomNormalizer:
    def __init__(self, data_path=None):
        # Default path to the symptom rules JSON file
        if not data_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            data_path = os.path.join(base_dir, "ai_data", "symptom_rules.json")
        
        self.data_path = data_path
        self.taxonomy = {}
        self.negative_symptoms = {}
        self._load_rules()

    def _load_rules(self):
        """Loads symptom keywords and rules from the JSON file."""
        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.taxonomy = data.get("taxonomy", {})
                self.negative_symptoms = data.get("negative_symptoms", {})
        except Exception as e:
            print(f"[Warning] Could not load symptom rules: {e}")
            self.taxonomy = {}
            self.negative_symptoms = {}

    def normalize(self, raw_text, confirmed_symptoms=None):
        """
        Main function: Converts raw symptom text into standard symptom dictionaries.
        
        Returns:
          - normalized_symptoms: List of matched symptom dictionaries
          - negative_confirmations: Set of symptom codes explicitly negated (e.g., 'no water')
          - missing_info: Helpful notes if important details are missing
        """
        if not raw_text and not confirmed_symptoms:
            return [], set(), ["No symptom description provided."]

        # Step 1: Clean text to lowercase with spaces around punctuation
        cleaned = " " + re.sub(r"[^\w\s\u0A80-\u0AFF\u0900-\u097F]", " ", (raw_text or "").lower()) + " "

        extracted = {}
        negative_confirmations = set()
        missing_info = []

        # Step 2: Check for negative phrases (e.g., 'no water', 'display is working')
        # If the user says 'no water', we must not diagnose liquid damage
        for neg_key, neg_info in self.negative_symptoms.items():
            for phrase in neg_info.get("keywords", []):
                pattern = r"\b" + re.escape(phrase.lower()) + r"\b"
                if re.search(pattern, cleaned):
                    for contra_code in neg_info.get("contradicts", []):
                        negative_confirmations.add(contra_code)

        # Step 3: Match standard symptom keywords from taxonomy
        for code, details in self.taxonomy.items():
            # If the technician already confirmed this symptom via UI checklist
            if confirmed_symptoms and code in confirmed_symptoms:
                extracted[code] = {
                    "code": code,
                    "category": details.get("category", "GENERAL"),
                    "severity": details.get("severity", "MEDIUM"),
                    "description": details.get("description", ""),
                    "matched_phrase": "Confirmed by technician",
                    "confidence": 1.0,
                    "risk_flags": details.get("risk_flags", [])
                }
                continue

            # If user explicitly said this problem is NOT present, skip it
            if code in negative_confirmations:
                continue

            # Check if any keyword for this symptom appears in the text
            best_match = None
            for keyword in details.get("keywords", []):
                pattern = r"\b" + re.escape(keyword.lower()) + r"\b"
                if re.search(pattern, cleaned):
                    if not best_match or len(keyword) > len(best_match):
                        best_match = keyword

            # If a keyword matched, add to extracted symptoms
            if best_match:
                extracted[code] = {
                    "code": code,
                    "category": details.get("category", "GENERAL"),
                    "severity": details.get("severity", "MEDIUM"),
                    "description": details.get("description", ""),
                    "matched_phrase": best_match,
                    "confidence": 0.90,
                    "risk_flags": details.get("risk_flags", [])
                }

        # Step 4: Check if critical details are missing
        codes = set(extracted.keys())
        if "NO_POWER" in codes and "IMPACT_EVENT" not in codes and "LIQUID_EXPOSURE" not in codes:
            missing_info.append("Trigger event unknown: please check if phone was dropped or exposed to liquid.")
        
        if "CHARGING_FAILURE" in codes and "OVERHEATING" not in codes:
            missing_info.append("Thermal status unconfirmed: observe if device heats up when charging.")

        # Return the results as standard lists and sets
        return list(extracted.values()), negative_confirmations, missing_info
