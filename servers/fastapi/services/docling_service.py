import os
import ssl

# IMPORTANT: Disable SSL verification BEFORE importing docling
# This must happen at module level, not in __init__, because docling
# may download models during import
if os.getenv("DISABLE_SSL_VERIFY", "false").lower() == "true":
    import urllib3
    from urllib3.util import ssl_
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    # Set environment variables for all HTTP libraries
    os.environ["CURL_CA_BUNDLE"] = ""
    os.environ["REQUESTS_CA_BUNDLE"] = ""
    os.environ["SSL_CERT_FILE"] = ""
    os.environ["PYTHONHTTPSVERIFY"] = "0"

    # Disable SSL verification globally
    ssl._create_default_https_context = ssl._create_unverified_context

    # Patch urllib3 to never verify SSL
    original_ssl_wrap_socket = ssl_.ssl_wrap_socket
    def patched_ssl_wrap_socket(*args, **kwargs):
        kwargs['cert_reqs'] = ssl.CERT_NONE
        kwargs['check_hostname'] = False
        return original_ssl_wrap_socket(*args, **kwargs)
    ssl_.ssl_wrap_socket = patched_ssl_wrap_socket

    # Patch requests library
    try:
        import requests
        from requests.adapters import HTTPAdapter
        from urllib3.poolmanager import PoolManager

        requests.packages.urllib3.disable_warnings()

        # Create custom adapter that disables SSL verification
        class SSLAdapter(HTTPAdapter):
            def init_poolmanager(self, *args, **kwargs):
                kwargs['cert_reqs'] = ssl.CERT_NONE
                kwargs['check_hostname'] = False
                return super().init_poolmanager(*args, **kwargs)

        # Monkey patch requests Session
        original_request = requests.Session.request
        def patched_request(self, *args, **kwargs):
            kwargs['verify'] = False
            if not any(isinstance(adapter, SSLAdapter) for adapter in self.adapters.values()):
                self.mount('https://', SSLAdapter())
                self.mount('http://', SSLAdapter())
            return original_request(self, *args, **kwargs)
        requests.Session.request = patched_request
    except ImportError:
        pass

# Now safe to import docling after SSL bypass is in place
from docling.document_converter import (
    DocumentConverter,
    PdfFormatOption,
    PowerpointFormatOption,
    WordFormatOption,
)
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.base_models import InputFormat


class DoclingService:
    """
    Singleton service for document conversion using Docling.
    
    CRITICAL: This MUST be a singleton because DocumentConverter loads
    heavy ML models (hundreds of MB) into memory. Creating multiple instances
    will cause MemoryError in production environments.
    """
    _instance = None
    _converter = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        # Only initialize once
        if DoclingService._converter is not None:
            return

        self.pipeline_options = PdfPipelineOptions()
        self.pipeline_options.do_ocr = False

        # This loads heavy ML models - only do this ONCE
        DoclingService._converter = DocumentConverter(
            allowed_formats=[InputFormat.PPTX, InputFormat.PDF, InputFormat.DOCX],
            format_options={
                InputFormat.DOCX: WordFormatOption(
                    pipeline_options=self.pipeline_options,
                ),
                InputFormat.PPTX: PowerpointFormatOption(
                    pipeline_options=self.pipeline_options,
                ),
                InputFormat.PDF: PdfFormatOption(
                    pipeline_options=self.pipeline_options,
                ),
            },
        )

    def parse_to_markdown(self, file_path: str) -> str:
        result = DoclingService._converter.convert(file_path)
        return result.document.export_to_markdown()


# Global singleton instance
_docling_service_instance = DoclingService()


def get_docling_service() -> DoclingService:
    """Get the singleton DoclingService instance."""
    return _docling_service_instance
