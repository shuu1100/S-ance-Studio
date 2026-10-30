from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
from app.models.session import InvestigationSession
from app.models.character import CharacterRelationshipState
from app.schemas.scenario_schema import ScenarioAsset
from app.schemas.inquiry import (
    SuggestedQuestionItem,
    SuggestedQuestionsResponse,
    TopicResponse,
    TheoryPayload,
    TheoryResponse,
)
from app.engine.game_state_service import GameStateService


class InquiryService:
    """Provides dynamic suggested inquiries, topic investigation, and theory validation."""

    @classmethod
    def get_suggested_questions(
        cls,
        session: InvestigationSession,
        character_id: str,
        scenario: ScenarioAsset,
        db: Session,
        active_topic_id: Optional[str] = None,
    ) -> SuggestedQuestionsResponse:
        """Generate 5-8 dynamic, contextual suggested questions based on discovered clues and trust."""
        rel_state = (
            db.query(CharacterRelationshipState)
            .filter_by(session_id=session.id, character_id=character_id)
            .first()
        )
        current_trust = rel_state.trust_score if rel_state else 40
        discovered_ids = {c.clue_id for c in session.discovered_clues}

        char_asset = next((c for c in scenario.characters if c.id == character_id), None)
        char_name = char_asset.name if char_asset else "Witness"

        questions: List[SuggestedQuestionItem] = []

        # Arthur Briggs (Caretaker) suggested inquiries
        if character_id == "char_caretaker":
            # Baseline question 1
            questions.append(
                SuggestedQuestionItem(
                    id="q_art_1",
                    text="What exactly occurred when the clock struck thirteen at midnight?",
                    topic_id="thirteenth_chime",
                    topic_label="The Thirteenth Chime",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=True,
                    context_hint="Arthur noticed the mechanical anomaly immediately.",
                )
            )
            # Baseline question 2
            questions.append(
                SuggestedQuestionItem(
                    id="q_art_2",
                    text="Who arrived at Blackwood Manor on the night of Eleanor's death?",
                    topic_id="alibis",
                    topic_label="Suspect Movements",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=True,
                    context_hint="Arthur monitors the estate gates and main doors.",
                )
            )
            # Question 3: clock escapement
            q3_unlocked = "clue_thirteenth_chime" in discovered_ids or current_trust >= 45
            questions.append(
                SuggestedQuestionItem(
                    id="q_art_3",
                    text="Why do the teeth on the astronomical clock escapement look freshly filed down?",
                    topic_id="clock",
                    topic_label="Clockwork Mechanism",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=q3_unlocked,
                    context_hint="Unlocked by examining the clock mechanism or high trust." if not q3_unlocked else None,
                )
            )
            # Question 4: conservatory potting bench
            q4_unlocked = current_trust >= 50 or "clue_arsenic_vial" in discovered_ids
            questions.append(
                SuggestedQuestionItem(
                    id="q_art_4",
                    text="Was any chemical or rodent poison removed from your conservatory potting bench?",
                    topic_id="poison",
                    topic_label="Poison & Cordial",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=q4_unlocked,
                    context_hint="Arthur requires at least 50% trust to discuss potting bench supplies." if not q4_unlocked else None,
                )
            )
            # Question 5: study lock & access
            questions.append(
                SuggestedQuestionItem(
                    id="q_art_5",
                    text="Could anyone have unlocked the study door without Eleanor's brass key?",
                    topic_id="death",
                    topic_label="Death Circumstances",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=True,
                    context_hint="Arthur holds the master estate keys.",
                )
            )
            # Question 6: Julian's visit
            q6_unlocked = current_trust >= 45 or "clue_burned_will" in discovered_ids
            questions.append(
                SuggestedQuestionItem(
                    id="q_art_6",
                    text="What was Lord Julian holding in his pockets when he arrived at the front door?",
                    topic_id="contradictions",
                    topic_label="Witness Contradictions",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=q6_unlocked,
                    context_hint="Requires 45% trust or discovering the burned will fragment." if not q6_unlocked else None,
                )
            )
            # Question 7: crypt access
            q7_unlocked = "clue_torn_velvet" in discovered_ids or current_trust >= 60
            questions.append(
                SuggestedQuestionItem(
                    id="q_art_7",
                    text="Who has access to the family wine vaults and crypt behind the cellar?",
                    topic_id="physical_evidence",
                    topic_label="Physical Evidence",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=q7_unlocked,
                    context_hint="Unlocked by discovering the crimson velvet shred." if not q7_unlocked else None,
                )
            )

        # Victoria Blackwood (Daughter) suggested inquiries
        elif character_id == "char_daughter":
            questions.append(
                SuggestedQuestionItem(
                    id="q_vic_1",
                    text="How was your relationship with your mother in the days before her death?",
                    topic_id="relationships",
                    topic_label="Family Feuds",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=True,
                    context_hint="Victoria was Eleanor's only surviving resident daughter.",
                )
            )
            questions.append(
                SuggestedQuestionItem(
                    id="q_vic_2",
                    text="What did Lady Eleanor drink before retiring to the library on her final night?",
                    topic_id="poison",
                    topic_label="Poison & Cordial",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=True,
                    context_hint="Victoria frequently brought her mother evening teas.",
                )
            )
            q_vic_3_unlocked = "clue_burned_will" in discovered_ids or current_trust >= 50
            questions.append(
                SuggestedQuestionItem(
                    id="q_vic_3",
                    text="Did your mother speak of altering her will to disinherit Lord Julian?",
                    topic_id="will",
                    topic_label="Disinheritance & Will",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=q_vic_3_unlocked,
                    context_hint="Requires discovering the burned will fragment." if not q_vic_3_unlocked else None,
                )
            )
            q_vic_4_unlocked = "clue_torn_velvet" in discovered_ids or current_trust >= 55
            questions.append(
                SuggestedQuestionItem(
                    id="q_vic_4",
                    text="Whose crimson velvet cloak or jacket was torn on the conservatory window catch?",
                    topic_id="physical_evidence",
                    topic_label="Physical Evidence",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=q_vic_4_unlocked,
                    context_hint="Unlocked after discovering the torn velvet shred." if not q_vic_4_unlocked else None,
                )
            )
            q_vic_5_unlocked = current_trust >= 55
            questions.append(
                SuggestedQuestionItem(
                    id="q_vic_5",
                    text="Did Lord Julian ask you for a key to the cellar vaults when he fled the manor?",
                    topic_id="alibis",
                    topic_label="Suspect Movements",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=q_vic_5_unlocked,
                    context_hint="Victoria requires 55% trust to reveal private family secrets." if not q_vic_5_unlocked else None,
                )
            )
            questions.append(
                SuggestedQuestionItem(
                    id="q_vic_6",
                    text="Why did you invite Madame Vane to hold a séance on that particular evening?",
                    topic_id="supernatural_events",
                    topic_label="Séance & Occult",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=True,
                    context_hint="Victoria arranged the spiritualist gathering.",
                )
            )
            q_vic_7_unlocked = "clue_crypt_journal" in discovered_ids
            questions.append(
                SuggestedQuestionItem(
                    id="q_vic_7",
                    text="Were you aware Julian kept forged codicils hidden behind the crypt barrel racks?",
                    topic_id="contradictions",
                    topic_label="Witness Contradictions",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=q_vic_7_unlocked,
                    context_hint="Unlocked by recovering Julian's poison ledger from the crypt." if not q_vic_7_unlocked else None,
                )
            )

        # Lady Eleanor's Apparition suggested inquiries
        else:
            questions.append(
                SuggestedQuestionItem(
                    id="q_ele_1",
                    text="What do you recall of the moment the grandfather clock struck thirteen?",
                    topic_id="thirteenth_chime",
                    topic_label="The Thirteenth Chime",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=True,
                    context_hint="The spirit's memory is anchored to the thirteenth strike.",
                )
            )
            questions.append(
                SuggestedQuestionItem(
                    id="q_ele_2",
                    text="Who handed you the silver valerian cordial flask before you retired to the library?",
                    topic_id="poison",
                    topic_label="Poison & Cordial",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=True,
                    context_hint="The poison bittered Eleanor's final draught.",
                )
            )
            q_ele_3_unlocked = "clue_burned_will" in discovered_ids or current_trust >= 50
            questions.append(
                SuggestedQuestionItem(
                    id="q_ele_3",
                    text="Did someone burn the codicil in your hearth while you lay dying?",
                    topic_id="will",
                    topic_label="Disinheritance & Will",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=q_ele_3_unlocked,
                    context_hint="Unlocked by finding the charred will in the hearth." if not q_ele_3_unlocked else None,
                )
            )
            q_ele_4_unlocked = "clue_thirteenth_chime" in discovered_ids or current_trust >= 60
            questions.append(
                SuggestedQuestionItem(
                    id="q_ele_4",
                    text="Was the thirteenth chime intended to drown out your cries for assistance?",
                    topic_id="death",
                    topic_label="Death Circumstances",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=q_ele_4_unlocked,
                    context_hint="Eleanor remembers suffocating under the chime's toll." if not q_ele_4_unlocked else None,
                )
            )
            q_ele_5_unlocked = "clue_torn_velvet" in discovered_ids or current_trust >= 55
            questions.append(
                SuggestedQuestionItem(
                    id="q_ele_5",
                    text="Did a figure in crimson velvet linger over your desk before escaping through the window?",
                    topic_id="physical_evidence",
                    topic_label="Physical Evidence",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=q_ele_5_unlocked,
                    context_hint="Unlocked by discovering the torn velvet shred." if not q_ele_5_unlocked else None,
                )
            )
            questions.append(
                SuggestedQuestionItem(
                    id="q_ele_6",
                    text="What occult presence prevents your unquiet soul from crossing to the beyond?",
                    topic_id="supernatural_events",
                    topic_label="Séance & Occult",
                    character_id=character_id,
                    confidence_cost=0,
                    unlocked=True,
                    context_hint="Eleanor's soul remains tethered by murder and deceit.",
                )
            )

        # Filter by active_topic_id if provided
        if active_topic_id:
            filtered = [q for q in questions if q.topic_id == active_topic_id]
            if filtered:
                questions = filtered

        return SuggestedQuestionsResponse(
            character_id=character_id,
            character_name=char_name,
            trust_level=current_trust,
            active_topic=active_topic_id,
            questions=questions,
        )

    @classmethod
    def get_investigation_topics(
        cls,
        session: InvestigationSession,
        character_id: Optional[str],
        scenario: ScenarioAsset,
        db: Session,
    ) -> List[TopicResponse]:
        """Compute unlocked status, relevant facts, discovered clues, and questions for all 10 topics."""
        discovered_ids = {c.clue_id for c in session.discovered_clues}
        
        # Get character trust if specific character selected
        char_trust = 40
        if character_id:
            rel = (
                db.query(CharacterRelationshipState)
                .filter_by(session_id=session.id, character_id=character_id)
                .first()
            )
            if rel:
                char_trust = rel.trust_score

        topic_responses: List[TopicResponse] = []

        for topic in scenario.investigation_topics:
            # Check requirements
            req_clues_met = all(cid in discovered_ids for cid in topic.required_clue_ids)
            trust_met = char_trust >= topic.min_trust
            is_unlocked = req_clues_met and trust_met

            # Collect discovered clues matching topic
            matched_clues = []
            for cid in topic.relevant_clue_ids:
                if cid in discovered_ids:
                    clue_asset = next((c for c in scenario.clues if c.id == cid), None)
                    if clue_asset:
                        matched_clues.append({
                            "id": clue_asset.id,
                            "title": clue_asset.title,
                            "category": clue_asset.category,
                            "evidence_marker": clue_asset.evidence_marker,
                        })

            topic_responses.append(
                TopicResponse(
                    id=topic.id,
                    title=topic.title,
                    description=topic.description,
                    category=topic.category,
                    is_unlocked=is_unlocked,
                    relevant_facts=topic.known_facts,
                    discovered_clues=matched_clues,
                    available_questions=topic.suggested_questions if is_unlocked else [],
                    unresolved_lead=topic.unresolved_lead,
                )
            )

        return topic_responses

    @classmethod
    def evaluate_theory(
        cls,
        session: InvestigationSession,
        payload: TheoryPayload,
        scenario: ScenarioAsset,
        db: Session,
    ) -> TheoryResponse:
        """Formulate and validate theory consistency against discovered evidence and truth."""
        discovered_ids = {c.clue_id for c in session.discovered_clues}
        strengths: List[str] = []
        vulnerabilities: List[str] = []
        contradictions_detected: List[str] = []

        is_julian = payload.suspect_id == "char_julian"
        has_flask = payload.weapon_clue_id == "clue_silver_flask"
        has_will = payload.motive_clue_id == "clue_burned_will"

        if is_julian:
            strengths.append("Lord Julian had immense financial pressure and was present at the manor before midnight.")
        elif payload.suspect_id == "char_caretaker":
            contradictions_detected.append("Arthur Briggs has maintained the manor for 35 years and gains nothing from Eleanor's death.")
            vulnerabilities.append("Arthur lacked motive and actively guarded the crime scene.")
        elif payload.suspect_id == "char_daughter":
            contradictions_detected.append("Victoria was participating in the recorded séance in the parlor during the chiming.")
            vulnerabilities.append("Victoria was devastated by her mother's death and receives her legal inheritance regardless.")

        if has_flask:
            if "clue_silver_flask" in discovered_ids:
                strengths.append("The silver valerian flask exhibits chemical arsenic residue matching the lethal dose.")
            else:
                vulnerabilities.append("The silver flask has not been forensically recovered from the crime scene yet.")
        else:
            contradictions_detected.append(f"The weapon '{payload.weapon_clue_id}' does not match autopsy cyanosis findings.")

        if has_will:
            if "clue_burned_will" in discovered_ids:
                strengths.append("The charred will fragment establishes that Julian was disinherited over £8,500 gambling debts.")
            else:
                vulnerabilities.append("The will motive is speculative until the burned codicil is recovered from the grate.")
        else:
            vulnerabilities.append("Proposed motive lacks corroborating documentary evidence.")

        # Supporting clues check
        supporting_count = 0
        for cid in payload.supporting_clue_ids:
            if cid in discovered_ids:
                supporting_count += 1
                if cid == "clue_thirteenth_chime":
                    strengths.append("Tampered clock escapement confirms deliberate horological subterfuge.")
                elif cid == "clue_arsenic_vial":
                    strengths.append("The stolen potting bench amber vial establishes where the killer obtained arsenic.")
                elif cid == "clue_torn_velvet":
                    strengths.append("Torn crimson velvet proves physical departure through the conservatory window.")
                elif cid == "clue_crypt_journal":
                    strengths.append("The crypt poison ledger provides irrefutable proof of premeditated homicide.")
            else:
                vulnerabilities.append(f"Supporting clue '{cid}' has not been discovered in the investigation.")

        # Compute status and consistency score
        score = 0
        if is_julian:
            score += 35
        if has_flask and "clue_silver_flask" in discovered_ids:
            score += 25
        if has_will and "clue_burned_will" in discovered_ids:
            score += 20
        score += min(20, supporting_count * 5)
        score = max(5, min(100, score - len(contradictions_detected) * 20))

        if contradictions_detected:
            status = "contradicted"
            readiness = "Flawed Hypothesis: Contradicted by known alibis and forensic facts."
        elif score >= 75 and "clue_crypt_journal" in discovered_ids:
            status = "supported"
            readiness = "Ready for Inquest Verdict: S-Rank Solvability Established."
        elif score >= 50:
            status = "supported"
            readiness = "Partially Supported: Circumstantial evidence strong, but decisive proof needed."
        else:
            status = "unsupported"
            readiness = "Unsupported Hypothesis: Requires further physical evidence and testimony."

        return TheoryResponse(
            status=status,
            consistency_score=score,
            strengths=strengths,
            vulnerabilities=vulnerabilities,
            contradictions_detected=contradictions_detected,
            verdict_readiness=readiness,
        )
