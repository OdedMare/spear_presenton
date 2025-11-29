
import unittest
import sys
import os
from lxml import etree

# Add server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "../servers/fastapi"))

from services.placeholder_extractor import extract_shape_element, calculate_text_constraints
from services.placeholder_injector import inject_shape_text

NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
}

class TestEmptyElementFilling(unittest.TestCase):
    
    def setUp(self):
        # Register namespaces
        for prefix, uri in NS.items():
            etree.register_namespace(prefix, uri)

    def test_extract_empty_shape_with_dimensions(self):
        """Test that an empty shape with dimensions is extracted with constraints"""
        # Create an empty shape XML
        shape_xml = """
        <p:sp xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
              xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
            <p:nvSpPr>
                <p:cNvPr id="2" name="Rectangle 1"/>
                <p:cNvSpPr/>
                <p:nvPr/>
            </p:nvSpPr>
            <p:spPr>
                <a:xfrm>
                    <a:off x="0" y="0"/>
                    <a:ext cx="1270000" cy="228600"/> <!-- 100 chars width approx, 1 line height -->
                </a:xfrm>
                <a:prstGeom prst="rect">
                    <a:avLst/>
                </a:prstGeom>
            </p:spPr>
            <!-- No txBody -->
        </p:sp>
        """
        shape_el = etree.fromstring(shape_xml)
        
        # Extract
        element = extract_shape_element(shape_el, 1, 0)
        
        self.assertIsNotNone(element)
        self.assertEqual(element["text"], "")
        self.assertGreater(element["maxLength"], 0)
        self.assertGreater(element["maxLines"], 0)
        print(f"Extracted constraints: maxLength={element['maxLength']}, maxLines={element['maxLines']}")

    def test_inject_into_empty_shape(self):
        """Test injecting text into a shape that has no txBody"""
        shape_xml = """
        <p:sp xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
              xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
            <p:nvSpPr>
                <p:cNvPr id="2" name="Rectangle 1"/>
            </p:nvSpPr>
            <p:spPr>
                <a:xfrm><a:ext cx="100" cy="100"/></a:xfrm>
            </p:spPr>
        </p:sp>
        """
        shape_el = etree.fromstring(shape_xml)
        
        # Verify no txBody initially
        self.assertIsNone(shape_el.find(".//p:txBody", NS))
        
        # Inject text
        success = inject_shape_text(shape_el, "Injected Text")
        
        self.assertTrue(success)
        
        # Verify txBody was created
        tx_body = shape_el.find(".//p:txBody", NS)
        self.assertIsNotNone(tx_body)
        
        # Verify text content
        text = tx_body.find(".//a:t", NS).text
        self.assertEqual(text, "Injected Text")

if __name__ == "__main__":
    unittest.main()
