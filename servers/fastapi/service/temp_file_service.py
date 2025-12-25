import os
import shutil
import tempfile
import uuid
from typing import Optional
from common.logger import logger
from utils.config.env_config import get_app_data_directory_env

class TempFileService:
    """
    Service for managing temporary files and directories.
    Ensures cleanup and proper storage in the app data directory.
    """
    def __init__(self):
        self.base_dir = os.path.join(get_app_data_directory_env(), "temp")
        os.makedirs(self.base_dir, exist_ok=True)

    def create_temp_dir(self, suffix: str = "") -> str:
        """Create a new temporary directory."""
        dir_name = f"tmp_{uuid.uuid4()}{suffix}"
        path = os.path.join(self.base_dir, dir_name)
        os.makedirs(path, exist_ok=True)
        return path

    def create_temp_file_path(self, filename: str, temp_dir: Optional[str] = None) -> str:
        """Get a path for a temporary file."""
        if not temp_dir:
            temp_dir = self.create_temp_dir()
        return os.path.join(temp_dir, filename)

    def cleanup_temp_dir(self, path: str):
        """Delete a temporary directory and its contents."""
        try:
            if os.path.exists(path) and path.startswith(self.base_dir):
                shutil.rmtree(path)
                logger.debug(f"Cleaned up temp dir: {path}")
        except Exception as e:
            logger.error(f"Failed to cleanup temp dir {path}: {e}")

# Singleton instance
TEMP_FILE_SERVICE = TempFileService()
