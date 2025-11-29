from lxml import etree

rels_xml = """
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Target="../diagrams/data1.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramData"/>
</Relationships>
"""

root = etree.fromstring(rels_xml)
print(f"Root tag: {root.tag}")

# Try finding with wildcard namespace
rels = root.findall(".//{*}Relationship")
print(f"Found {len(rels)} relationships with {{*}}")

# Try finding with explicit namespace
ns = "http://schemas.openxmlformats.org/package/2006/relationships"
rels_ns = root.findall(f".//{{{ns}}}Relationship")
print(f"Found {len(rels_ns)} relationships with explicit NS")

for r in rels:
    print(f"Rel: Id={r.get('Id')}")
