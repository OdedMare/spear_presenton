
import unittest
import sys
import os
from lxml import etree

# Add server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "../servers/fastapi"))

from services.placeholder_injector import inject_shape_text

NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
}

class TestParagraphFormatting(unittest.TestCase):
    
    def setUp(self):
        # Register namespaces
        for prefix, uri in NS.items():
            etree.register_namespace(prefix, uri)

    def test_preserve_bullets(self):
        """Test that bullet points are preserved"""
        shape_xml = """
        <p:sp xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
              xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
            <p:nvSpPr><p:cNvPr id="2" name="Rect"/></p:nvSpPr>
            <p:spPr/>
            <p:txBody>
                <a:bodyPr/>
                <a:lstStyle/>
                <a:p>
                    <a:pPr>
                        <a:buChar char="•"/>
                    </a:pPr>
                    <a:r><a:t>Old Bullet</a:t></a:r>
                </a:p>
            </p:txBody>
        </p:sp>
        """
        shape_el = etree.fromstring(shape_xml)
        
        # Inject new text
        inject_shape_text(shape_el, "New Bullet")
        
        # Check pPr for bullet char
        p_pr = shape_el.find(".//a:pPr", NS)
        self.assertIsNotNone(p_pr)
        bu_char = p_pr.find("a:buChar", NS)
        self.assertIsNotNone(bu_char)
        self.assertEqual(bu_char.get("char"), "•")

    def test_preserve_indentation(self):
        """Test that indentation is preserved"""
        shape_xml = """
        <p:sp xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
              xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
            <p:nvSpPr><p:cNvPr id="2" name="Rect"/></p:nvSpPr>
            <p:spPr/>
            <p:txBody>
                <a:bodyPr/>
                <a:lstStyle/>
                <a:p>
                    <a:pPr lvl="1">
                        <a:indent lvl="1"/>
                    </a:pPr>
                    <a:r><a:t>Indented Text</a:t></a:r>
                </a:p>
            </p:txBody>
        </p:sp>
        """
        shape_el = etree.fromstring(shape_xml)
        
        # Inject new text
        inject_shape_text(shape_el, "New Indented Text")
        
        # Check pPr for level
        p_pr = shape_el.find(".//a:pPr", NS)
        self.assertIsNotNone(p_pr)
        self.assertEqual(p_pr.get("lvl"), "1")

    def test_rtl_override_with_bullets(self):
        """Test that RTL override works even with preserved bullets"""
        shape_xml = """
        <p:sp xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
              xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
            <p:nvSpPr><p:cNvPr id="2" name="Rect"/></p:nvSpPr>
            <p:spPr/>
            <p:txBody>
                <a:bodyPr/>
                <a:lstStyle/>
                <a:p>
                    <a:pPr>
                        <a:buChar char="•"/>
                    </a:pPr>
                    <a:r><a:t>Old Bullet</a:t></a:r>
                </a:p>
            </p:txBody>
        </p:sp>
        """
        shape_el = etree.fromstring(shape_xml)
        
        # Inject Hebrew text
        inject_shape_text(shape_el, "שלום")
        
        # Check pPr for bullet char AND rtl
        p_pr = shape_el.find(".//a:pPr", NS)
        self.assertIsNotNone(p_pr)
        
        # Bullet should still be there
        bu_char = p_pr.find("a:buChar", NS)
        self.assertIsNotNone(bu_char)
        self.assertEqual(bu_char.get("char"), "•")
        
        # RTL should be 1
        self.assertEqual(p_pr.get("rtl"), "1")
        self.assertEqual(p_pr.get("algn"), "r")

if __name__ == "__main__":
    unittest.main()
