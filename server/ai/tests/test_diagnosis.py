"""
Automated Test Suite for Zapate Service Manager Hybrid Mobile Repair Diagnosis Engine.
Tests all 10+ core hardware fault scenarios, drop vs liquid separation, and multilingual normalization.
"""
import sys
import os

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

from diagnosis_agent import DiagnosisAgent
from schemas import DiagnosisRequest

def run_all_tests():
    agent = DiagnosisAgent()
    passed = 0
    failed = 0

    print("==================================================")
    print("RUNNING ZAPATE SERVICE MANAGER HYBRID AI DIAGNOSIS TEST SUITE")
    print("==================================================\n")

    # TEST 1: Display Physical Damage
    t1_req = DiagnosisRequest(
        device_brand="Apple",
        device_model="iPhone 13",
        symptoms="Screen is shattered and has purple bleeding ink spots, but touch still works partially."
    )
    t1_res = agent.run_diagnosis(t1_req)
    t1_top = t1_res["hypotheses"][0]["id"]
    if t1_top == "DISPLAY_ASSEMBLY_PHYSICAL_DAMAGE":
        print("[PASS] Test 1: Display Physical Damage correctly identified OLED matrix fracture.")
        passed += 1
    else:
        print(f"[FAIL] Test 1: Expected DISPLAY_ASSEMBLY_PHYSICAL_DAMAGE, got {t1_top}")
        failed += 1

    # TEST 2: Touch Failure
    t2_req = DiagnosisRequest(
        device_brand="Samsung",
        device_model="Galaxy A52",
        symptoms="Display glass is clean but touch not working at all, cannot tap anything."
    )
    t2_res = agent.run_diagnosis(t2_req)
    t2_syms = [s["code"] for s in t2_res["normalizedSymptoms"]]
    if "TOUCH_UNRESPONSIVE" in t2_syms:
        print("[PASS] Test 2: Touch Failure correctly extracted TOUCH_UNRESPONSIVE symptom.")
        passed += 1
    else:
        print(f"[FAIL] Test 2: TOUCH_UNRESPONSIVE not found in {t2_syms}")
        failed += 1

    # TEST 3: Charging Failure (Pure Mechanical Drop Shock)
    # CRITICAL REQUIREMENT: "Phone dropped and now it does not charge." must NOT classify as water damage.
    t3_req = DiagnosisRequest(
        device_brand="Samsung",
        device_model="Galaxy S21",
        symptoms="Phone dropped on floor and now it does not charge."
    )
    t3_res = agent.run_diagnosis(t3_req)
    t3_top = t3_res["hypotheses"][0]["id"]
    t3_syms = [s["code"] for s in t3_res["normalizedSymptoms"]]
    
    is_not_water = "LIQUID_EXPOSURE" not in t3_syms and t3_top != "LIQUID_CORROSION_AND_POWER_RAIL_SHORT"
    is_charging_or_drop = t3_top in ["CHARGING_PORT_SUB_BOARD_DAMAGE", "CHARGING_IC_PMIC_CIRCUIT_FAULT", "DISPLAY_ASSEMBLY_PHYSICAL_DAMAGE"]
    
    if is_not_water and is_charging_or_drop:
        print(f"[PASS] Test 3: 'Phone dropped and now does not charge' correctly classified as {t3_top} (NOT water damage).")
        passed += 1
    else:
        print(f"[FAIL] Test 3: Misclassified as water damage or wrong category! Top: {t3_top}, Symptoms: {t3_syms}")
        failed += 1

    # TEST 4: Battery Degradation & Drain
    t4_req = DiagnosisRequest(
        device_brand="OnePlus",
        device_model="OnePlus 9",
        symptoms="Battery draining fast from 100% to 10% in 2 hours, phone is warm."
    )
    t4_res = agent.run_diagnosis(t4_req)
    t4_top = t4_res["hypotheses"][0]["id"]
    if t4_top in ["BATTERY_DEGRADATION_CELL_FAILURE", "CHARGING_IC_PMIC_CIRCUIT_FAULT"]:
        print(f"[PASS] Test 4: Battery Drain correctly prioritized {t4_top}.")
        passed += 1
    else:
        print(f"[FAIL] Test 4: Expected battery or power management hypothesis, got {t4_top}")
        failed += 1

    # TEST 5: Overheating & Primary Short
    t5_req = DiagnosisRequest(
        device_brand="Xiaomi",
        device_model="Redmi Note 11",
        symptoms="Device gets hot near processor area and won't turn on, battery heats up."
    )
    t5_res = agent.run_diagnosis(t5_req)
    t5_hyp_ids = [h["id"] for h in t5_res["hypotheses"][:3]]
    if "PRIMARY_POWER_RAIL_SHORT_CIRCUIT" in t5_hyp_ids or "CHARGING_IC_PMIC_CIRCUIT_FAULT" in t5_hyp_ids:
        print(f"[PASS] Test 5: Overheating & Dead state correctly evaluated power short hypotheses: {t5_hyp_ids}.")
        passed += 1
    else:
        print(f"[FAIL] Test 5: Power rail short not found in top 3: {t5_hyp_ids}")
        failed += 1

    # TEST 6: Liquid Exposure & Corrosion
    t6_req = DiagnosisRequest(
        device_brand="Vivo",
        device_model="Vivo V25",
        symptoms="Phone fell in water basin, took out immediately, now phone is dead."
    )
    t6_res = agent.run_diagnosis(t6_req)
    t6_top = t6_res["hypotheses"][0]["id"]
    t6_warnings = [w["severity"] for w in t6_res["warnings"]]
    if t6_top == "LIQUID_CORROSION_AND_POWER_RAIL_SHORT" and ("DANGER" in t6_warnings or "CRITICAL" in t6_warnings):
        print("[PASS] Test 6: Liquid exposure correctly triggered corrosion protocol and safety warning.")
        passed += 1
    else:
        print(f"[FAIL] Test 6: Expected LIQUID_CORROSION_AND_POWER_RAIL_SHORT with safety warning, got {t6_top}")
        failed += 1

    # TEST 7: Dead Phone / No Power
    t7_req = DiagnosisRequest(
        device_brand="Apple",
        device_model="iPhone 12",
        symptoms="Completely dead phone, no signs of life, won't turn on at all."
    )
    t7_res = agent.run_diagnosis(t7_req)
    t7_syms = [s["code"] for s in t7_res["normalizedSymptoms"]]
    if "NO_POWER" in t7_syms:
        print("[PASS] Test 7: No Power condition correctly identified and benchmarked.")
        passed += 1
    else:
        print(f"[FAIL] Test 7: NO_POWER not extracted from symptoms: {t7_syms}")
        failed += 1

    # TEST 8: Boot Loop Condition
    t8_req = DiagnosisRequest(
        device_brand="Samsung",
        device_model="Galaxy S20 FE",
        symptoms="Stuck on Samsung logo, restarting continuously every 30 seconds."
    )
    t8_res = agent.run_diagnosis(t8_req)
    t8_hyp_ids = [h["id"] for h in t8_res["hypotheses"][:3]]
    if "CORRUPTED_FIRMWARE_NAND_FAULT" in t8_hyp_ids or "CPU_RAM_BGA_JOINT_MICRO_FRACTURE" in t8_hyp_ids:
        print(f"[PASS] Test 8: Boot Loop correctly evaluated firmware & CPU/RAM hypotheses: {t8_hyp_ids}.")
        passed += 1
    else:
        print(f"[FAIL] Test 8: Expected boot loop hypotheses, got {t8_hyp_ids}")
        failed += 1

    # TEST 9: Complex Multi-Symptom Case ("Phone got wet and now heats while charging")
    t9_req = DiagnosisRequest(
        device_brand="Apple",
        device_model="iPhone 14",
        symptoms="Phone got wet and now heats while charging."
    )
    t9_res = agent.run_diagnosis(t9_req)
    t9_syms = {s["code"] for s in t9_res["normalizedSymptoms"]}
    expected_multi = {"LIQUID_EXPOSURE", "OVERHEATING", "CHARGING_FAILURE"}
    matched_subset = expected_multi.intersection(t9_syms)
    
    # Must evaluate liquid corrosion, charging circuit, battery, and short circuit
    t9_hyp_ids = [h["id"] for h in t9_res["hypotheses"][:4]]
    has_corrosion = "LIQUID_CORROSION_AND_POWER_RAIL_SHORT" in t9_hyp_ids
    has_charging = any("CHARGING" in h for h in t9_hyp_ids)
    
    if len(matched_subset) >= 2 and has_corrosion and has_charging:
        print(f"[PASS] Test 9: Multi-symptom case extracted {matched_subset} and ranked competing causes: {t9_hyp_ids}.")
        passed += 1
    else:
        print(f"[FAIL] Test 9: Multi-symptom extraction or hypothesis ranking incomplete: {t9_syms}, {t9_hyp_ids}")
        failed += 1

    # TEST 10: Multilingual Symptom Normalization (Gujarati / Hindi / Hinglish)
    t10_guj_req = DiagnosisRequest(
        device_brand="Vivo",
        device_model="Y20",
        symptoms="phone garam thay chhe ane charge nathi thatu, pani ma padyu hatu"
    )
    t10_res = agent.run_diagnosis(t10_guj_req)
    t10_codes = {s["code"] for s in t10_res["normalizedSymptoms"]}
    if "OVERHEATING" in t10_codes and "CHARGING_FAILURE" in t10_codes and "LIQUID_EXPOSURE" in t10_codes:
        print(f"[PASS] Test 10: Gujarati/Hindi phrases correctly normalized to canonical codes: {t10_codes}.")
        passed += 1
    else:
        print(f"[FAIL] Test 10: Gujarati phrases failed to normalize: {t10_codes}")
        failed += 1

    # TEST 11: Swollen Battery Safety Critical Warning
    t11_req = DiagnosisRequest(
        device_brand="Realme",
        device_model="Realme 8",
        symptoms="Back cover is lifting off, battery swollen and puffed up."
    )
    t11_res = agent.run_diagnosis(t11_req)
    t11_top = t11_res["hypotheses"][0]["id"]
    t11_critical = any(w["severity"] == "CRITICAL" for w in t11_res["warnings"])
    if t11_top == "BATTERY_SWELLING_SAFETY_CRITICAL" and t11_critical:
        print("[PASS] Test 11: Swollen battery correctly identified with CRITICAL safety warning.")
        passed += 1
    else:
        print(f"[FAIL] Test 11: Swollen battery safety test failed: {t11_top}")
        failed += 1

    # TEST 12: Follow-up Question Answer Boost Rerun
    t12_initial = agent.run_diagnosis(DiagnosisRequest(
        device_brand="Apple",
        device_model="iPhone 11",
        symptoms="Phone not charging."
    ))
    
    # Rerun with follow-up answer: FAKE_CHARGING_DETECTED -> boosts Charging IC PMIC
    t12_updated = agent.run_diagnosis(DiagnosisRequest(
        device_brand="Apple",
        device_model="iPhone 11",
        symptoms="Phone not charging.",
        follow_up_answers={"Q_CHARGER_DETECTION_STATE": "FAKE_CHARGING_DETECTED"}
    ))
    
    t12_top = t12_updated["hypotheses"][0]["id"]
    if t12_top == "CHARGING_IC_PMIC_CIRCUIT_FAULT":
        print(f"[PASS] Test 12: Follow-up answer dynamically boosted Charging IC PMIC to top rank.")
        passed += 1
    else:
        print(f"[FAIL] Test 12: Follow-up boost did not promote Charging IC PMIC: {t12_top}")
        failed += 1

    print("\n==================================================")
    print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED (TOTAL: {passed + failed})")
    print("==================================================")

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_all_tests()
