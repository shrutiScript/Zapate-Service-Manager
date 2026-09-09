"""
Probability and Scoring Engine Module.

Responsibility:
Calculate a simple score for each possible fault and rank them from most likely to least likely.

How it works:
Input (Candidate faults, historical case summary, follow-up answers)
    ↓
For each fault:
  Start with Base Score
  + Add Symptom Score (points for matching symptoms)
  + Add Phone Model Bonus (specific architecture bonus)
  + Add History Bonus (+5 to +10 if shop has seen this repair before)
  + Add Follow-up Answer Bonus (from technician's test answers)
  - Deduct Penalties (for conflicting symptoms)
    ↓
Rank faults from highest score to lowest score
Calculate percentage: (Fault Score / Total Scores) * 100
    ↓
Output (Ranked faults, score difference between top two)
"""

class FaultHypothesis:
    """Simple container for a ranked fault hypothesis."""
    def __init__(
        self,
        id="",
        name="",
        category="",
        score=0.0,
        normalized_probability=0.0,
        supporting_evidence=None,
        conflicting_evidence=None,
        why_suggested="",
        confirmation_tests=None,
        recommended_parts=None,
        bench_steps=None,
        risk_level="LOW",
        est_bench_minutes_min=20,
        est_bench_minutes_max=45
    ):
        self.id = id
        self.name = name
        self.category = category
        self.score = score
        self.normalized_probability = normalized_probability
        self.supporting_evidence = supporting_evidence or []
        self.conflicting_evidence = conflicting_evidence or []
        self.why_suggested = why_suggested
        self.confirmation_tests = confirmation_tests or []
        self.recommended_parts = recommended_parts or []
        self.bench_steps = bench_steps or []
        self.risk_level = risk_level
        self.est_bench_minutes_min = est_bench_minutes_min
        self.est_bench_minutes_max = est_bench_minutes_max

    def to_dict(self):
        """Converts fault object into standard dictionary for JSON output."""
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "score": self.score,
            "diagnosticConfidenceScore": self.normalized_probability,
            "supportingEvidence": self.supporting_evidence,
            "conflictingEvidence": self.conflicting_evidence,
            "whySuggested": self.why_suggested,
            "confirmationTests": self.confirmation_tests,
            "recommendedParts": self.recommended_parts,
            "riskLevel": self.risk_level,
            "benchSteps": self.bench_steps,
            "estBenchMinutes": f"{self.est_bench_minutes_min} - {self.est_bench_minutes_max} min"
        }

    # Allow dictionary-style indexing: hyp["name"]
    def __getitem__(self, item):
        return getattr(self, item)


class ProbabilityEngine:
    def __init__(self):
        pass

    def rank_and_normalize(self, candidate_hypotheses, historical_matches_summary=None, follow_up_boosts=None):
        """
        Main function: Computes simple scores and ranks candidate faults.
        
        Returns:
          - ranked_hypotheses: List of FaultHypothesis objects, highest score first
          - score_diff: Score gap between 1st place and 2nd place
          - total_score_sum: Total sum of all scores
        """
        if not candidate_hypotheses:
            return [], 0.0, 0.0

        follow_up_boosts = follow_up_boosts or {}
        scored_list = []

        for cand in candidate_hypotheses:
            hyp_id = cand["id"]
            
            # 1. Base prior score (e.g. 0.20 * 20 = 4 points)
            prior_score = cand.get("prior_probability", 0.20) * 20.0
            
            # 2. Symptom score (points from matching symptoms)
            symptom_score = cand.get("symptom_score", 0.0)
            
            # 3. Device model bonus (e.g., iPhone Tristar +10, Samsung sub-board +10)
            device_score = cand.get("device_model_score", 0.0)
            
            # 4. History bonus: if past repairs in this shop matched this fault
            history_score = 0.0
            if historical_matches_summary and getattr(historical_matches_summary, "total_matches", 0) > 0:
                for past_case in getattr(historical_matches_summary, "cases", []):
                    notes = (past_case.get("diagnosis_notes") or "").lower()
                    if hyp_id.lower() in notes or cand["name"].lower() in notes or cand["category"].lower() in notes:
                        history_score = min(15.0, history_score + 5.0)

            # 5. Penalties for conflicting symptoms
            penalty_score = cand.get("penalty_score", 0.0)

            # 6. Follow-up test answers bonus / penalty
            fu_boost = follow_up_boosts.get(hyp_id, 0.0)
            if fu_boost > 0:
                cand["supporting_evidence"].append(f"Confirmed by follow-up inspection test (+{int(fu_boost)} pts)")
            elif fu_boost < 0:
                cand["conflicting_evidence"].append(f"Weakened by follow-up inspection test ({int(fu_boost)} pts)")

            # SIMPLE SCORING EQUATION:
            # Score = Base + Symptoms + Device Bonus + History Bonus + FollowUp - Penalty
            raw_score = (
                prior_score +
                symptom_score +
                device_score +
                history_score +
                fu_boost -
                penalty_score
            )

            # Ensure minimum score of 1.0 (no negative values)
            final_raw = max(1.0, raw_score)
            scored_list.append((final_raw, cand))

        # Rank faults: Highest score first
        scored_list.sort(key=lambda x: x[0], reverse=True)

        total_score_sum = sum(item[0] for item in scored_list)
        if total_score_sum <= 0:
            total_score_sum = 1.0

        # Calculate score difference between #1 and #2
        score_diff = 0.0
        if len(scored_list) > 1:
            score_diff = scored_list[0][0] - scored_list[1][0]
        elif len(scored_list) == 1:
            score_diff = scored_list[0][0]

        # Calculate percentage: (Score / Total) * 100
        ranked_hypotheses = []
        for score, cand in scored_list:
            percentage = round((score / total_score_sum) * 100.0, 1)

            hyp = FaultHypothesis(
                id=cand["id"],
                name=cand["name"],
                category=cand["category"],
                score=round(score, 1),
                normalized_probability=percentage,
                supporting_evidence=cand.get("supporting_evidence", []),
                conflicting_evidence=cand.get("conflicting_evidence", []),
                why_suggested=cand.get("why_suggested", ""),
                confirmation_tests=cand.get("confirmation_tests", []),
                recommended_parts=cand.get("recommended_parts", []),
                bench_steps=cand.get("bench_steps", []),
                risk_level=cand.get("risk_level", "LOW"),
                est_bench_minutes_min=cand.get("est_bench_minutes_min", 20),
                est_bench_minutes_max=cand.get("est_bench_minutes_max", 45)
            )
            ranked_hypotheses.append(hyp)

        return ranked_hypotheses, score_diff, total_score_sum
