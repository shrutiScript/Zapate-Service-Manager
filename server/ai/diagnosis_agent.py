"""
Diagnosis Agent Orchestrator.

Responsibility:
Coordinates the entire Hybrid AI Diagnosis workflow step-by-step:
  Step 1: Normalize Symptoms (Convert text into standard codes)
  Step 2: Expert Rules (Score candidate faults from rules)
  Step 3: Case Retrieval (Find similar past repairs from shop history)
  Step 4: Probability Engine (Calculate simple scores and rank faults)
  Step 5: Confidence Engine (Determine LOW / MEDIUM / HIGH confidence)
  Step 6: Follow-up Engine (Generate questions if confidence is low)
  Step 7: Knowledge Retrieval (Get tests, repair guidance, and safety warnings)
  Step 8: Return Complete Structured Output
"""

import copy
from symptom_normalizer import SymptomNormalizer
from rules_engine import RulesEngine
from case_retrieval import CaseRetrievalEngine
from probability_engine import ProbabilityEngine
from confidence_engine import ConfidenceEngine
from followup_engine import FollowUpEngine
from knowledge_retrieval import KnowledgeRetrievalEngine
from diagnostic_test_planner import DiagnosticTestPlanner
from schemas import DiagnosisRequest

class DiagnosisAgent:
    def __init__(self):
        # Initialize all simple components
        self.normalizer = SymptomNormalizer()
        self.rules_engine = RulesEngine()
        self.case_retrieval = CaseRetrievalEngine()
        self.prob_engine = ProbabilityEngine()
        self.confidence_engine = ConfidenceEngine()
        self.followup_engine = FollowUpEngine()
        self.knowledge_engine = KnowledgeRetrievalEngine()
        self.test_planner = DiagnosticTestPlanner()

    def run_diagnosis(self, req):
        """
        Executes the diagnosis pipeline.
        Accepts either a DiagnosisRequest object or a plain dictionary.
        """
        # Support both DiagnosisRequest object and plain dictionary
        if isinstance(req, dict):
            brand = req.get("deviceBrand") or req.get("device_brand") or ""
            model = req.get("deviceModel") or req.get("device_model") or ""
            symptoms_text = req.get("symptoms") or ""
            confirmed_symptoms = req.get("confirmedSymptoms") or req.get("confirmed_symptoms") or []
            follow_up_answers = req.get("followUpAnswers") or req.get("follow_up_answers") or {}
            historical_cases = req.get("historicalCases") or req.get("historical_cases") or []
            inventory_parts = req.get("inventoryParts") or req.get("inventory_parts") or []
            test_results = req.get("testResults") or req.get("test_results") or []
            what_if_sim = req.get("whatIfSimulation") or req.get("what_if_simulation")
        else:
            brand = req.device_brand or ""
            model = req.device_model or ""
            symptoms_text = req.symptoms or ""
            confirmed_symptoms = req.confirmed_symptoms or []
            follow_up_answers = req.follow_up_answers or {}
            historical_cases = req.historical_cases or []
            inventory_parts = req.inventory_parts or []
            test_results = getattr(req, "test_results", None) or getattr(req, "testResults", []) or []
            what_if_sim = getattr(req, "what_if_simulation", None) or getattr(req, "whatIfSimulation", None)

        # ------------------------------------------------------------
        # STEP 1: Normalize symptoms (text -> standard codes)
        # ------------------------------------------------------------
        normalized_symptoms, negative_confirmations, missing_info = self.normalizer.normalize(
            raw_text=symptoms_text,
            confirmed_symptoms=confirmed_symptoms
        )
        symptom_codes = {s["code"] for s in normalized_symptoms}

        if not model and not brand and symptoms_text:
            missing_info.append("Device model not specified; diagnosis is based on general smartphone architecture.")

        # ------------------------------------------------------------
        # STEP 2: Evaluate Expert Rules
        # ------------------------------------------------------------
        candidate_evaluations = self.rules_engine.evaluate(
            symptoms=normalized_symptoms,
            negative_confirmations=negative_confirmations,
            device_brand=brand,
            device_model=model
        )
        candidate_categories = [c["category"] for c in candidate_evaluations]

        # Snapshot baseline evaluations before actual test results for journey tracking
        initial_evaluations = copy.deepcopy(candidate_evaluations)

        # ------------------------------------------------------------
        # STEP 2B: Apply Actual Test Result Evidence (If Provided)
        # ------------------------------------------------------------
        applied_test_trace = []
        if test_results:
            candidate_evaluations, applied_test_trace = self.test_planner.apply_test_evidence(
                candidate_evaluations,
                test_results
            )

        # ------------------------------------------------------------
        # STEP 3: Retrieve Similar Historical Completed Repairs
        # ------------------------------------------------------------
        similar_cases_summary = self.case_retrieval.retrieve(
            current_brand=brand,
            current_model=model,
            normalized_symptom_codes=list(symptom_codes),
            candidate_categories=candidate_categories,
            historical_cases=historical_cases
        )

        # ------------------------------------------------------------
        # STEP 4: Rank Faults using Simple Scoring
        # ------------------------------------------------------------
        follow_up_boosts = self.followup_engine.calculate_answer_boosts(follow_up_answers)
        
        ranked_hypotheses, score_diff, total_raw_score = self.prob_engine.rank_and_normalize(
            candidate_hypotheses=candidate_evaluations,
            historical_matches_summary=similar_cases_summary,
            follow_up_boosts=follow_up_boosts
        )
        top_hypothesis = ranked_hypotheses[0] if ranked_hypotheses else None

        # Compute initial hypotheses ranking for journey comparison if test results were applied
        initial_ranked = ranked_hypotheses
        if test_results and initial_evaluations:
            initial_ranked, _, _ = self.prob_engine.rank_and_normalize(
                candidate_hypotheses=initial_evaluations,
                historical_matches_summary=similar_cases_summary,
                follow_up_boosts=follow_up_boosts
            )

        # ------------------------------------------------------------
        # STEP 5: Determine Diagnostic Confidence Level
        # ------------------------------------------------------------
        confidence_result = self.confidence_engine.evaluate(
            hypotheses=ranked_hypotheses,
            score_separation=score_diff,
            symptoms=normalized_symptoms,
            device_brand=brand,
            device_model=model,
            historical_match_count=similar_cases_summary.total_matches,
            follow_up_answered_count=len(follow_up_answers) + len(test_results)
        )

        # ------------------------------------------------------------
        # STEP 6: Ask Follow-up Questions if Confidence is Low/Medium
        # ------------------------------------------------------------
        follow_up_questions = []
        if confidence_result.get("requires_followup") or confidence_result.get("level") in ["LOW", "MEDIUM"]:
            follow_up_questions = self.followup_engine.select_questions(
                hypotheses=ranked_hypotheses,
                answered_question_ids=follow_up_answers
            )

        # ------------------------------------------------------------
        # STEP 7: Adaptive Diagnostic Test Planner (Next Test Selection)
        # ------------------------------------------------------------
        test_plan = self.test_planner.select_next_test(
            ranked_hypotheses=ranked_hypotheses,
            symptoms=normalized_symptoms,
            completed_tests=test_results,
            device_brand=brand,
            device_model=model,
            confidence_result=confidence_result
        )
        recommended_next_test = test_plan.get("recommendedTest")

        # ------------------------------------------------------------
        # STEP 7B: Knowledge Gap Detection
        # ------------------------------------------------------------
        knowledge_gaps = self.test_planner.detect_knowledge_gaps(
            ranked_hypotheses=ranked_hypotheses,
            symptoms=normalized_symptoms,
            completed_tests=test_results,
            confidence_result=confidence_result,
            device_brand=brand,
            device_model=model
        )

        # ------------------------------------------------------------
        # STEP 7C: Explainable Diagnostic Journey Timeline
        # ------------------------------------------------------------
        diagnostic_journey = self.test_planner.build_diagnostic_journey(
            normalized_symptoms=normalized_symptoms,
            initial_hypotheses=initial_ranked if test_results else ranked_hypotheses,
            completed_tests=test_results,
            current_hypotheses=ranked_hypotheses,
            recommended_next_test=recommended_next_test
        )

        # ------------------------------------------------------------
        # STEP 7D: What-if Diagnostic Simulation (If Requested)
        # ------------------------------------------------------------
        what_if_simulation_result = None
        if what_if_sim:
            sim_test_id = what_if_sim.get("testId") or what_if_sim.get("test_id")
            sim_outcome = what_if_sim.get("hypotheticalOutcome") or what_if_sim.get("hypothetical_outcome") or what_if_sim.get("outcome") or "PASS"
            sim_observed = what_if_sim.get("observedValue") or what_if_sim.get("observed_value") or ""
            if sim_test_id:
                what_if_simulation_result = self.test_planner.simulate_what_if(
                    test_id=sim_test_id,
                    hypothetical_outcome=sim_outcome,
                    observed_value=sim_observed,
                    current_hypotheses=ranked_hypotheses,
                    prob_engine=self.prob_engine,
                    completed_tests=test_results,
                    device_brand=brand,
                    device_model=model
                )

        # ------------------------------------------------------------
        # STEP 7E: Get Confirmation Tests, Repair Steps & Safety Alerts
        # ------------------------------------------------------------
        test_keys = []
        if top_hypothesis:
            test_keys.extend(top_hypothesis.confirmation_tests)
        if len(ranked_hypotheses) > 1:
            for h in ranked_hypotheses[1:3]:
                for tk in h.confirmation_tests:
                    if tk not in test_keys:
                        test_keys.append(tk)

        recommended_tests = self.knowledge_engine.get_confirmation_tests(test_keys[:4])
        repair_guidance = self.knowledge_engine.get_repair_guidance(brand, model, top_hypothesis)
        post_repair_checklist = self.knowledge_engine.get_post_repair_checklist(top_hypothesis)
        safety_warnings = self.knowledge_engine.generate_safety_warnings(symptom_codes, top_hypothesis)

        # Estimate repair bench time
        bench_time_str = "30 - 45 minutes"
        if top_hypothesis:
            bench_time_str = f"{top_hypothesis.est_bench_minutes_min} - {top_hypothesis.est_bench_minutes_max} minutes"

        # Check for inventory spare parts match
        parts_estimate = {
            "recommended_parts": top_hypothesis.recommended_parts if top_hypothesis else [],
            "source": "Fault Rule Specification & Historical Shop Allocation",
            "has_inventory_match": False,
            "matched_inventory_items": []
        }

        if inventory_parts and top_hypothesis:
            matched_inv = []
            for item in inventory_parts:
                item_name = (item.get("name") or "").lower()
                item_compat = (item.get("compatibleModel") or "").lower()
                if (model and model.lower() in item_compat) or any(p.lower() in item_name for p in top_hypothesis.recommended_parts):
                    matched_inv.append({
                        "id": str(item.get("_id") or item.get("id")),
                        "name": item.get("name"),
                        "sellingPrice": item.get("sellingPrice", 0),
                        "quantity": item.get("quantity", 0),
                        "status": item.get("status", "In Stock")
                    })
            if matched_inv:
                parts_estimate["has_inventory_match"] = True
                parts_estimate["matched_inventory_items"] = matched_inv

        # ------------------------------------------------------------
        # STEP 8: Return Complete Structured Result
        # ------------------------------------------------------------
        return {
            "status": "success",
            "engine_name": "Zapate AI Diagnostic Copilot (Adaptive Test Planner & Simulation)",
            "device": {
                "brand": brand or "Unspecified",
                "model": model or "Generic Smartphone"
            },
            "normalizedSymptoms": normalized_symptoms,
            "missingInformation": missing_info,
            "diagnosticConfidence": confidence_result,
            "hypotheses": [h.to_dict() for h in ranked_hypotheses],
            "followUpQuestions": follow_up_questions,
            "similarRepairs": similar_cases_summary.to_dict(),
            "recommendedTests": recommended_tests,
            "recommendedNextTest": recommended_next_test,
            "testPlan": test_plan,
            "diagnosticJourney": diagnostic_journey,
            "knowledgeGaps": knowledge_gaps,
            "appliedTestResults": test_results,
            "appliedTestTrace": applied_test_trace,
            "whatIfSimulation": what_if_simulation_result,
            "repairGuidance": repair_guidance,
            "postRepairChecklist": post_repair_checklist,
            "partsEstimate": parts_estimate,
            "benchTimeEstimate": bench_time_str,
            "warnings": safety_warnings,
            "rawEvidenceTrace": {
                "totalHypothesesEvaluated": len(candidate_evaluations),
                "totalRawScoreSum": round(total_raw_score, 1),
                "scoreDifferenceTopTwo": round(score_diff, 1),
                "appliedFollowUpAnswers": follow_up_answers,
                "appliedTestCount": len(test_results)
            }
        }
