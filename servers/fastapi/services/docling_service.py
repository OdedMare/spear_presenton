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
    def __init__(self):

        self.pipeline_options = PdfPipelineOptions()
        self.pipeline_options.do_ocr = False

        self.converter = DocumentConverter(
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
        result = self.converter.convert(file_path)
        return result.document.export_to_markdown()
