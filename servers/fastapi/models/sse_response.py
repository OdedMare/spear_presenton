import json

from pydantic import BaseModel


class SSEResponse(BaseModel):
    event: str
    data: str

    def to_string(self):
        return f"event: {self.event}\ndata: {self.data}\n\n"


class SSEStatusResponse(BaseModel):
    status: str

    def to_string(self):
        return SSEResponse(
            event="response", data=json.dumps({"type": "status", "status": self.status})
        ).to_string()


class SSEErrorResponse(BaseModel):
    detail: str
    error_code: str = "GENERIC_ERROR"
    suggested_action: str | None = None

    def to_string(self):
        error_data = {
            "type": "error",
            "detail": self.detail,
            "error_code": self.error_code
        }
        if self.suggested_action:
            error_data["suggested_action"] = self.suggested_action
        return SSEResponse(
            event="response", data=json.dumps(error_data)
        ).to_string()


class SSECompleteResponse(BaseModel):
    key: str
    value: object

    def to_string(self):
        return SSEResponse(
            event="response",
            data=json.dumps({"type": "complete", self.key: self.value}),
        ).to_string()
