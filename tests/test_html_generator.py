"""Regression coverage for dashboard data embedded in HTML and JavaScript."""
import json
import re
from html.parser import HTMLParser

from html_generator import get_html_template


def test_manifest_cannot_close_script_and_round_trips():
    prompt = '</ScRiPt><script>alert(1)</script> <!-- __JS_CONTENT__'
    manifest = {"items": [{"positive": prompt, "note": "Grüße"}]}
    rendered = get_html_template("session", manifest, "42")
    match = re.search(r"let fullManifest = (.*?);\s*/\*__JSON_END__\*/", rendered, re.S)
    assert match
    assert "<" not in match[1]
    assert json.loads(match[1]) == manifest


def test_title_cannot_inject_attributes_and_tokens_remain_literal():
    class Inputs(HTMLParser):
        def handle_starttag(self, tag, attrs):
            if tag == "input" and dict(attrs).get("id") == "session-input":
                self.attrs = dict(attrs)

    title = '\" autofocus onfocus=alert(1) __JS_CONTENT__ <b>'
    parser = Inputs()
    parser.feed(get_html_template(title, {"items": []}, "1"))
    assert parser.attrs["value"] == title
    assert "onfocus" not in parser.attrs


def test_node_id_is_a_json_string_literal():
    node_id = '\";alert(1);//</script>__CSS_CONTENT__'
    rendered = get_html_template("session", [], node_id)
    literal = rendered.split("const TARGET_NODE_ID = ", 1)[1].split(";\n", 1)[0]
    assert "<" not in literal
    assert json.loads(literal) == node_id
