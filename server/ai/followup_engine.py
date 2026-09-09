"""
Follow-up Engine Module.

Responsibility:
Generate discriminating follow-up inspection questions when diagnostic confidence is LOW or MEDIUM.
Calculate score boosts when the technician answers these questions.

How it works:
Input (Ranked faults, already answered questions)
    ↓
1. Identify top 2 competing faults (e.g. Charging Port vs Charging IC)
2. Pick questions that differentiate between them
3. When technician answers, add or subtract points based on evidence
    ↓
Output (List of relevant follow-up questions or score boost dictionary)
"""

import os
import json

class FollowUpEngine:
    def __init__(self, data_path=None):
        if not data_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            data_path = os.path.join(base_dir, "ai_data", "followup_questions.json")
            
        self.data_path = data_path
        self.questions_bank = []
        self._load_questions()

    def _load_questions(self):
        """Loads follow-up questions from the JSON file."""
        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.questions_bank = data.get("questions", [])
        except Exception as e:
            print(f"[Warning] Could not load follow-up questions: {e}")
            self.questions_bank = []

    def select_questions(self, hypotheses, answered_question_ids=None, max_questions=2):
        """
        Selects questions that help decide between the top competing faults.
        """
        if not hypotheses or len(hypotheses) < 2:
            return []

        answered = answered_question_ids or {}
        # Get IDs of top 2 or 3 hypotheses
        top_ids = [getattr(h, "id", "") for h in hypotheses[:3]]
        top_pair = set(top_ids[:2])

        selected = []

        # 1. Search for questions specifically designed for the top 2 faults
        for q in self.questions_bank:
            q_id = q.get("id")
            if q_id in answered:
                continue

            diff_set = set(q.get("differentiates", []))
            if diff_set == top_pair:
                selected.append(q)
                if len(selected) >= max_questions:
                    return selected

        # 2. If we need more, find any question related to the top hypotheses
        for q in self.questions_bank:
            q_id = q.get("id")
            if q_id in answered or q in selected:
                continue

            diff_set = set(q.get("differentiates", []))
            if diff_set & set(top_ids):
                selected.append(q)
                if len(selected) >= max_questions:
                    return selected

        return selected

    def calculate_answer_boosts(self, follow_up_answers):
        """
        Calculates score bonuses or penalties based on the technician's answers.
        
        Returns:
          Dictionary of { fault_id: score_boost }
        """
        boosts = {}
        if not follow_up_answers:
            return boosts

        for q in self.questions_bank:
            q_id = q.get("id")
            if q_id in follow_up_answers:
                chosen_val = follow_up_answers[q_id]
                # Find the option matching the chosen answer
                for opt in q.get("options", []):
                    if opt.get("value") == chosen_val:
                        for hyp_id, boost_val in opt.get("evidence_boost", {}).items():
                            boosts[hyp_id] = boosts.get(hyp_id, 0.0) + float(boost_val)

        return boosts
