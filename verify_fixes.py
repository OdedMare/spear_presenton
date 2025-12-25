import asyncio
import os
import sys
from unittest.mock import MagicMock, patch

# Add the fastapi directory to sys.path
sys.path.append(os.path.join(os.getcwd(), "servers/fastapi"))

from services.documents_loader import DocumentsLoader

async def test_documents_loader_async():
    print("Testing DocumentsLoader async behavior...")
    # Mock docling_service
    mock_docling = MagicMock()
    mock_docling.parse_to_markdown.return_value = "Mocked content"
    
    loader = DocumentsLoader(file_paths=["dummy.txt"])
    loader.docling_service = mock_docling
    
    with patch("os.path.exists", return_value=True), \
         patch("mimetypes.guess_type", return_value=( "text/plain", None)):
        await loader.load_documents(temp_dir="/tmp")
        print("DocumentsLoader.load_documents finished correctly.")
        assert loader.documents == ["Mocked content"]

if __name__ == "__main__":
    asyncio.run(test_documents_loader_async())
