import json
import re
from typing import Dict, Any, Tuple, Optional
from app.ai.exceptions import AIResponseError


class OutputSanitizer:
    """Parses, sanitizes, and verifies AI-generated character dialogue."""

    @staticmethod
    def parse_and_sanitize(raw_text: str, forbidden_lore: list = None) -> Tuple[str, str, Optional[str]]:
        """
        Parse raw model output into (dialogue_text, emotional_cue, atmospheric_effect).
        Strips markdown wrappers, extracts JSON, and checks for forbidden lore leaks.
        """
        if not raw_text or not raw_text.strip():
            raise AIResponseError("Model returned empty response text.")

        raw_text = raw_text.strip()
        data: Dict[str, Any] = {}

        # 1. Attempt direct JSON or markdown-wrapped JSON extraction
        json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_text, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass

        if not data:
            # Try parsing entire string as JSON
            try:
                data = json.loads(raw_text)
            except json.JSONDecodeError:
                # Try finding first { and last }
                start = raw_text.find("{")
                end = raw_text.rfind("}")
                if start != -1 and end != -1 and end > start:
                    try:
                        data = json.loads(raw_text[start : end + 1])
                    except json.JSONDecodeError:
                        pass

        # 2. If JSON parsing succeeded, extract fields
        if isinstance(data, dict) and "dialogue" in data:
            dialogue = str(data.get("dialogue", "")).strip()
            emotional_cue = str(data.get("emotional_cue", "Guarded")).strip()
            atmospheric_effect = data.get("atmospheric_effect")
            if atmospheric_effect:
                atmospheric_effect = str(atmospheric_effect).strip()
        else:
            # Fallback regex extraction
            diag_match = re.search(r'"dialogue"\s*:\s*"((?:\\.|[^"\\])*)"', raw_text, re.DOTALL)
            emo_match = re.search(r'"emotional_cue"\s*:\s*"((?:\\.|[^"\\])*)"', raw_text, re.DOTALL)
            atmo_match = re.search(r'"atmospheric_effect"\s*:\s*"((?:\\.|[^"\\])*)"', raw_text, re.DOTALL)

            if diag_match:
                raw_extracted = diag_match.group(1).strip()
                try:
                    dialogue = json.loads(f'"{raw_extracted}"')
                except Exception:
                    dialogue = raw_extracted.replace('\\"', '"').replace('\\n', '\n')
                emotional_cue = emo_match.group(1).strip() if emo_match else "Guarded"
                atmospheric_effect = atmo_match.group(1).strip() if atmo_match else None
            else:
                # If model returned pure text without JSON wrapper
                cleaned = raw_text.strip()
                # Remove thinking blocks if any leaked through
                cleaned = re.sub(r"<think>.*?</think>", "", cleaned, flags=re.DOTALL).strip()
                dialogue = cleaned
                emotional_cue = "Guarded"
                atmospheric_effect = None

        if not dialogue:
            raise AIResponseError("Failed to extract dialogue content from model output.")

        # 3. Clean quotes and whitespace
        dialogue = re.sub(r'^["\']|["\']$', '', dialogue).strip()

        # 4. Check for unrevealed clue ID leakage (e.g. clue_crypt_journal, clue_arsenic_vial)
        dialogue = re.sub(r'\bclue_[a-z0-9_]+\b', '[unsubstantiated rumor]', dialogue, flags=re.IGNORECASE)

        # 5. Check against strictly forbidden lore leaks
        if forbidden_lore:
            for forbidden_item in forbidden_lore:
                cleaned_item = forbidden_item.strip().rstrip(".")
                if not cleaned_item or len(cleaned_item) < 8:
                    continue
                if cleaned_item.lower() in dialogue.lower():
                    dialogue = re.sub(re.escape(cleaned_item), "[redacted testimony]", dialogue, flags=re.IGNORECASE)

        return dialogue, emotional_cue, atmospheric_effect
