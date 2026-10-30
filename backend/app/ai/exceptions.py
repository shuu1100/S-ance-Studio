class AIProviderError(Exception):
    """Base exception for all AI provider operations."""
    def __init__(self, message: str, error_type: str = "ai_error", actionable_message: str = ""):
        super().__init__(message)
        self.message = message
        self.error_type = error_type
        self.actionable_message = actionable_message or message


class AIConnectionError(AIProviderError):
    """Raised when the local Ollama server is unreachable or refuses connection."""
    def __init__(self, endpoint: str, detail: str = ""):
        msg = f"Local Ollama server unreachable at {endpoint}."
        if detail:
            msg += f" Details: {detail}"
        action = f"Verify that Ollama is installed and running on your system ('ollama serve' or start the Ollama desktop app at {endpoint})."
        super().__init__(msg, error_type="connection_refused", actionable_message=action)
        self.endpoint = endpoint


class AIModelNotFoundError(AIProviderError):
    """Raised when the configured model is not installed or available on the local Ollama instance."""
    def __init__(self, model_name: str, available_models: list = None):
        avail_str = f" Available models: {', '.join(available_models)}" if available_models else " No models currently installed."
        msg = f"Configured model '{model_name}' is not installed in local Ollama.{avail_str}"
        action = f"Install the model locally by running 'ollama pull {model_name}' or set OLLAMA_MODEL in your .env to an installed model."
        super().__init__(msg, error_type="model_not_found", actionable_message=action)
        self.model_name = model_name
        self.available_models = available_models or []


class AITimeoutError(AIProviderError):
    """Raised when local inference exceeds the configured timeout."""
    def __init__(self, timeout_seconds: float, model_name: str = ""):
        msg = f"Local inference timed out after {timeout_seconds}s" + (f" on model '{model_name}'." if model_name else ".")
        action = "The local model took too long to respond. The system may be under heavy load or cold-loading the model into memory. Please retry your inquiry."
        super().__init__(msg, error_type="timeout", actionable_message=action)
        self.timeout_seconds = timeout_seconds


class AIResponseError(AIProviderError):
    """Raised when the provider produces empty, corrupt, or unparseable output."""
    def __init__(self, detail: str):
        msg = f"Local AI provider returned invalid or unparseable response: {detail}"
        action = "The local model output could not be formatted into dialogue. Please retry your inquiry."
        super().__init__(msg, error_type="invalid_response", actionable_message=action)


class AIInputValidationError(AIProviderError):
    """Raised when input text violates bounds or constraints (e.g. oversized input)."""
    def __init__(self, detail: str):
        msg = f"Input validation rejected: {detail}"
        action = "Please shorten your inquiry or remove invalid characters."
        super().__init__(msg, error_type="input_validation", actionable_message=action)
