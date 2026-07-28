"""
sample_claims.py — Mock healthcare claims data

Three sample claims:
  CLM-001  Well-formed, active member, covered procedure  -> passes all stages
  CLM-002  Inactive member                                -> validation fails
  CLM-003  Well-formed, active member, covered procedure  -> passes all stages

All data is fictional (synthetic member IDs M-501/M-777, CPT codes from a
tiny test set) — no PHI, no real medical records.
"""

CLAIMS = [
    {
        "claim_id": "CLM-001",
        "member_id": "M-501",
        "member_active": True,
        "procedure_code": "CPT-99213",
        "diagnosis": "Upper respiratory infection",
        "amount": 150.00,
        "provider": "Dr. Smith, Springfield Clinic",
        "date_of_service": "2025-03-15",
    },
    {
        "claim_id": "CLM-002",
        "member_id": "M-777",
        "member_active": False,
        "procedure_code": "CPT-99214",
        "diagnosis": "Follow-up visit, chronic condition",
        "amount": 250.00,
        "provider": "Dr. Jones, Capital Health",
        "date_of_service": "2025-03-18",
    },
    {
        "claim_id": "CLM-003",
        "member_id": "M-501",
        "member_active": True,
        "procedure_code": "CPT-99211",
        "diagnosis": "Routine check-up",
        "amount": 75.00,
        "provider": "Dr. Smith, Springfield Clinic",
        "date_of_service": "2025-04-01",
    },
]

COVERED_PROCEDURES = {"CPT-99211", "CPT-99212", "CPT-99213", "CPT-99214", "CPT-99215"}
