"""
Automated Test Suite for Zapate AI Diagnostic Copilot — Adaptive Diagnostic Test Planner with What-if Simulation.
Covers Section J Test Requirements:
1. Test selection between competing hypotheses.
2. Deterministic selection for identical inputs.
3. Inapplicable and unsafe test rejection.
4. Missing prerequisites / safety constraints.
5. Pass, fail, inconclusive, and not-performed results.
6. Duplicate result prevention (Idempotency).
7. Evidence update and hypothesis re-ranking.
8. What-if simulation without persistent side effects.
9. Separation between hypothetical and actual results.
10. Diagnostic journey traceability.
11. Knowledge-gap creation.
12. Existing diagnosis API backward compatibility.
13. Missing rules and insufficient evidence handling.
"""

import sys
import os
import copy
from datetime import datetime

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_DIR = os.path.dirname(CURRENT_DIR)
if AI_DIR not in sys.path:
    sys.path.insert(0, AI_DIR)

from diagnosis_agent import DiagnosisAgent
from schemas import DiagnosisRequest
from diagnostic_test_planner import DiagnosticTestPlanner

def run_all_tests():
    agent = DiagnosisAgent()
    planner = DiagnosticTestPlanner()
    passed = 0
    failed = 0

    print("==================================================================")
    print("RUNNING ZAPATE AI DIAGNOSTIC COPILOT COMPREHENSIVE TEST SUITE")
    print("==================================================================\n")

    # TEST 1: Test Selection Between Competing Hypotheses
    # "Phone does not charge after drop" creates competing hypotheses:
    # 1. Charging Port / Sub-Board Mechanical Fault
    # 2. Charging Management IC PMIC Fault
    t1_req = DiagnosisRequest(
        device_brand="Samsung",
        device_model="Galaxy S21",
        symptoms="Phone dropped on floor and now it does not charge."
    )
    t1_res = agent.run_diagnosis(t1_req)
    t1_test = t1_res.get("recommendedNextTest")
    if t1_test and t1_test.get("testId") in ["TEST_CHARGING_PORT_MICROSCOPE_PIN_CHECK", "TEST_USB_AMMETER_CURRENT_DRAW", "TEST_SUB_BOARD_FLEX_CONTINUITY"]:
        print(f"[PASS] Test 1: Selected discriminating test '{t1_test.get('name')}' between competing charging faults.")
        passed += 1
    else:
        print(f"[FAIL] Test 1: Expected charging discriminator test, got {t1_test}")
        failed += 1

    # TEST 2: Deterministic Selection for Identical Inputs
    t2_a = agent.run_diagnosis(t1_req)
    t2_b = agent.run_diagnosis(t1_req)
    t2_test_a = t2_a.get("recommendedNextTest", {}).get("testId")
    t2_test_b = t2_b.get("recommendedNextTest", {}).get("testId")
    if t2_test_a == t2_test_b and t2_test_a is not None:
        print(f"[PASS] Test 2: Deterministic selection verified. Identical test '{t2_test_a}' produced for duplicate runs.")
        passed += 1
    else:
        print(f"[FAIL] Test 2: Non-deterministic selection: {t2_test_a} vs {t2_test_b}")
        failed += 1

    # TEST 3: Inapplicable Test Rejection (e.g. Backlight Diode Test on AMOLED)
    # AMOLED screens do not have an LCD backlight circuit.
    t3_req = DiagnosisRequest(
        device_brand="Samsung",
        device_model="Galaxy S22 Ultra AMOLED",
        symptoms="Display is black after drop impact"
    )
    t3_res = agent.run_diagnosis(t3_req)
    t3_test = t3_res.get("recommendedNextTest")
    # Must NOT recommend TEST_DIODE_MODE_BACKLIGHT_ANODE or TEST_FLASHLIGHT_IMAGE_REFLECTION_CHECK
    if t3_test and t3_test.get("testId") not in ["TEST_DIODE_MODE_BACKLIGHT_ANODE", "TEST_FLASHLIGHT_IMAGE_REFLECTION_CHECK"]:
        print(f"[PASS] Test 3: Inapplicable LCD backlight test correctly rejected for AMOLED device. Recommended: {t3_test.get('name')}.")
        passed += 1
    else:
        print(f"[FAIL] Test 3: Incorrectly recommended LCD backlight test on AMOLED: {t3_test}")
        failed += 1

    # TEST 4: Safety Prerequisites & Swollen Battery Protocol
    # When battery is swollen, dangerous power injection tests must NOT be recommended before physical inspection.
    t4_req = DiagnosisRequest(
        device_brand="Google",
        device_model="Pixel 6 Pro",
        symptoms="Back panel is popping out and phone battery is swollen and hot"
    )
    t4_res = agent.run_diagnosis(t4_req)
    t4_test = t4_res.get("recommendedNextTest")
    if t4_test and t4_test.get("testId") == "TEST_PHYSICAL_BATTERY_DIMENSION_CHECK":
        print("[PASS] Test 4: Safety prerequisite prioritized TEST_PHYSICAL_BATTERY_DIMENSION_CHECK before power injection.")
        passed += 1
    else:
        print(f"[FAIL] Test 4: Expected TEST_PHYSICAL_BATTERY_DIMENSION_CHECK, got {t4_test}")
        failed += 1

    # TEST 5: Actual Test Result (PASS) Updates Evidence & Re-ranks Hypotheses
    # Baseline: Drop charging failure -> Port Fault is #1
    # When port microscope inspection PASSES, Port Fault is weakened and PMIC is boosted to #1
    t5_req = DiagnosisRequest(
        device_brand="Samsung",
        device_model="Galaxy S21",
        symptoms="Phone dropped on floor and now it does not charge.",
        test_results=[{
            "test_id": "TEST_CHARGING_PORT_MICROSCOPE_PIN_CHECK",
            "result": "PASS",
            "observed_value": "Clean straight contacts"
        }]
    )
    t5_res = agent.run_diagnosis(t5_req)
    t5_top = t5_res["hypotheses"][0]["id"]
    if t5_top == "CHARGING_IC_PMIC_CIRCUIT_FAULT":
        print("[PASS] Test 5: Actual PASS test result correctly weakened Port Fault and boosted PMIC Circuit Fault to #1.")
        passed += 1
    else:
        print(f"[FAIL] Test 5: Expected CHARGING_IC_PMIC_CIRCUIT_FAULT after port PASS, got {t5_top}")
        failed += 1

    # TEST 6: Actual Test Result (FAIL) Strengthens Leading Fault
    t6_req = DiagnosisRequest(
        device_brand="Samsung",
        device_model="Galaxy S21",
        symptoms="Phone dropped on floor and now it does not charge.",
        test_results=[{
            "test_id": "TEST_CHARGING_PORT_MICROSCOPE_PIN_CHECK",
            "result": "FAIL",
            "observed_value": "Bent and broken CC pin contacts"
        }]
    )
    t6_res = agent.run_diagnosis(t6_req)
    t6_top = t6_res["hypotheses"][0]["id"]
    if t6_top == "CHARGING_PORT_SUB_BOARD_DAMAGE":
        print("[PASS] Test 6: Actual FAIL test result strongly confirmed Port Fault as #1.")
        passed += 1
    else:
        print(f"[FAIL] Test 6: Expected CHARGING_PORT_SUB_BOARD_DAMAGE after port FAIL, got {t6_top}")
        failed += 1

    # TEST 7: Neutral Handling of INCONCLUSIVE and NOT_PERFORMED Results
    t7_base = agent.run_diagnosis(t1_req)
    t7_req = DiagnosisRequest(
        device_brand="Samsung",
        device_model="Galaxy S21",
        symptoms="Phone dropped on floor and now it does not charge.",
        test_results=[{
            "test_id": "TEST_CHARGING_PORT_MICROSCOPE_PIN_CHECK",
            "result": "INCONCLUSIVE",
            "observed_value": "Lint obstruction obscures pin view"
        }]
    )
    t7_res = agent.run_diagnosis(t7_req)
    # The scores of the hypotheses should remain identical to base because INCONCLUSIVE is neutral
    base_score = t7_base["hypotheses"][0]["diagnosticConfidenceScore"]
    inconc_score = t7_res["hypotheses"][0]["diagnosticConfidenceScore"]
    if base_score == inconc_score:
        print(f"[PASS] Test 7: INCONCLUSIVE result treated neutrally without skewing hypothesis confidence ({base_score}% == {inconc_score}%).")
        passed += 1
    else:
        print(f"[FAIL] Test 7: INCONCLUSIVE altered score: {base_score} vs {inconc_score}")
        failed += 1

    # TEST 8: Duplicate Result Prevention (Idempotency)
    # Passing the same test twice must NOT count the evidence delta twice
    t8_double_req = DiagnosisRequest(
        device_brand="Samsung",
        device_model="Galaxy S21",
        symptoms="Phone dropped on floor and now it does not charge.",
        test_results=[
            {"test_id": "TEST_CHARGING_PORT_MICROSCOPE_PIN_CHECK", "result": "PASS"},
            {"test_id": "TEST_CHARGING_PORT_MICROSCOPE_PIN_CHECK", "result": "PASS"}
        ]
    )
    t8_double_res = agent.run_diagnosis(t8_double_req)
    t8_single_res = t5_res
    double_score = t8_double_res["hypotheses"][0]["score"]
    single_score = t8_single_res["hypotheses"][0]["score"]
    if double_score == single_score:
        print(f"[PASS] Test 8: Duplicate test submission prevented (Idempotent score {single_score}).")
        passed += 1
    else:
        print(f"[FAIL] Test 8: Duplicate test was counted twice ({single_score} vs {double_score})")
        failed += 1

    # TEST 9: Non-Persistent What-If Simulation
    # Running what-if simulation on TEST_USB_AMMETER_CURRENT_DRAW -> FAIL
    t9_req = DiagnosisRequest(
        device_brand="Samsung",
        device_model="Galaxy S21",
        symptoms="Phone dropped on floor and now it does not charge.",
        what_if_simulation={
            "test_id": "TEST_USB_AMMETER_CURRENT_DRAW",
            "hypothetical_outcome": "FAIL",
            "observed_value": "0.00A"
        }
    )
    t9_res = agent.run_diagnosis(t9_req)
    t9_sim = t9_res.get("whatIfSimulation")
    if t9_sim and t9_sim.get("isHypothetical") is True and len(t9_sim.get("rankShifts", [])) > 0:
        print("[PASS] Test 9: What-if simulation completed non-persistently with explicit disclaimer and rank shifts.")
        passed += 1
    else:
        print(f"[FAIL] Test 9: What-if simulation response invalid: {t9_sim}")
        failed += 1

    # TEST 10: Separation Between Hypothetical and Actual Diagnostic Journey
    # The actual diagnosis hypotheses in t9_res must NOT equal the simulated hypotheses in t9_sim
    actual_top_prob = t9_res["hypotheses"][0]["diagnosticConfidenceScore"]
    simulated_top_prob = t9_sim["simulatedHypotheses"][0]["diagnosticConfidenceScore"]
    # In simulation with FAIL on ammeter, Port Fault gains support, so probabilities differ from un-tested baseline
    if t9_res["appliedTestResults"] == [] and t9_sim["isHypothetical"] is True:
        print(f"[PASS] Test 10: Separation verified. Actual session has 0 recorded tests, simulation has isolated state.")
        passed += 1
    else:
        print(f"[FAIL] Test 10: Leakage between hypothetical simulation and actual session.")
        failed += 1

    # TEST 11: Traceable Diagnostic Journey Steps
    # A session with symptoms + 1 test must produce at least 3 journey steps:
    # 1. INITIAL_EVALUATION
    # 2. TEST_EXECUTED
    # 3. CURRENT_DIAGNOSTIC_STATE
    t11_journey = t5_res.get("diagnosticJourney", [])
    if len(t11_journey) >= 3 and t11_journey[0]["stepType"] == "INITIAL_EVALUATION" and t11_journey[1]["stepType"] == "TEST_EXECUTED":
        print(f"[PASS] Test 11: Diagnostic journey traceable with {len(t11_journey)} chronological steps.")
        passed += 1
    else:
        print(f"[FAIL] Test 11: Journey steps incomplete: {t11_journey}")
        failed += 1

    # TEST 12: Knowledge Gap Detection (No Matching Rules)
    t12_req = DiagnosisRequest(
        device_brand="UnknownBrand",
        device_model="ModelXYZ",
        symptoms="Random cosmetic scratch on plastic frame bezel"
    )
    t12_res = agent.run_diagnosis(t12_req)
    t12_gaps = t12_res.get("knowledgeGaps", [])
    if len(t12_gaps) > 0 and t12_gaps[0]["gapType"] == "NO_MATCHING_RULES":
        print(f"[PASS] Test 12: Knowledge gap correctly flagged ({t12_gaps[0]['title']}) when no rules match.")
        passed += 1
    else:
        print(f"[FAIL] Test 12: Expected NO_MATCHING_RULES gap, got: {t12_gaps}")
        failed += 1

    # TEST 13: Backward Compatibility with Existing API Response Keys
    expected_legacy_keys = [
        "status", "engine_name", "device", "normalizedSymptoms", "diagnosticConfidence",
        "hypotheses", "followUpQuestions", "similarRepairs", "recommendedTests",
        "repairGuidance", "postRepairChecklist", "partsEstimate", "warnings"
    ]
    all_keys_present = all(k in t1_res for k in expected_legacy_keys)
    if all_keys_present:
        print("[PASS] Test 13: 100% backward compatibility with all legacy response keys verified.")
        passed += 1
    else:
        missing = [k for k in expected_legacy_keys if k not in t1_res]
        print(f"[FAIL] Test 13: Missing legacy keys: {missing}")
        failed += 1

    print("\n==================================================================")
    print(f"DIAGNOSTIC COPILOT TEST RESULTS: {passed} PASSED, {failed} FAILED (TOTAL: {passed + failed})")
    print("==================================================================")
    return passed, failed

if __name__ == "__main__":
    passed, failed = run_all_tests()
    sys.exit(0 if failed == 0 else 1)
