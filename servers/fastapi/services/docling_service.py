import os
import ssl
import sys

# IMPORTANT: Disable SSL verification BEFORE importing docling
# This must happen at module level, not in __init__, because docling
# may download models during import
DISABLE_SSL = os.getenv("DISABLE_SSL_VERIFY", "false").lower() == "true"

if DISABLE_SSL:
    print("⚠️  SSL verification is DISABLED - this should only be used in development", file=sys.stderr)

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
try:
    from docling.document_converter import (
        DocumentConverter,
        PdfFormatOption,
        PowerpointFormatOption,
        WordFormatOption,
    )
    from docling.datamodel.pipeline_options import PdfPipelineOptions
    from docling.datamodel.base_models import InputFormat

    DOCLING_AVAILABLE = True
    print("✅ Docling imports successful", file=sys.stderr)
except Exception as e:
    print(f"⚠️  Failed to import docling: {type(e).__name__}: {str(e)}", file=sys.stderr)

    if "SSL" in str(e) or "certificate" in str(e).lower():
        print("💡 SSL Error during docling import. Set DISABLE_SSL_VERIFY=true in .env and restart", file=sys.stderr)
        print("   Example: export DISABLE_SSL_VERIFY=true", file=sys.stderr)

    DOCLING_AVAILABLE = False
    # Create dummy classes to prevent import errors
    DocumentConverter = None
    PdfFormatOption = None
    PowerpointFormatOption = None
    WordFormatOption = None
    PdfPipelineOptions = None
    InputFormat = None


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

        # Check if docling is available
        if not DOCLING_AVAILABLE:
            error_msg = "Docling library is not available. Cannot initialize DoclingService."
            print(f"❌ {error_msg}", file=sys.stderr)
            raise RuntimeError(error_msg)

        try:
            print("🔧 Initializing DoclingService (loading ML models)...", file=sys.stderr)
            print(f"   SSL verification: {'DISABLED' if DISABLE_SSL else 'ENABLED'}", file=sys.stderr)

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

            print("✅ DoclingService initialized successfully", file=sys.stderr)
        except Exception as e:
            error_msg = f"❌ Failed to initialize DoclingService: {type(e).__name__}: {str(e)}"
            print(error_msg, file=sys.stderr)

            # Check if it's an SSL error
            if "SSL" in str(e) or "certificate" in str(e).lower():
                print("💡 SSL Error detected during initialization.", file=sys.stderr)
                print("   To fix: Set DISABLE_SSL_VERIFY=true in your .env file and restart", file=sys.stderr)
                print(f"   Current setting: DISABLE_SSL_VERIFY={os.getenv('DISABLE_SSL_VERIFY', 'not set')}", file=sys.stderr)

            raise RuntimeError(f"DoclingService initialization failed: {str(e)}") from e

    def parse_to_markdown(self, file_path: str) -> str:
        try:
            print(f"📄 Converting document: {os.path.basename(file_path)}", file=sys.stderr)
            result = DoclingService._converter.convert(file_path)
            markdown = result.document.export_to_markdown()
            print(f"✅ Successfully converted {os.path.basename(file_path)} ({len(markdown)} chars)", file=sys.stderr)
            return markdown
        except Exception as e:
            error_msg = f"❌ Failed to convert {os.path.basename(file_path)}: {type(e).__name__}: {str(e)}"
            print(error_msg, file=sys.stderr)

            # Check for SSL errors
            if "SSL" in str(e) or "certificate" in str(e).lower():
                print("💡 SSL Error detected. Try setting DISABLE_SSL_VERIFY=true in your .env file", file=sys.stderr)

            raise RuntimeError(f"Document conversion failed for {os.path.basename(file_path)}: {str(e)}") from e


# Global singleton instance
_docling_service_instance = DoclingService()


def get_docling_service() -> DoclingService:
    """Get the singleton DoclingService instance."""
    return _docling_service_instance
