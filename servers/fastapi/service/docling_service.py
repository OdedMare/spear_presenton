import os
import ssl
from common.logger import logger
from docling.document_converter import DocumentConverter

# Singleton instance to prevent multiple model loads and out-of-memory errors
_docling_converter = None

def get_docling_converter():
    """
    Get the global Docling DocumentConverter singleton instance.
    Loads models on first call.
    """
    global _docling_converter
    if _docling_converter is None:
        logger.info("Initializing Docling DocumentConverter singleton...")
        # Disable SSL verification for model downloads as per previous fixes
        ssl._create_default_https_context = ssl._create_unverified_context
        _docling_converter = DocumentConverter()
        logger.info("Docling DocumentConverter initialized.")
    return _docling_converter

class DoclingService:
    """
    Service for document conversion using Docling.
    Uses a singleton converter to preserve memory.
    """
    def __init__(self):
        self.converter = get_docling_converter()

    def parse_to_markdown(self, file_path: str) -> str:
        """
        Convert any supported document to markdown.
        """
        try:
            logger.info(f"Converting document to markdown: {file_path}")
            result = self.converter.convert(file_path)
            # Access the exported markdown content
            return result.document.export_to_markdown()
        except Exception as e:
            logger.error(f"Docling conversion failed for {file_path}: {e}")
            return f"Error converting document: {str(e)}"
