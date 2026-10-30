import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.engine.seed_data import seed_scenario_catalog

# In-memory SQLite database isolated per test session
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        seed_scenario_catalog(db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provides a transactional database session rolled back after each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection, join_transaction_mode="create_savepoint")

    yield session

    session.close()
    if transaction.is_active:
        transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """FastAPI TestClient with overridden database dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


from app.ai.interface import (
    BaseAIProvider,
    AIReadinessStatus,
    AIReadinessResult,
    DialoguePromptContext,
    DialogueGenerationResult,
    VisualEvidenceResult,
)
from app.ai.factory import set_ai_provider
from app.ai.exceptions import AIConnectionError, AIModelNotFoundError


class MockAIProvider(BaseAIProvider):
    """Deterministic mock provider for unit tests."""

    def __init__(
        self,
        canned_dialogue: str = "The shadows stir within Blackwood Manor. The truth remains buried.",
        emotional_cue: str = "Guarded",
        atmospheric_effect: str = "Candle flame flickers blue",
        is_ready: bool = True,
        simulate_error: Exception = None,
    ):
        self.canned_dialogue = canned_dialogue
        self.emotional_cue = emotional_cue
        self.atmospheric_effect = atmospheric_effect
        self.is_ready = is_ready
        self.simulate_error = simulate_error
        self.calls = []

    async def check_readiness(self) -> AIReadinessResult:
        if self.simulate_error:
            if isinstance(self.simulate_error, AIConnectionError):
                return AIReadinessResult(
                    status=AIReadinessStatus.OLLAMA_UNREACHABLE,
                    backend_available=True,
                    ollama_reachable=False,
                    ollama_connected=False,
                    configured_text_model="mock-qwen3:4b",
                    text_model_available=False,
                    vision_model="mock-qwen3-vl:8b",
                    vision_model_available=False,
                    message="Ollama server unreachable. Start local Ollama server.",
                    actionable_message=self.simulate_error.actionable_message,
                    error=self.simulate_error.message,
                )
            elif isinstance(self.simulate_error, AIModelNotFoundError):
                return AIReadinessResult(
                    status=AIReadinessStatus.MODEL_MISSING,
                    backend_available=True,
                    ollama_reachable=True,
                    ollama_connected=True,
                    configured_model=self.simulate_error.model_name,
                    configured_text_model=self.simulate_error.model_name,
                    model_available=False,
                    text_model_available=False,
                    vision_model="mock-qwen3-vl:8b",
                    vision_model_available=False,
                    message=f"Model '{self.simulate_error.model_name}' not installed.",
                    actionable_message=self.simulate_error.actionable_message,
                    error=self.simulate_error.message,
                )
        return AIReadinessResult(
            status=AIReadinessStatus.HEALTHY if self.is_ready else AIReadinessStatus.OLLAMA_UNREACHABLE,
            backend_available=True,
            ollama_reachable=self.is_ready,
            ollama_connected=self.is_ready,
            configured_model="mock-qwen3:4b",
            configured_text_model="mock-qwen3:4b",
            model_available=self.is_ready,
            text_model_available=self.is_ready,
            vision_model="mock-qwen3-vl:8b",
            vision_model_available=self.is_ready,
            message="Mock AI provider ready and operational.",
            inference_ready=self.is_ready,
            available_models=["mock-qwen3:4b", "mock-qwen3-vl:8b"],
            latency_ms=5,
        )

    async def analyze_visual_evidence(
        self, image_bytes: bytes, mime_type: str = "image/jpeg", prompt: str = None
    ) -> VisualEvidenceResult:
        return VisualEvidenceResult(
            observation="A spectral haze clings to an antique Victorian pendulum clock.",
            visual_clues=["pendulum clock stopped at 12:00", "residue on brass face"],
            model_used="mock-qwen3-vl:8b",
            disclaimer="Visual observations are subjective atmospheric impressions and do not alter authoritative case state.",
        )

    async def generate_dialogue(self, context: DialoguePromptContext) -> DialogueGenerationResult:
        if self.simulate_error:
            raise self.simulate_error

        self.calls.append(context)

        # Contextual response
        if context.character_id in ["char_eleanor", "char_apparition"]:
            first_fact = context.whitelisted_known_facts[0] if context.whitelisted_known_facts else "darkness claimed my vision"
            text = f"The cold in the library was sudden... The cordial tasted of burning copper. I remember {first_fact}."
            cue = "Restless"
            atmo = "Frost gathers upon the mirror frame"
        elif context.character_id == "char_caretaker":
            first_fact = context.whitelisted_known_facts[0] if context.whitelisted_known_facts else "I saw nothing irregular."
            text = f"I keep this estate in order. {first_fact}"
            cue = "Guarded"
            atmo = "Arthur clutches his iron keyring"
        elif context.character_id == "char_daughter":
            first_fact = context.whitelisted_known_facts[0] if context.whitelisted_known_facts else "Julian was frantic about money."
            text = f"Mother's affairs were complicated. {first_fact}"
            cue = "Anxious"
            atmo = None
        else:
            text = self.canned_dialogue
            cue = self.emotional_cue
            atmo = self.atmospheric_effect

        return DialogueGenerationResult(
            dialogue_text=text,
            emotional_cue=cue,
            atmospheric_effect=atmo,
            model_used="mock-qwen3:4b",
            latency_ms=5,
        )


@pytest.fixture(autouse=True)
def mock_ai_environment():
    """Sets a deterministic mock AI provider for all test runs."""
    mock_prov = MockAIProvider()
    set_ai_provider(mock_prov)
    yield mock_prov
    set_ai_provider(None)

