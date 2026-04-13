from pydantic import BaseModel, ConfigDict


class ErrorBody(BaseModel):
    code: str
    message: str
    details: dict | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
