import os
import json
import html
import re

def get_html_template(title, manifest_data, node_id):
    # 1. Normalize Data
    if isinstance(manifest_data, list):
        manifest_data = {"items": manifest_data, "meta": {"model": "", "positive": "", "negative": ""}}
    
    # Indent JSON for readability
    # HTML parses </script> even inside a JS string. Escape '<' while keeping
    # valid JSON so the dashboard's incremental-update parser still works.
    json_str = json.dumps(manifest_data, indent=2).replace("<", "\\u003c")

    # 2. Resolve File Paths
    current_dir = os.path.dirname(__file__)
    resource_dir = os.path.join(current_dir, "resources")
    
    # Define JS Load Order (Dependencies first!)
    js_files = [
        "logic_state.js",    # Global variables
        "logic_utils.js",    # API & Helper functions
        "logic_ui.js",       # DOM Creation, Modals, JSON Bars
        "logic_upscale_modal.js",  # Upscale Modal (preset management, async upscale)
        "logic_virtual.js",  # The Virtual Scroll Engine & Viewport
        "logic_pipeline.js", # Sorting & Filtering Logic
        "logic_events.js",   # Event Listeners (Message, Keyboard)
        "logic_init.js"      # Initialization
    ]

    try:
        # Load HTML
        with open(os.path.join(resource_dir, "template.html"), "r", encoding="utf-8") as f: 
            html_template = f.read()
        
        # Load CSS
        with open(os.path.join(resource_dir, "report.css"), "r", encoding="utf-8") as f: 
            css_content = f.read()
            
        # Load and Concatenate JS
        js_content = ""
        for js_file in js_files:
            file_path = os.path.join(resource_dir, js_file)
            with open(file_path, "r", encoding="utf-8") as f:
                js_content += f"\n/* --- {js_file} --- */\n"
                js_content += f.read() + "\n"

    except FileNotFoundError as e:
        return f"<h1>Error: Resource files not found.</h1><p>{e}</p>"

    # 3. Inject Data
    wrapped_json = f"/*__JSON_START__*/\nlet fullManifest = {json_str};\n/*__JSON_END__*/"

    # 4. Final Replacements
    # Substitute once: user text containing template tokens must stay literal.
    replacements = {
        "__TITLE__": html.escape(str(title), quote=True),
        '"__NODE_ID__"': json.dumps(str(node_id)).replace("<", "\\u003c"),
        "let fullManifest = __JSON_DATA__;": wrapped_json,
        "__CSS_CONTENT__": css_content,
        "__JS_CONTENT__": js_content,
    }
    final_html = re.sub(
        "|".join(re.escape(token) for token in replacements),
        lambda match: replacements[match.group(0)], html_template,
    )

    return final_html
