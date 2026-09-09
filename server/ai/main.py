"""
Main Entry Point for the Zapate Hybrid AI Diagnosis Engine.

Responsibility:
1. Receive JSON input (via command-line arguments or stdin)
2. Call the diagnosis agent
3. Print the resulting diagnosis as JSON to stdout

How it works:
Input (JSON)
    ↓
agent.run_diagnosis(input_data)
    ↓
Output (JSON to stdout)
"""

import sys
import json
import os

# Ensure current directory is in Python module search path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from diagnosis_agent import DiagnosisAgent
from schemas import DiagnosisRequest

def main():
    agent = DiagnosisAgent()

    # Mode 1: Quick Demo / Test flag
    if len(sys.argv) > 1 and sys.argv[1] in ["--test", "--demo"]:
        demo_req = DiagnosisRequest(
            device_brand="Samsung",
            device_model="Galaxy S22 Ultra",
            symptoms="Phone fell down on concrete. Display is completely black but phone vibrates when connecting charger.",
            confirmed_symptoms=[],
            follow_up_answers={},
            historical_cases=[
                {
                    "number": "RF-2401",
                    "device": {"brand": "Samsung", "model": "Galaxy S22 Ultra"},
                    "issue": "Dropped on floor, screen black",
                    "diagnosisNotes": "Replaced OEM Dynamic AMOLED screen assembly",
                    "status": "Delivered",
                    "parts": [{"name": "Samsung Galaxy S22 Ultra OLED Screen Assembly"}],
                    "finalAmount": 7500
                }
            ]
        )
        result = agent.run_diagnosis(demo_req)
        print(json.dumps(result, indent=2))
        return

    # Mode 2: Read JSON from file argument or stdin (from Node.js backend)
    input_data = ""
    if len(sys.argv) > 1 and os.path.isfile(sys.argv[1]):
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            input_data = f.read()
    else:
        input_data = sys.stdin.read()

    # If no input provided, run empty diagnosis
    if not input_data or not input_data.strip():
        result = agent.run_diagnosis(DiagnosisRequest())
        print(json.dumps(result))
        return

    try:
        # Parse incoming JSON
        parsed = json.loads(input_data)
        req = DiagnosisRequest(
            shop_id=parsed.get("shopId") or parsed.get("shop_id"),
            repair_job_id=parsed.get("repairJobId") or parsed.get("repair_job_id"),
            device_brand=parsed.get("deviceBrand") or parsed.get("device_brand") or parsed.get("brand", ""),
            device_model=parsed.get("deviceModel") or parsed.get("device_model") or parsed.get("model", ""),
            symptoms=parsed.get("symptoms", ""),
            confirmed_symptoms=parsed.get("confirmedSymptoms") or parsed.get("confirmed_symptoms") or [],
            follow_up_answers=parsed.get("followUpAnswers") or parsed.get("follow_up_answers") or {},
            historical_cases=parsed.get("historicalCases") or parsed.get("historical_cases") or [],
            inventory_parts=parsed.get("inventoryParts") or parsed.get("inventory_parts") or []
        )
        
        # Run diagnosis and print result JSON
        result = agent.run_diagnosis(req)
        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        error_resp = {
            "status": "error",
            "message": f"Diagnosis Engine Execution Error: {str(e)}",
            "diagnosticConfidence": {"level": "LOW", "score": 0},
            "hypotheses": [],
            "warnings": [{
                "severity": "DANGER",
                "title": "Diagnosis Engine Runtime Error",
                "message": str(e),
                "action_required": "Check Python environment or payload format."
            }]
        }
        print(json.dumps(error_resp), file=sys.stderr)
        print(json.dumps(error_resp))

if __name__ == "__main__":
    main()
