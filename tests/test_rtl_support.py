
import unittest
import sys
import os
from lxml import etree

# Add server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "../servers/fastapi"))

from services.placeholder_injector import inject_shape_text, is_rtl_text

NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
}

class TestRTLSupport(unittest.TestCase):
    
    def setUp(self):
        # Register namespaces
        for prefix, uri in NS.items():
            etree.register_namespace(prefix, uri)

    def test_is_rtl_text(self):
        """Test RTL detection logic"""
        self.assertTrue(is_rtl_text("שלום עולם"))
        self.assertTrue(is_rtl_text("Hello שלום"))
        self.assertTrue(is_rtl_text("مرحبا بالعالم")) # Arabic
        self.assertFalse(is_rtl_text("Hello World"))
        self.assertFalse(is_rtl_text("123456"))
        self.assertFalse(is_rtl_text(""))

    def test_inject_rtl_text(self):
        """Test injecting Hebrew text sets RTL attributes"""
        shape_xml = """
        <p:sp xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
              xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
            <p:nvSpPr><p:cNvPr id="2" name="Rect"/></p:nvSpPr>
            <p:spPr/>
            <p:txBody>
                <a:bodyPr/>
                <a:lstStyle/>
                <a:p><a:r><a:t>Old Text</a:t></a:r></a:p>
            </p:txBody>
        </p:sp>
        """
        shape_el = etree.fromstring(shape_xml)
        
        # Inject Hebrew
        inject_shape_text(shape_el, "שלום")
        
        # Check pPr rtl attribute
        p_pr = shape_el.find(".//a:pPr", NS)
        self.assertIsNotNone(p_pr)
        self.assertEqual(p_pr.get("rtl"), "1")
        self.assertEqual(p_pr.get("algn"), "r")

    def test_inject_ltr_text(self):
        """Test injecting English text sets LTR attributes"""
        shape_xml = """
        <p:sp xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
              xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
            <p:nvSpPr><p:cNvPr id="2" name="Rect"/></p:nvSpPr>
            <p:spPr/>
            <p:txBody>
                <a:bodyPr/>
                <a:lstStyle/>
                <a:p><a:r><a:t>Old Text</a:t></a:r></a:p>
            </p:txBody>
        </p:sp>
        """
        shape_el = etree.fromstring(shape_xml)
        
        # Inject English
        inject_shape_text(shape_el, "Hello")
        
        # Check pPr rtl attribute
        p_pr = shape_el.find(".//a:pPr", NS)
        self.assertIsNotNone(p_pr)
        self.assertEqual(p_pr.get("rtl"), "0")
        # algn should not be set for LTR (default)
        self.assertIsNone(p_pr.get("algn"))

    def test_inject_rtl_into_empty_shape(self):
        """Test injecting Hebrew into empty shape sets rtlCol"""
        shape_xml = """
        <p:sp xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
              xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
            <p:nvSpPr><p:cNvPr id="2" name="Rect"/></p:nvSpPr>
            <p:spPr/>
        </p:sp>
        """
        shape_el = etree.fromstring(shape_xml)
        
        # Inject Hebrew
        inject_shape_text(shape_el, "שלום")
        
        # Check bodyPr rtlCol attribute
        body_pr = shape_el.find(".//a:bodyPr", NS)
        self.assertIsNotNone(body_pr)
        self.assertEqual(body_pr.get("rtlCol"), "1")
        
        # Check pPr rtl attribute
        p_pr = shape_el.find(".//a:pPr", NS)
        self.assertEqual(p_pr.get("rtl"), "1")

if __name__ == "__main__":
    unittest.main()
