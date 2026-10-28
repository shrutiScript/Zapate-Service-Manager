"""
Zapate AI Diagnostic Copilot — Adaptive Diagnostic Test Planner with What-if Simulation.

Module: diagnostic_test_planner.py
Responsibility:
1. Adaptive Diagnostic Test Planner: Selects optimal next test based on hypothesis separation,
   safety, prerequisites, equipment, and bench effort.
2. Test Result Evidence Update: Updates fault scores and evidence based on actual technician test results.
3. What-if Diagnostic Simulator: Simulates hypothetical test outcomes without modifying actual state.
4. Explainable Diagnostic Journey: Generates a step-by-step traceable diagnostic journey timeline.
5. Knowledge Gap Detection: Flags unresolvable ambiguities, rule gaps, or contradictory evidence.
"""

import os
import json
import copy
from datetime import datetime

def _get_obj_field(obj, *keys, default=None):
    if obj is None:
        return default
    if isinstance(obj, dict):
        for k in keys:
            if k in obj and obj[k] is not None:
                return obj[k]
        return default
    for k in keys:
        if hasattr(obj, k):
            val = getattr(obj, k)
            if val is not None:
                return val
    try:
        for k in keys:
            val = obj[k]
            if val is not None:
                return val
    except Exception:
        pass
    return default

class DiagnosticTestPlanner:
    def __init__(self, procedures_path=None, rules_path=None):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.procedures_path = procedures_path or os.path.join(base_dir, "ai_data", "test_procedures.json")
        self.rules_path = rules_path or os.path.join(base_dir, "ai_data", "fault_rules.json")

        self.test_procedures = {}
        self.fault_rules = {}
        self._load_data()

    def _load_data(self):
        """Loads test procedures and fault rules."""
        try:
            with open(self.procedures_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.test_procedures = data.get("test_procedures", {})
        except Exception as e:
            print(f"[Warning] Could not load test procedures: {e}")
            self.test_procedures = {}

        try:
            with open(self.rules_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for h in data.get("hypotheses", []):
                    self.fault_rules[h["id"]] = h
        except Exception as e:
            print(f"[Warning] Could not load fault rules: {e}")
            self.fault_rules = {}

    # =========================================================================
    # FEATURE 1: ADAPTIVE DIAGNOSTIC TEST PLANNER
    # =========================================================================

    def select_next_test(
        self,
        ranked_hypotheses,
        symptoms=None,
        completed_tests=None,
        device_brand="",
        device_model="",
        confidence_result=None
    ):
        """
        Deterministic, explainable test selection algorithm.
        Considers:
          1. Current competing fault hypotheses (top 2-3 hypotheses).
          2. Ability of each test to distinguish between hypotheses.
          3. Test applicability to device (AMOLED vs LCD, Apple vs Android).
          4. Safety prerequisites and risks (swollen battery, high voltage).
          5. Bench effort and cost (prefer fast non-invasive tests first).
          6. Tests already completed.
        """
        symptoms = symptoms or []
        completed_tests = completed_tests or []
        completed_test_ids = {t.get("test_id") or t.get("testId") for t in completed_tests if t.get("test_id") or t.get("testId")}

        if not ranked_hypotheses:
            return {
                "recommendedTest": None,
                "selectionReason": "No candidate fault hypotheses available to evaluate.",
                "competingHypothesesAddressed": [],
                "alternativeTests": [],
                "isHeuristic": True,
                "status": "NO_HYPOTHESES"
            }

        # Identify top competing hypotheses (top 2 or top 3 if close)
        top_hyp = ranked_hypotheses[0]
        competing = [top_hyp]
        if len(ranked_hypotheses) > 1:
            second_hyp = ranked_hypotheses[1]
            competing.append(second_hyp)
            # If 3rd is close to 2nd, include it
            if len(ranked_hypotheses) > 2:
                third_hyp = ranked_hypotheses[2]
                top_score = _get_obj_field(top_hyp, "score", default=0.0)
                third_score = _get_obj_field(third_hyp, "score", default=0.0)
                if (top_score - third_score) < 25.0:
                    competing.append(third_hyp)

        competing_ids = [_get_obj_field(h, "id", default="") for h in competing]
        competing_names = [_get_obj_field(h, "name", default="") for h in competing]

        # Extract symptom codes
        symptom_codes = set()
        for s in symptoms:
            if isinstance(s, dict):
                symptom_codes.add(s.get("code", ""))
            else:
                symptom_codes.add(getattr(s, "code", ""))

        brand_lower = (device_brand or "").lower()
        model_lower = (device_model or "").lower()
        is_amoled = any(kw in model_lower for kw in ["oled", "amoled", "pro max", "s20", "s21", "s22", "s23", "s24", "fold", "flip"])

        candidate_scored = []

        for test_id, test_def in self.test_procedures.items():
            # 1. Skip already completed tests
            if test_id in completed_test_ids:
                continue

            # 2. Check device applicability
            applicable_models = test_def.get("applicable_device_models", ["ALL"])
            if "LCD_DEVICES_ONLY" in applicable_models and is_amoled:
                # Do not recommend LCD backlight tests for AMOLED devices
                continue

            # 3. Check safety constraints
            # If swollen battery detected, safety inspection MUST come before any power injection
            if "BATTERY_SWOLLEN" in symptom_codes:
                if test_id != "TEST_PHYSICAL_BATTERY_DIMENSION_CHECK" and "TEST_PHYSICAL_BATTERY_DIMENSION_CHECK" not in completed_test_ids:
                    # Swollen battery requires physical safety dimension inspection first
                    continue

            # 4. Calculate Hypothesis Separation Utility (U_sep)
            applicable_hyps = set(test_def.get("applicable_hypotheses", []))
            outcome_impact = test_def.get("outcome_impact", {})
            pass_impact = outcome_impact.get("PASS", {})
            fail_impact = outcome_impact.get("FAIL", {})

            pass_supports = set(pass_impact.get("supports", []))
            pass_weakens = set(pass_impact.get("weakens", []))
            fail_supports = set(fail_impact.get("supports", []))
            fail_weakens = set(fail_impact.get("weakens", []))

            separation_score = 0.0
            reasons = []

            # Check if this test directly distinguishes between top 2 competing hypotheses
            if len(competing_ids) >= 2:
                h1 = competing_ids[0]
                h2 = competing_ids[1]

                # Condition A: Opposite effects on H1 and H2
                if (h1 in pass_supports and h2 in pass_weakens) or (h1 in pass_weakens and h2 in pass_supports):
                    separation_score += 60.0
                    reasons.append(f"Directly separates top fault '{competing_names[0]}' from competing fault '{competing_names[1]}'")
                elif (h1 in fail_supports and h2 in fail_weakens) or (h1 in fail_weakens and h2 in fail_supports):
                    separation_score += 60.0
                    reasons.append(f"Directly separates top fault '{competing_names[0]}' from competing fault '{competing_names[1]}' under failure condition")
                elif h1 in applicable_hyps and h2 in applicable_hyps:
                    separation_score += 35.0
                    reasons.append(f"Applies to both leading hypotheses ('{competing_names[0]}' and '{competing_names[1]}')")
                elif h1 in applicable_hyps:
                    separation_score += 25.0
                    reasons.append(f"Direct confirmation test for leading hypothesis '{competing_names[0]}'")
                elif h2 in applicable_hyps:
                    separation_score += 20.0
                    reasons.append(f"Tests secondary hypothesis '{competing_names[1]}'")
            else:
                if competing_ids[0] in applicable_hyps:
                    separation_score += 40.0
                    reasons.append(f"Confirmatory procedure for '{competing_names[0]}'")

            # 5. Check if test is an explicit confirmation test of the top hypothesis
            top_confirmations = _get_obj_field(top_hyp, "confirmation_tests", "confirmationTests", default=[])
            if test_id in top_confirmations:
                separation_score += 20.0
                reasons.append("Listed as standard confirmation procedure in knowledge-base fault rules")

            # 6. Bench Effort / Time Efficiency Bonus
            bench_time = test_def.get("bench_time_minutes", 10)
            # Prefer fast non-invasive tests (2-5 min) before long/invasive (45 min)
            time_score = max(0.0, 20.0 - (bench_time * 0.35))

            # 7. Prerequisites & Non-invasiveness Bonus
            category = test_def.get("category", "")
            prereq_score = 0.0
            if category in ["ELECTRICAL_INSPECTION", "PHYSICAL_INSPECTION", "OPTICAL_TEST", "SAFETY_INSPECTION"]:
                prereq_score += 15.0  # Non-destructive external inspection first
            elif category in ["CONTINUITY_TEST", "DIODE_MODE_TEST", "BATTERY_TEST"]:
                prereq_score += 10.0  # Moderate disassembly
            elif category in ["THERMAL_LOCALIZATION", "CHEMICAL_RESTO", "BGA_INTERMITTENT_TEST"]:
                prereq_score += 2.0   # Invasive board-level / chemical work

            total_utility = separation_score + time_score + prereq_score

            if separation_score > 0:
                explanation = "; ".join(reasons)
                candidate_scored.append({
                    "testId": test_id,
                    "test": self._format_test_def(test_id, test_def),
                    "totalUtility": round(total_utility, 1),
                    "separationScore": round(separation_score, 1),
                    "benchTimeMinutes": bench_time,
                    "explanation": explanation,
                    "competingAddressed": [cid for cid in competing_ids if cid in applicable_hyps]
                })

        # Sort candidate tests by highest utility first
        candidate_scored.sort(key=lambda x: x["totalUtility"], reverse=True)

        if not candidate_scored:
            return {
                "recommendedTest": None,
                "selectionReason": "All standardized non-destructive bench tests for these hypotheses have been executed. Physical tear-down, component-level micro-soldering, or verified senior technician review is required.",
                "competingHypothesesAddressed": competing_names,
                "alternativeTests": [],
                "isHeuristic": True,
                "status": "TESTS_EXHAUSTED"
            }

        best = candidate_scored[0]
        alternatives = [c["test"] for c in candidate_scored[1:4]]

        # Construct explainable selection reason
        selection_reason = (
            f"Recommended because it {best['explanation']}. "
            f"Can be completed in approximately {best['benchTimeMinutes']} minutes bench time "
            f"using {best['test']['toolRequired']}, providing rapid deterministic evidence before invasive rework."
        )

        return {
            "recommendedTest": best["test"],
            "selectionReason": selection_reason,
            "competingHypothesesAddressed": competing_names,
            "alternativeTests": alternatives,
            "totalCandidatesEvaluated": len(candidate_scored),
            "isHeuristic": True,
            "status": "RECOMMENDED"
        }

    def _format_test_def(self, test_id, test_def):
        """Formats raw test definition into clean API dictionary."""
        return {
            "testId": test_id,
            "name": test_def.get("name", test_id),
            "toolRequired": test_def.get("tool_required", "Multimeter / Bench Tool"),
            "category": test_def.get("category", "BENCH_TEST"),
            "purpose": test_def.get("purpose", ""),
            "procedure": test_def.get("procedure", ""),
            "expectedReading": test_def.get("expected_reading", ""),
            "failCondition": test_def.get("fail_condition", ""),
            "benchTimeMinutes": test_def.get("bench_time_minutes", 5),
            "prerequisites": test_def.get("prerequisites", []),
            "safetyPrecautions": test_def.get("safety_precautions", []),
            "possibleOutcomes": test_def.get("possible_outcomes", ["PASS", "FAIL", "INCONCLUSIVE", "NOT_PERFORMED"]),
            "expectedObservations": test_def.get("expected_observations", {}),
            "ruleReference": test_def.get("rule_reference", "")
        }

    # =========================================================================
    # FEATURE 2: TEST RESULT EVIDENCE UPDATE
    # =========================================================================

    def apply_test_evidence(self, candidate_evaluations, test_results):
        """
        Updates hypothesis scores and evidence using actual recorded test results.
        Enforces idempotency: identical test submissions are counted only once.
        Supports: PASS, FAIL, OBSERVED_VALUE, INCONCLUSIVE, NOT_PERFORMED.
        """
        if not candidate_evaluations or not test_results:
            return candidate_evaluations, []

        processed_test_ids = set()
        applied_evidence_trace = []

        # Map candidate evaluations by ID for quick lookup
        hyp_map = {c["id"]: c for c in candidate_evaluations}

        for tr in test_results:
            test_id = tr.get("test_id") or tr.get("testId")
            result = (tr.get("result") or "").upper().strip()
            observed_value = tr.get("observed_value") or tr.get("observedValue") or ""

            if not test_id or test_id in processed_test_ids:
                continue

            test_def = self.test_procedures.get(test_id)
            if not test_def:
                continue

            test_name = test_def.get("name", test_id)
            processed_test_ids.add(test_id)

            # Handle Inconclusive or Not Performed: Neutral, no score modification
            if result in ["INCONCLUSIVE", "NOT_PERFORMED"]:
                applied_evidence_trace.append({
                    "testId": test_id,
                    "testName": test_name,
                    "result": result,
                    "observedValue": observed_value,
                    "scoreDelta": 0,
                    "note": f"Test '{test_name}' marked {result}. No fault scores were modified."
                })
                continue

            # Resolve OBSERVED_VALUE to PASS or FAIL where applicable
            resolved_result = result
            if result == "OBSERVED_VALUE":
                # Compare against fail_condition if numeric or keyword match
                fail_condition = (test_def.get("fail_condition") or "").lower()
                obs_lower = str(observed_value).lower().strip()
                if any(k in obs_lower for k in ["0.00", "0.0", "short", "collapse", "ol", "infinite", "error", "fail"]):
                    resolved_result = "FAIL"
                else:
                    resolved_result = "PASS"

            outcome_impact = test_def.get("outcome_impact", {})
            impact = outcome_impact.get(resolved_result, {})

            supports = impact.get("supports", [])
            weakens = impact.get("weakens", [])
            base_delta = impact.get("score_delta", 25.0)

            # Apply positive evidence boost to supported hypotheses
            for s_id in supports:
                if s_id in hyp_map:
                    target = hyp_map[s_id]
                    boost = base_delta
                    target["symptom_score"] = target.get("symptom_score", 0.0) + boost
                    obs_detail = f" (Observed: {observed_value})" if observed_value else ""
                    target.setdefault("supporting_evidence", []).append(
                        f"Actual bench test '{test_name}' -> {resolved_result}{obs_detail}: confirms fault model (+{int(boost)} pts)"
                    )

            # Apply penalty to weakened hypotheses
            for w_id in weakens:
                if w_id in hyp_map:
                    target = hyp_map[w_id]
                    penalty = base_delta
                    target["penalty_score"] = target.get("penalty_score", 0.0) + penalty
                    obs_detail = f" (Observed: {observed_value})" if observed_value else ""
                    target.setdefault("conflicting_evidence", []).append(
                        f"Actual bench test '{test_name}' -> {resolved_result}{obs_detail}: contradicts fault model (-{int(penalty)} pts)"
                    )

            applied_evidence_trace.append({
                "testId": test_id,
                "testName": test_name,
                "result": result,
                "resolvedResult": resolved_result,
                "observedValue": observed_value,
                "supported": supports,
                "weakened": weakens,
                "scoreDelta": base_delta
            })

        return candidate_evaluations, applied_evidence_trace

    # =========================================================================
    # FEATURE 3: WHAT-IF DIAGNOSTIC SIMULATOR
    # =========================================================================

    def simulate_what_if(
        self,
        test_id,
        hypothetical_outcome,
        observed_value="",
        current_hypotheses=None,
        prob_engine=None,
        completed_tests=None,
        device_brand="",
        device_model=""
    ):
        """
        Runs non-persistent hypothetical simulation of a diagnostic test outcome.
        Never modifies actual session, repair job, or database records.
        """
        hypothetical_outcome = (hypothetical_outcome or "PASS").upper().strip()
        test_def = self.test_procedures.get(test_id)

        if not test_def:
            return {
                "status": "error",
                "message": f"Test ID '{test_id}' is not recognized in the knowledge base.",
                "isHypothetical": True
            }

        allowed_outcomes = test_def.get("possible_outcomes", ["PASS", "FAIL", "INCONCLUSIVE", "NOT_PERFORMED"])
        if hypothetical_outcome not in allowed_outcomes and hypothetical_outcome != "OBSERVED_VALUE":
            return {
                "status": "error",
                "message": f"Outcome '{hypothetical_outcome}' is not valid for test '{test_id}'. Valid outcomes: {allowed_outcomes}",
                "isHypothetical": True
            }

        # Build baseline ranking snapshot
        current_hypotheses = current_hypotheses or []
        baseline_rankings = []
        for idx, h in enumerate(current_hypotheses):
            h_id = _get_obj_field(h, "id", default="")
            h_name = _get_obj_field(h, "name", default="")
            h_prob = _get_obj_field(h, "normalized_probability", "diagnosticConfidenceScore", default=0.0)
            baseline_rankings.append({
                "id": h_id,
                "name": h_name,
                "rank": idx + 1,
                "probability": h_prob
            })

        # Deep-copy candidate hypotheses for pure simulation
        simulated_candidates = []
        for h in current_hypotheses:
            simulated_candidates.append({
                "id": _get_obj_field(h, "id", default=""),
                "name": _get_obj_field(h, "name", default=""),
                "category": _get_obj_field(h, "category", default="GENERAL"),
                "prior_probability": 0.20,
                "symptom_score": _get_obj_field(h, "score", default=0.0),
                "penalty_score": 0.0,
                "device_model_score": 0.0,
                "supporting_evidence": copy.deepcopy(_get_obj_field(h, "supporting_evidence", "supportingEvidence", default=[])),
                "conflicting_evidence": copy.deepcopy(_get_obj_field(h, "conflicting_evidence", "conflictingEvidence", default=[])),
                "why_suggested": _get_obj_field(h, "why_suggested", "whySuggested", default=""),
                "confirmation_tests": _get_obj_field(h, "confirmation_tests", "confirmationTests", default=[]),
                "recommended_parts": _get_obj_field(h, "recommended_parts", "recommendedParts", default=[]),
                "bench_steps": _get_obj_field(h, "bench_steps", "benchSteps", default=[]),
                "risk_level": _get_obj_field(h, "risk_level", "riskLevel", default="LOW"),
                "est_bench_minutes_min": 20,
                "est_bench_minutes_max": 45
            })

        # Create hypothetical test result record
        hypothetical_result = [{
            "test_id": test_id,
            "result": hypothetical_outcome,
            "observed_value": observed_value
        }]

        # Apply hypothetical test evidence
        updated_candidates, trace = self.apply_test_evidence(simulated_candidates, hypothetical_result)

        # Re-score and re-rank using probability engine
        if prob_engine:
            sim_ranked, score_diff, total_score = prob_engine.rank_and_normalize(updated_candidates)
        else:
            # Fallback simple normalization
            for c in updated_candidates:
                c["score"] = max(1.0, c.get("symptom_score", 0.0) - c.get("penalty_score", 0.0))
            updated_candidates.sort(key=lambda x: x["score"], reverse=True)
            tot = sum(c["score"] for c in updated_candidates) or 1.0
            sim_ranked = []
            for c in updated_candidates:
                c["diagnosticConfidenceScore"] = round((c["score"] / tot) * 100.0, 1)
                sim_ranked.append(c)

        # Calculate rank and probability shifts
        rank_shifts = []
        base_map = {b["id"]: b for b in baseline_rankings}

        for new_idx, sim_h in enumerate(sim_ranked):
            sim_id = _get_obj_field(sim_h, "id", default="")
            sim_name = _get_obj_field(sim_h, "name", default="")
            sim_prob = _get_obj_field(sim_h, "normalized_probability", "diagnosticConfidenceScore", default=0.0)

            base_info = base_map.get(sim_id, {"rank": new_idx + 1, "probability": sim_prob})
            old_rank = base_info["rank"]
            old_prob = base_info["probability"]

            prob_delta = round(sim_prob - old_prob, 1)
            rank_delta = old_rank - (new_idx + 1)  # positive means moved up

            direction = "UNCHANGED"
            if prob_delta > 1.0 or rank_delta > 0:
                direction = "GAINS_SUPPORT"
            elif prob_delta < -1.0 or rank_delta < 0:
                direction = "LOSES_SUPPORT"

            rationale = ""
            if direction == "GAINS_SUPPORT":
                rationale = f"Hypothetical {hypothetical_outcome} on {test_def.get('name')} provides direct positive confirmation (+{abs(prob_delta)}% probability shift)."
            elif direction == "LOSES_SUPPORT":
                rationale = f"Hypothetical {hypothetical_outcome} on {test_def.get('name')} directly contradicts this fault model ({prob_delta}% probability shift)."
            else:
                rationale = "Hypothetical outcome has neutral bearing on this hypothesis."

            rank_shifts.append({
                "id": sim_id,
                "name": sim_name,
                "oldRank": old_rank,
                "newRank": new_idx + 1,
                "oldProbability": old_prob,
                "newProbability": sim_prob,
                "probabilityDelta": prob_delta,
                "direction": direction,
                "rationale": rationale
            })

        # Determine next logical test following this hypothetical outcome
        sim_completed = list(completed_tests or []) + [{"test_id": test_id, "result": hypothetical_outcome}]
        next_test_plan = self.select_next_test(
            ranked_hypotheses=sim_ranked,
            completed_tests=sim_completed,
            device_brand=device_brand,
            device_model=device_model
        )

        return {
            "status": "success",
            "isHypothetical": True,
            "disclaimer": "HYPOTHETICAL SIMULATION ONLY — Real repair job, history, and verified case databases were NOT modified.",
            "simulatedTest": self._format_test_def(test_id, test_def),
            "hypotheticalOutcome": hypothetical_outcome,
            "observedValue": observed_value,
            "baselineRankings": baseline_rankings,
            "simulatedHypotheses": [h.to_dict() if hasattr(h, "to_dict") else h for h in sim_ranked],
            "rankShifts": rank_shifts,
            "nextLogicalTest": next_test_plan.get("recommendedTest"),
            "nextLogicalTestReason": next_test_plan.get("selectionReason")
        }

    # =========================================================================
    # FEATURE 4: EXPLAINABLE DIAGNOSTIC PATH (JOURNEY)
    # =========================================================================

    def build_diagnostic_journey(
        self,
        normalized_symptoms,
        initial_hypotheses,
        completed_tests,
        current_hypotheses,
        recommended_next_test=None
    ):
        """
        Maintains an explainable chronological path of the diagnosis session:
        1. Initial reported symptoms & competing hypotheses.
        2. Tests selected and reasons.
        3. Actual test results and evidence updates.
        4. Hypothesis ranking transitions after each test.
        5. Remaining uncertainties and next recommendation.
        """
        journey_steps = []
        step_idx = 1

        # Step 1: Initial Presentation
        symptom_labels = [s.get("code") if isinstance(s, dict) else getattr(s, "code", str(s)) for s in (normalized_symptoms or [])]
        initial_top = []
        for h in (initial_hypotheses or [])[:3]:
            initial_top.append({
                "id": _get_obj_field(h, "id", default=""),
                "name": _get_obj_field(h, "name", default=""),
                "probability": _get_obj_field(h, "normalized_probability", "diagnosticConfidenceScore", default=0.0)
            })

        journey_steps.append({
            "stepIndex": step_idx,
            "stepType": "INITIAL_EVALUATION",
            "title": "Initial Symptom Triage",
            "description": f"Analyzed {len(symptom_labels)} verified symptom pattern(s): {', '.join(symptom_labels) or 'General No-Power State'}.",
            "symptoms": symptom_labels,
            "hypothesesRanking": initial_top,
            "timestamp": datetime.now().isoformat()
        })
        step_idx += 1

        # Steps for each completed test
        for t in (completed_tests or []):
            t_id = t.get("test_id") or t.get("testId")
            res = t.get("result", "PASS")
            obs = t.get("observed_value") or t.get("observedValue") or ""
            t_def = self.test_procedures.get(t_id, {})
            t_name = t_def.get("name", t_id)

            obs_text = f" (Observed reading: {obs})" if obs else ""
            journey_steps.append({
                "stepIndex": step_idx,
                "stepType": "TEST_EXECUTED",
                "title": f"Test Performed: {t_name}",
                "description": f"Recorded actual outcome: {res}{obs_text}.",
                "testId": t_id,
                "testName": t_name,
                "testResult": res,
                "observedValue": obs,
                "ruleReference": t_def.get("rule_reference", ""),
                "timestamp": t.get("timestamp") or datetime.now().isoformat()
            })
            step_idx += 1

        # Current State Step
        current_top = []
        for h in (current_hypotheses or [])[:3]:
            current_top.append({
                "id": _get_obj_field(h, "id", default=""),
                "name": _get_obj_field(h, "name", default=""),
                "probability": _get_obj_field(h, "normalized_probability", "diagnosticConfidenceScore", default=0.0)
            })

        remaining_uncertainties = []
        if len(current_top) >= 2:
            gap = abs(current_top[0]["probability"] - current_top[1]["probability"])
            if gap < 20.0:
                remaining_uncertainties.append(
                    f"Close competition between '{current_top[0]['name']}' and '{current_top[1]['name']}' (gap: {round(gap, 1)}%)."
                )

        journey_steps.append({
            "stepIndex": step_idx,
            "stepType": "CURRENT_DIAGNOSTIC_STATE",
            "title": "Current Diagnostic State",
            "description": f"Leading fault: '{current_top[0]['name'] if current_top else 'Unresolved'}' ({current_top[0]['probability'] if current_top else 0}% confidence).",
            "hypothesesRanking": current_top,
            "remainingUncertainties": remaining_uncertainties,
            "recommendedNextTest": recommended_next_test.get("name") if recommended_next_test else None,
            "timestamp": datetime.now().isoformat()
        })

        return journey_steps

    # =========================================================================
    # FEATURE 5: KNOWLEDGE GAP DETECTION
    # =========================================================================

    def detect_knowledge_gaps(
        self,
        ranked_hypotheses,
        symptoms,
        completed_tests,
        confidence_result,
        device_brand="",
        device_model=""
    ):
        """
        Detects sessions where:
        1. No applicable fault rules match symptoms.
        2. Multiple faults remain indistinguishable after available tests.
        3. Available tests cannot separate leading hypotheses.
        4. Evidence repeatedly contradicts existing rules.
        """
        gaps = []
        symptom_codes = [s.get("code") if isinstance(s, dict) else getattr(s, "code", str(s)) for s in (symptoms or [])]
        completed_test_ids = {t.get("test_id") or t.get("testId") for t in (completed_tests or [])}

        # Check 1: Zero matching rules
        if not ranked_hypotheses:
            gaps.append({
                "gapId": f"GAP-NORULES-{device_brand}-{device_model}".upper(),
                "gapType": "NO_MATCHING_RULES",
                "title": f"No Matching Fault Rules for {device_brand} {device_model}",
                "description": f"The reported symptom set ({', '.join(symptom_codes)}) produced zero candidate hypotheses in the fault knowledge base.",
                "deviceBrand": device_brand,
                "deviceModel": device_model,
                "symptomCodes": symptom_codes,
                "competingHypotheses": [],
                "missingOrConflictingEvidence": "No curated fault rule covers this specific combination of symptoms.",
                "suggestedExpertReview": "Conduct senior technician teardown, verify schematics, and submit an expert fault rule candidate for approval.",
                "requiresAuthorization": True,
                "status": "PENDING_REVIEW"
            })
            return gaps

        # Check 2: Indistinguishable hypotheses after tests performed
        if len(ranked_hypotheses) >= 2 and len(completed_tests) >= 2:
            h1 = ranked_hypotheses[0]
            h2 = ranked_hypotheses[1]
            p1 = _get_obj_field(h1, "normalized_probability", "diagnosticConfidenceScore", default=0.0)
            p2 = _get_obj_field(h2, "normalized_probability", "diagnosticConfidenceScore", default=0.0)

            if abs(p1 - p2) < 5.0:
                gaps.append({
                    "gapId": f"GAP-INDISTINGUISHABLE-{_get_obj_field(h1, 'id', default='H1')}-{_get_obj_field(h2, 'id', default='H2')}",
                    "gapType": "INDISTINGUISHABLE_HYPOTHESES",
                    "title": f"Indistinguishable Leading Hypotheses: {_get_obj_field(h1, 'name', default='')} vs {_get_obj_field(h2, 'name', default='')}",
                    "description": f"After {len(completed_tests)} bench tests, both hypotheses remain virtually tied ({p1}% vs {p2}%).",
                    "deviceBrand": device_brand,
                    "deviceModel": device_model,
                    "symptomCodes": symptom_codes,
                    "competingHypotheses": [
                        {"id": _get_obj_field(h1, "id", default=""), "name": _get_obj_field(h1, "name", default="")},
                        {"id": _get_obj_field(h2, "id", default=""), "name": _get_obj_field(h2, "name", default="")}
                    ],
                    "missingOrConflictingEvidence": "Standard electrical and optical tests cannot differentiate between these failure modes on this board architecture.",
                    "suggestedExpertReview": "Review board schematics for an intermediate test-point (e.g., LDO output or I2C clock rail) that definitively separates these two circuits.",
                    "requiresAuthorization": True,
                    "status": "PENDING_REVIEW"
                })

        # Check 3: Low confidence despite all symptom inputs
        conf_level = confidence_result.get("level") if isinstance(confidence_result, dict) else getattr(confidence_result, "level", "LOW")
        conf_score = confidence_result.get("score") if isinstance(confidence_result, dict) else getattr(confidence_result, "score", 0)

        if conf_level == "LOW" and len(completed_tests) >= 3:
            gaps.append({
                "gapId": f"GAP-PERSISTENT-LOW-CONFIDENCE-{device_brand}".upper(),
                "gapType": "CONTRADICTORY_EVIDENCE",
                "title": "Persistent Low Confidence Despite Multiple Bench Tests",
                "description": f"Confidence remains at {conf_score}% after {len(completed_tests)} tests due to conflicting electrical observations.",
                "deviceBrand": device_brand,
                "deviceModel": device_model,
                "symptomCodes": symptom_codes,
                "competingHypotheses": [{"id": _get_obj_field(h, "id", default=""), "name": _get_obj_field(h, "name", default="")} for h in ranked_hypotheses[:3]],
                "missingOrConflictingEvidence": "Observations partially support and partially contradict multiple concurrent power faults.",
                "suggestedExpertReview": "Investigate potential multi-fault cascade (e.g. secondary drop shock impact following prior liquid ingress).",
                "requiresAuthorization": True,
                "status": "PENDING_REVIEW"
            })

        return gaps
