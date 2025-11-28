import unittest
from unittest.mock import MagicMock, patch
import sys
import os
from lxml import etree

# Add server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), "../servers/fastapi"))

from services.placeholder_injector import inject_smartart_text
from services.placeholder_extractor import extract_smartart_text

class TestSmartArtBug(unittest.TestCase):
    def setUp(self):
        # Create a mock SmartArt XML structure
        # This structure mimics a diagram where some nodes might have empty/whitespace text
        self.smartart_xml = """
        <dgm:dataModel xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
            <dgm:ptList>
                <!-- Node 0: Valid text -->
                <dgm:pt modelId="{1}">
                    <dgm:t>Node 1 Text</dgm:t>
                </dgm:pt>
                <!-- Node 1: Whitespace text (should be skipped by extractor, but might be counted by injector) -->
                <dgm:pt modelId="{2}">
                    <dgm:t> </dgm:t>
                </dgm:pt>
                <!-- Node 2: Valid text -->
                <dgm:pt modelId="{3}">
                    <dgm:t>Node 2 Text</dgm:t>
                </dgm:pt>
            </dgm:ptList>
        </dgm:dataModel>
        """
        self.diagram_tree = etree.fromstring(self.smartart_xml)

    @patch('services.placeholder_injector._read_xml')
    @patch('services.placeholder_injector.os.makedirs')
    @patch('services.placeholder_injector.open')
    def test_smartart_injection_mismatch(self, mock_open, mock_makedirs, mock_read_xml):
        """
        Test that injection fails or targets wrong node when whitespace nodes exist.
        
        Scenario:
        - Extractor sees: ["Node 1 Text", "Node 2 Text"] (skips whitespace node)
        - Injector tries to inject into "Node 2 Text" (index 1 from extractor's perspective)
        - If Injector counts whitespace node, index 1 will point to the whitespace node!
        """
        
        # Setup mock to return our XML
        mock_read_xml.return_value = self.diagram_tree
        
        # Mock zipfile and other dependencies
        mock_zip = MagicMock()
        
        # Simulate Extractor behavior (logic copied from placeholder_extractor.py)
        extracted_elements = []
        node_index = 0
        for pt in self.diagram_tree.findall(".//{http://schemas.openxmlformats.org/drawingml/2006/diagram}pt"):
            t_elem = pt.find(".//{http://schemas.openxmlformats.org/drawingml/2006/diagram}t")
            if t_elem is not None and t_elem.text:
                text = t_elem.text.strip()
                if text:
                    extracted_elements.append({
                        "id": f"slide1_smartart0_node{node_index}",
                        "text": text
                    })
                    node_index += 1
        
        # Verify extractor skipped the whitespace node
        self.assertEqual(len(extracted_elements), 2)
        self.assertEqual(extracted_elements[0]["text"], "Node 1 Text")
        self.assertEqual(extracted_elements[1]["text"], "Node 2 Text")
        
        # Now try to inject into the second node (index 1)
        # We expect this to target "Node 2 Text"
        target_id = "slide1_smartart0_node1"
        new_text = "REWRITTEN NODE 2"
        
        # We need to mock the file writing to verify what was written
        # But since inject_smartart_text modifies the tree in-place, we can check the tree after call
        
        # We need to mock the relationship finding part too, or bypass it
        # Since inject_smartart_text does a lot of XML lookups, it's easier to verify the core logic
        # by calling a modified version or just checking the logic flaw directly.
        
        # However, let's try to run the actual function with sufficient mocking
        
        # Mock slide XML to find the SmartArt
        slide_xml = """
        <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
            <p:cSld>
                <p:spTree>
                    <p:graphicFrame>
                        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/diagram">
                            <dgm:relIds xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" r:dm="rId1"/>
                        </a:graphicData>
                    </p:graphicFrame>
                </p:spTree>
            </p:cSld>
        </p:sld>
        """
        slide_tree = etree.fromstring(slide_xml)
        
        # Mock rels XML
        rels_xml = """
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
            <Relationship Id="rId1" Target="../diagrams/data1.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramData"/>
        </Relationships>
        """
        rels_tree = etree.fromstring(rels_xml)
        
        # Configure mock_read_xml to return appropriate trees based on path
        def side_effect_read_xml(zipf, path):
            print(f"DEBUG: _read_xml called with path: {path}")
            if path.endswith(".rels"):
                return rels_tree
            if "slide" in path:
                return slide_tree
            if "data1.xml" in path:
                return self.diagram_tree
            print(f"DEBUG: Returning None for path: {path}")
            return None
            
        mock_read_xml.side_effect = side_effect_read_xml
        
        # Call inject_smartart_text
        # We want to inject into node 1 (the second valid text node)
        success = inject_smartart_text("ppt/slides/slide1.xml", mock_zip, target_id, new_text, "/tmp")
        
        self.assertTrue(success, "Injection should report success")
        
        # Check if the correct node was updated
        # The second valid node (Node 2 Text) should be updated
        # The whitespace node should be untouched
        
        pts = self.diagram_tree.findall(".//{http://schemas.openxmlformats.org/drawingml/2006/diagram}pt")
        node0_text = pts[0].find(".//{http://schemas.openxmlformats.org/drawingml/2006/diagram}t").text
        node1_text = pts[1].find(".//{http://schemas.openxmlformats.org/drawingml/2006/diagram}t").text # Whitespace node
        node2_text = pts[2].find(".//{http://schemas.openxmlformats.org/drawingml/2006/diagram}t").text
        
        print(f"Node 0: '{node0_text}'")
        print(f"Node 1: '{node1_text}'")
        print(f"Node 2: '{node2_text}'")
        
        # BUG ASSERTION:
        # If the bug exists, the injector counted the whitespace node as node 1.
        # So it updated pts[1] (the whitespace node) instead of pts[2] (the target node).
        
        # We expect the bug to cause:
        # node1_text == "REWRITTEN NODE 2"
        # node2_text == "Node 2 Text" (unchanged)
        
        # If fixed, we expect:
        # node1_text == " "
        # node2_text == "REWRITTEN NODE 2"
        
        # Assert that the bug is FIXED
        # The whitespace node (node1_text) should be skipped and NOT updated
        # The target node (node2_text) SHOULD be updated
        
        self.assertNotEqual(node1_text, new_text, "Whitespace node was incorrectly updated (Bug present)")
        self.assertEqual(node2_text, new_text, "Target node was not updated (Injection failed)")

if __name__ == "__main__":
    unittest.main()
