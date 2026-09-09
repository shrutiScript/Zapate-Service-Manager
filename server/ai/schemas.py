"""
Data models and schemas for the Hybrid Mobile Repair Diagnosis Engine.

Designed to be simple, clean, and robust for college presentations and viva.
Provides DiagnosisRequest as an easy, flexible container that supports:
- Keyword arguments and dictionary unpacking (**kwargs)
- Property aliases (brand/device_brand, model/device_model)
- Dictionary-style access (req['symptoms'] or req.symptoms)
- Backward compatibility classes for existing imports
"""

class DiagnosisRequest:
    """
    Simple, flexible container for diagnosis input data.
    Accepts both snake_case and camelCase parameters, plus any extra kwargs.
    """
    def __init__(
        self,
        device_brand="",
        device_model="",
        symptoms="",
        confirmed_symptoms=None,
        follow_up_answers=None,
        historical_cases=None,
        inventory_parts=None,
        shop_id=None,
        repair_job_id=None,
        brand="",
        model="",
        **kwargs
    ):
        # Support brand / device_brand aliases
        self.device_brand = device_brand or brand or kwargs.get("deviceBrand", "") or ""
        self.device_model = device_model or model or kwargs.get("deviceModel", "") or ""
        self.brand = self.device_brand
        self.model = self.device_model
        
        # Symptoms text and confirmations
        self.symptoms = symptoms or kwargs.get("reported_symptoms", "") or ""
        self.confirmed_symptoms = confirmed_symptoms if confirmed_symptoms is not None else kwargs.get("confirmedSymptoms", [])
        self.follow_up_answers = follow_up_answers if follow_up_answers is not None else kwargs.get("followUpAnswers", {})
        
        # Historical cases and inventory parts
        self.historical_cases = historical_cases if historical_cases is not None else kwargs.get("historicalCases", [])
        self.inventory_parts = inventory_parts if inventory_parts is not None else kwargs.get("inventoryParts", [])
        
        # IDs
        self.shop_id = shop_id or kwargs.get("shopId")
        self.repair_job_id = repair_job_id or kwargs.get("repairJobId")

        # CamelCase aliases for convenience
        self.deviceBrand = self.device_brand
        self.deviceModel = self.device_model
        self.confirmedSymptoms = self.confirmed_symptoms
        self.followUpAnswers = self.follow_up_answers
        self.historicalCases = self.historical_cases
        self.inventoryParts = self.inventory_parts
        self.shopId = self.shop_id
        self.repairJobId = self.repair_job_id

        # Store any remaining kwargs
        for key, val in kwargs.items():
            if not hasattr(self, key):
                setattr(self, key, val)

    def to_dict(self):
        """Converts the request into a standard Python dictionary."""
        return {
            "device_brand": self.device_brand,
            "device_model": self.device_model,
            "brand": self.device_brand,
            "model": self.device_model,
            "symptoms": self.symptoms,
            "confirmed_symptoms": self.confirmed_symptoms,
            "follow_up_answers": self.follow_up_answers,
            "historical_cases": self.historical_cases,
            "inventory_parts": self.inventory_parts,
            "shop_id": self.shop_id,
            "repair_job_id": self.repair_job_id
        }

    # Support dictionary-style access: req['symptoms']
    def __getitem__(self, item):
        return getattr(self, item, None)

    def get(self, item, default=None):
        return getattr(self, item, default)


# ----------------------------------------------------------------------
# Backward-compatibility classes (prevents import errors in older tests)
# ----------------------------------------------------------------------

class NormalizedSymptom:
    """Standardized symptom representation."""
    def __init__(self, code="", category="GENERAL", severity="MEDIUM", description="", matched_phrase="", confidence=1.0, risk_flags=None):
        self.code = code
        self.category = category
        self.severity = severity
        self.description = description
        self.matched_phrase = matched_phrase
        self.confidence = confidence
        self.risk_flags = risk_flags or []

    def to_dict(self):
        return {
            "code": self.code,
            "category": self.category,
            "severity": self.severity,
            "description": self.description,
            "matched_phrase": self.matched_phrase,
            "confidence": self.confidence,
            "risk_flags": self.risk_flags
        }

    def __getitem__(self, item):
        return getattr(self, item, None)


class Hypothesis:
    """Ranked fault hypothesis representation."""
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
        risk_level="LOW",
        est_bench_minutes_min=20,
        est_bench_minutes_max=45,
        bench_steps=None
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
        self.risk_level = risk_level
        self.est_bench_minutes_min = est_bench_minutes_min
        self.est_bench_minutes_max = est_bench_minutes_max
        self.bench_steps = bench_steps or []

    def to_dict(self):
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

    def __getitem__(self, item):
        return getattr(self, item, None)


class FollowUpQuestion:
    """Follow-up question container."""
    def __init__(self, id="", question="", differentiates=None, options=None, selected_value=None):
        self.id = id
        self.question = question
        self.differentiates = differentiates or []
        self.options = options or []
        self.selected_value = selected_value

    def __getitem__(self, item):
        return getattr(self, item, None)


class FollowUpQuestionOption:
    def __init__(self, label="", value="", evidence_boost=None):
        self.label = label
        self.value = value
        self.evidence_boost = evidence_boost or {}


class SimilarRepairCase:
    def __init__(self, repair_id="", device_brand="", device_model="", reported_symptoms="", confirmed_fault="", repair_action="", parts_used=None, bench_time_minutes=30, total_cost=0.0, similarity_score=0.0):
        self.repair_id = repair_id
        self.device_brand = device_brand
        self.device_model = device_model
        self.reported_symptoms = reported_symptoms
        self.confirmed_fault = confirmed_fault
        self.repair_action = repair_action
        self.parts_used = parts_used or []
        self.bench_time_minutes = bench_time_minutes
        self.total_cost = total_cost
        self.similarity_score = similarity_score


class SimilarRepairsSummary:
    def __init__(self, total_matches=0, average_similarity=0.0, common_successful_repairs=None, average_bench_time_minutes=30, commonly_used_parts=None, cases=None):
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


class SafetyWarning:
    def __init__(self, severity="CAUTION", title="", message="", action_required=""):
        self.severity = severity
        self.title = title
        self.message = message
        self.action_required = action_required


class DiagnosisResponse:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)
