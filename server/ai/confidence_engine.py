"""
Confidence Engine Module.

Responsibility:
Determine the diagnostic confidence level (LOW, MEDIUM, or HIGH) and provide clear reasons.

How it works:
Input (Ranked faults, score difference, symptoms count, device details)
    ↓
Check simple factors:
  1. Score gap between #1 fault and #2 fault (large gap = higher confidence)
  2. Number of symptoms (more symptoms = higher confidence)
  3. Phone model specified? (+10 points)
  4. Similar past repairs in shop? (+10 points)
  5. Any conflicting symptoms? (-15 points)
    ↓
Determine Level:
  - Score >= 75: HIGH confidence
  - Score >= 50: MEDIUM confidence
  - Score < 50:  LOW confidence
    ↓
Output (Confidence level, score from 0-100, and explanation reasons)
"""

class ConfidenceEngine:
    def __init__(self):
        pass

    def evaluate(self, hypotheses, score_separation, symptoms, device_brand, device_model, historical_match_count=0, follow_up_answered_count=0):
        """
        Main function: Evaluates confidence level and builds human-readable explanations.
        
        Returns:
          Dictionary with 'level' (LOW|MEDIUM|HIGH), 'score' (0-100), and 'reasons'.
        """
        if not hypotheses:
            return {
                "level": "LOW",
                "score": 10,
                "score_separation": 0.0,
                "reasons": ["No hardware fault could be identified from the given symptoms."],
                "requires_followup": True
            }

        top_fault = hypotheses[0]
        reasons = []
        conf_score = 40  # Start with a base confidence of 40 points

        # 1. Check score separation between 1st place and 2nd place
        if len(hypotheses) > 1:
            second_fault = hypotheses[1]
            if score_separation >= 30.0:
                conf_score += 20
                reasons.append(f"Strong score lead clearly favors '{top_fault.name}'.")
            elif score_separation < 16.0:
                conf_score -= 15
                reasons.append(f"Close competition between '{top_fault.name}' and '{second_fault.name}'.")
            else:
                conf_score += 10
                reasons.append(f"Moderate score lead over secondary faults.")
        else:
            conf_score += 25
            reasons.append("Single definitive fault identified.")

        # 2. Check number of matching symptoms
        symptom_count = len(symptoms) if symptoms else 0
        if symptom_count >= 2:
            conf_score += 10
            reasons.append(f"Multiple observed symptoms ({symptom_count}) cross-verify this issue.")
        elif symptom_count == 1:
            reasons.append("Single symptom reported; additional inspection recommended.")

        # 3. Check if phone model was provided
        if device_model and len(device_model.strip()) > 1:
            conf_score += 10
            reasons.append(f"Specific device model '{device_model}' verified against hardware rules.")
        else:
            conf_score -= 10
            reasons.append("Device model not specified; diagnosis is based on generic smartphone design.")

        # 4. Check if shop has repaired this before
        if historical_match_count >= 3:
            conf_score += 10
            reasons.append(f"Corroborated by {historical_match_count} similar completed repairs in workshop history.")
        elif historical_match_count > 0:
            conf_score += 5
            reasons.append("Supported by previous repair cases in this workshop.")

        # 5. Penalize if there are conflicting symptoms
        conflicts = getattr(top_fault, "conflicting_evidence", [])
        if conflicts:
            conf_score -= 15
            reasons.append("Some symptoms conflict with this diagnosis.")

        # 6. Bonus if technician answered follow-up questions
        if follow_up_answered_count > 0:
            conf_score += 10
            reasons.append(f"Technician answered {follow_up_answered_count} follow-up inspection questions.")

        # Keep score inside reasonable limits (15% to 95%)
        final_score = int(max(15, min(95, conf_score)))

        # Convert numerical score into confidence level
        if final_score >= 75:
            level = "HIGH"
            requires_followup = False
        elif final_score >= 50:
            level = "MEDIUM"
            requires_followup = (score_separation < 16.0)
        else:
            level = "LOW"
            requires_followup = True

        return {
            "level": level,
            "score": final_score,
            "score_separation": round(score_separation, 1),
            "reasons": reasons,
            "requires_followup": requires_followup
        }
