from datetime import datetime, timezone
from typing import Generic, Optional, TypeVar, Dict, Any
from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[ApiErrorDetail] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @classmethod
    def ok(cls, data: T) -> "ApiResponse[T]":
        return cls(success=True, data=data, error=None)

    @classmethod
    def fail(cls, code: str, message: str, details: Optional[Dict[str, Any]] = None) -> "ApiResponse[T]":
        return cls(
            success=False,
            data=None,
            error=ApiErrorDetail(code=code, message=message, details=details),
        )
