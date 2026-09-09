"""
Case Retrieval Module (Case-Based Reasoning).

Responsibility:
Compare current device symptoms with previous successful repair cases in the shop database.
Uses past workshop experience to confirm and strengthen fault diagnoses.

How it works:
Input (Current device, symptoms, and shop repair history)
    ↓
1. Compare device model (e.g., iPhone 13 == iPhone 13)
2. Compare symptom keywords (e.g., 'screen black', 'battery drain')
3. Check if repair was successfully completed
4. Calculate simple similarity percentage (0% to 100%)
    ↓
Output (List of similar past repair cases without customer private data)
"""

import re

class CaseRetrievalEngine:
    def __init__(self):
        # Simple scoring weights (total = 1.0)
        self.weight_model = 0.30      # 30% for model match
        self.weight_symptom = 0.40    # 40% for symptom keyword match
        self.weight_category = 0.20   # 20% for fault category match
        self.weight_outcome = 0.10    # 10% for successful repair status

    def _get_words(self, text):
        """Helper to extract lowercase words from text."""
        return set(re.findall(r"\w+", (text or "").lower()))

    def calculate_similarity(self, current_brand, current_model, current_symptoms, candidate_categories, case):
        """
        Calculates a simple similarity score (0.0 to 1.0) between current problem and a past case.
        """
        score = 0.0

        # 1. Model match (30%)
        case_brand = (case.get("deviceBrand") or case.get("device", {}).get("brand") or "").lower()
        case_model = (case.get("deviceModel") or case.get("device", {}).get("model") or "").lower()
        curr_b = (current_brand or "").lower()
        curr_m = (current_model or "").lower()

        if curr_m and case_model and (curr_m in case_model or case_model in curr_m):
            score += self.weight_model
        elif curr_b and case_brand and curr_b == case_brand:
            score += self.weight_model * 0.5

        # 2. Symptom word match (40%)
        case_issue = (case.get("issue") or case.get("reported_symptoms") or "").lower()
        case_words = self._get_words(case_issue)

        curr_words = set()
        for sym in current_symptoms:
            curr_words.update(self._get_words(str(sym)))

        if curr_words and case_words:
            matched_words = curr_words & case_words
            all_words = curr_words | case_words
            symptom_ratio = len(matched_words) / float(len(all_words))
            score += self.weight_symptom * symptom_ratio

        # 3. Category match (20%)
        case_cat = (case.get("faultCategory") or case.get("category") or "").upper()
        if case_cat and case_cat in candidate_categories:
            score += self.weight_category

        # 4. Successful repair outcome (10%)
        status = (case.get("status") or "").lower()
        if any(s in status for s in ["completed", "delivered", "ready"]):
            score += self.weight_outcome
        else:
            score += self.weight_outcome * 0.4

        return round(score, 2)

    def retrieve(self, current_brand, current_model, normalized_symptom_codes, candidate_categories, historical_cases, min_similarity=0.25, top_k=5):
        """
        Main function: Finds similar past repairs for the shop.
        
        Returns:
          A summary object containing similar cases, match count, and common repairs.
        """
        if not historical_cases:
            return CaseSummary()

        cat_set = set(c.upper() for c in candidate_categories)
        matched_cases = []

        # Compare each past repair case with current issue
        for case in historical_cases:
            sim = self.calculate_similarity(
                current_brand,
                current_model,
                normalized_symptom_codes,
                cat_set,
                case
            )

            # Only keep cases that meet the similarity threshold
            if sim >= min_similarity:
                # Sanitize: Remove any customer names or private information
                clean_case = {
                    "repair_number": case.get("number") or f"CASE-{str(case.get('_id', '000'))[:6]}",
                    "device_model": case.get("device", {}).get("model") or case.get("deviceModel") or "Unknown",
                    "issue_summary": case.get("issue") or case.get("reported_symptoms") or "Repair issue",
                    "diagnosis_notes": case.get("diagnosisNotes") or case.get("repair_action") or "Standard component repair",
                    "status": case.get("status") or "Completed",
                    "similarity_percentage": int(sim * 100),
                    "similarity_score": sim,
                    "parts_used": [p.get("name") if isinstance(p, dict) else str(p) for p in case.get("parts", [])],
                    "total_amount": case.get("finalAmount") or case.get("estimatedAmount") or 0
                }
                matched_cases.append((sim, clean_case))

        # Sort by highest similarity score first
        matched_cases.sort(key=lambda x: x[0], reverse=True)
        top_cases = [item[1] for item in matched_cases[:top_k]]

        if not top_cases:
            return CaseSummary()

        # Calculate statistics from similar cases
        avg_sim = round(sum(c["similarity_score"] for c in top_cases) / len(top_cases), 2)
        
        # Count commonly used parts in these repairs
        parts_count = {}
        for c in top_cases:
            for part in c.get("parts_used", []):
                parts_count[part] = parts_count.get(part, 0) + 1
        common_parts = sorted(parts_count.keys(), key=lambda k: parts_count[k], reverse=True)[:4]

        # Common successful fix notes
        actions = []
        for c in top_cases:
            if c.get("diagnosis_notes"):
                actions.append({
                    "action": c["diagnosis_notes"][:90],
                    "count": 1,
                    "model": c["device_model"]
                })

        return CaseSummary(
            total_matches=len(top_cases),
            average_similarity=avg_sim,
            common_successful_repairs=actions[:3],
            average_bench_time_minutes=35,
            commonly_used_parts=common_parts,
            cases=top_cases
        )


class CaseSummary:
    """Simple summary container for retrieved historical repair cases."""
    def __init__(self, total_matches=0, average_similarity=0.0, common_successful_repairs=None, average_bench_time_minutes=0, commonly_used_parts=None, cases=None):
        self.total_matches = total_matches
        self.average_similarity = average_similarity
        self.common_successful_repairs = common_successful_repairs or []
        self.average_bench_time_minutes = average_bench_time_minutes
        self.commonly_used_parts = commonly_used_parts or []
        self.cases = cases or []

    def to_dict(self):
        return {
            "totalMatches": self.total_matches,
            "averageSimilarity": self.average_similarity,
            "commonSuccessfulRepairs": self.common_successful_repairs,
            "averageBenchTimeMinutes": self.average_bench_time_minutes,
            "commonlyUsedParts": self.commonly_used_parts,
            "cases": self.cases
        }
