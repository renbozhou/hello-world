from fastapi import HTTPException, status


def bad_request(message: str, details: dict | None = None) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={"error": {"code": "BAD_REQUEST", "message": message, "details": details}},
    )


def not_found(resource: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"error": {"code": "NOT_FOUND", "message": f"{resource} not found", "details": None}},
    )
