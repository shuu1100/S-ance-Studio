from typing import Optional
from sqlalchemy.orm import Session
from app.models.session import InvestigationSession
from app.models.ending import EndingRecord
from app.models.clue import ClueDefinition
from app.schemas.ending import AccusationPayload, EndingOutcomeResponse, EndingEvidenceItem
from app.engine.game_state_service import GameStateService


def evaluate_verdict(
    db: Session,
    session: InvestigationSession,
    payload: AccusationPayload,
) -> EndingOutcomeResponse:
    """Evaluate formal accusation matrix against authoritative case truth."""
    scenario = GameStateService.load_scenario(session.scenario_id)

    # Check if already completed and record exists
    if session.ending_record:
        rec = session.ending_record
        return EndingOutcomeResponse(
            id=rec.ending_id,
            title=f"Case Verdict: {rec.verdict_type.replace('_', ' ').title()}",
            subtitle="Investigation Concluded",
            verdict_type=rec.verdict_type,
            culprit_named=rec.culprit_named,
            narrative=rec.final_summary,
            evidence_summary=[],
            influential_decisions=rec.influential_decisions or [],
            sanity_score=rec.sanity_score,
            turns_taken=rec.turns_taken,
            rating=rec.rating,
        )

    # Deterministically calculate unlocked ending outcome
    ending_asset = GameStateService.calculate_unlocked_endings(session, payload, scenario)

    culprit_named = (
        "Lord Julian Blackwood"
        if ("julian" in payload.suspect_id.lower())
        else payload.suspect_id or "Unknown Suspect"
    )
    if ending_asset.id == "END_SPECTRAL_WRATH" and session.player_sanity <= 0:
        culprit_named = "None (Investigator Succumbed to Madness)"

    # Build evidence summary
    evidence_items = []
    for cid in payload.supporting_clue_ids:
        clue_def = db.query(ClueDefinition).filter_by(id=cid).first()
        if clue_def:
            evidence_items.append(
                EndingEvidenceItem(
                    clue_id=clue_def.id,
                    title=clue_def.title,
                    significance=clue_def.source,
                    verified=True,
                )
            )

    # Decisions influencing ending
    influential_decisions = [
        f"Delivered formal accusation naming {culprit_named} at turn {session.turn_counter}."
    ]
    if ending_asset.id == "END_TRUE_RESTITUTION":
        influential_decisions.append(
            "Confronted Julian with the silver flask, tampered clockwork, and crypt poison ledger."
        )
    elif ending_asset.id == "END_TRAGIC_COVERUP":
        influential_decisions.append(
            "Accused Julian prematurely without securing the poison ledger or complete witness testimony."
        )
    else:
        influential_decisions.append(
            "Condemned an innocent party, triggering supernatural retaliation."
        )

    # Update session
    session.status = "completed"
    session.ending_id = ending_asset.id

    # Create ending record
    ending_record = EndingRecord(
        session_id=session.id,
        ending_id=ending_asset.id,
        verdict_type=ending_asset.verdict_type,
        culprit_named=culprit_named,
        final_summary=ending_asset.narrative,
        sanity_score=session.player_sanity,
        turns_taken=session.turn_counter,
        rating=ending_asset.rating,
        influential_decisions=influential_decisions,
    )
    db.add(ending_record)
    db.flush()

    return EndingOutcomeResponse(
        id=ending_asset.id,
        title=ending_asset.title,
        subtitle=ending_asset.subtitle,
        verdict_type=ending_asset.verdict_type,
        culprit_named=culprit_named,
        narrative=ending_asset.narrative,
        epilogue=getattr(ending_asset, "epilogue", None),
        evidence_summary=evidence_items,
        influential_decisions=influential_decisions,
        sanity_score=session.player_sanity,
        turns_taken=session.turn_counter,
        rating=ending_asset.rating,
    )
