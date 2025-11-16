import argparse
import logging
import sys

import uvicorn

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
    )
    logger = logging.getLogger("server")

    parser = argparse.ArgumentParser(description="Run the FastAPI server")
    parser.add_argument(
        "--port", type=int, required=True, help="Port number to run the server on"
    )
    parser.add_argument(
        "--reload", type=str, default="false", help="Reload the server on code changes"
    )
    args = parser.parse_args()
    reload = args.reload == "true"

    try:
        uvicorn.run(
            "api.main:app",
            host="0.0.0.0",
            port=args.port,
            log_level="info",
            reload=reload,
        )
    except Exception as exc:  # broad catch to avoid crashing without context
        logger.exception("Failed to start FastAPI server: %s", exc)
        sys.exit(1)
