"""
Manifest File Management
Handles saving and merging manifest.json with user modifications
"""

import json
import os
import threading
import tempfile
from contextlib import contextmanager

# Thread-safe lock for manifest file writes.
# Required when multiple distributed workers submit results concurrently.
_manifest_lock = threading.Lock()


def _atomic_write_manifest(manifest_path, manifest_data):
    """Publish complete UTF-8 JSON; a failed write leaves the old file intact."""
    directory = os.path.dirname(os.path.abspath(manifest_path))
    os.makedirs(directory, exist_ok=True)
    temporary_path = None
    try:
        # Same-directory replacement is atomic; close before replace on Windows.
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=directory,
                                         prefix=".manifest-", suffix=".tmp", delete=False) as f:
            temporary_path = f.name
            json.dump(manifest_data, f, indent=4)
            f.flush()
            os.fsync(f.fileno())
        os.replace(temporary_path, manifest_path)
    finally:
        if temporary_path and os.path.exists(temporary_path):
            os.remove(temporary_path)


@contextmanager
def manifest_transaction(manifest_path, initial_data=None):
    """Lock a read/modify/write operation shared by API and background threads.

    Missing files raise unless initial_data is supplied. Invalid existing JSON
    propagates instead of silently overwriting a damaged session. This lock is
    process-local; independent ComfyUI processes must not share session files.
    """
    with _manifest_lock:
        try:
            with open(manifest_path, encoding="utf-8") as f:
                data = json.load(f)
        except FileNotFoundError:
            if initial_data is None:
                raise
            data = initial_data
        yield data
        _atomic_write_manifest(manifest_path, data)


def merge_manifest_user_changes(manifest_path, existing_data):
    """
    Reload manifest and merge user changes (favorites, rejected, notes) to preserve them.
    This prevents losing user modifications when the manifest is saved during generation.
    
    Args:
        manifest_path: Path to the manifest.json file
        existing_data: The current manifest data dictionary to update
    """
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            current_manifest = json.load(f)
        
        # Create lookup dict of current items by ID from DISK
        current_items_dict = {
            item.get("id"): item 
            for item in current_manifest.get("items", []) 
            if "id" in item
        }
        
        # Track merge statistics
        merged_count = 0
        favorites_preserved = 0
        rejected_preserved = 0
        notes_preserved = 0
        
        # Update ALL items in existing_data (both new and old) with user modifications from disk
        for item in existing_data["items"]:
            item_id = item.get("id")
            if item_id in current_items_dict:
                current_item = current_items_dict[item_id]
                merged_count += 1
                
                # Preserve user-modified fields from the version on disk
                # Field names: "favorited" (not "favorite"), "rejected", "note" (not "notes")
                # Key presence matters: False and empty notes explicitly undo
                # user actions and must replace stale values in generation RAM.
                if "favorited" in current_item:
                    item["favorited"] = current_item["favorited"]
                    favorites_preserved += bool(current_item["favorited"])

                if "rejected" in current_item:
                    item["rejected"] = current_item["rejected"]
                    rejected_preserved += bool(current_item["rejected"])

                if "note" in current_item:
                    item["note"] = current_item["note"]
                    notes_preserved += bool(current_item["note"])
            # else: This is a new item, no merge needed

        # A stale generation/upscale snapshot must not drop another writer's
        # newly published results. Existing in-memory order remains unchanged.
        memory_ids = {item.get("id") for item in existing_data["items"] if "id" in item}
        existing_data["items"].extend(
            item for item in current_manifest.get("items", [])
            if "id" in item and item["id"] not in memory_ids
        )
        
        # Log merge results if any user changes were preserved
        if favorites_preserved > 0 or rejected_preserved > 0 or notes_preserved > 0:
            print(f"[GridTester] 🔄 Merged user changes: {favorites_preserved} favorites, {rejected_preserved} rejected, {notes_preserved} notes (from {merged_count} items)")
                    
    except FileNotFoundError:
        # First save, no existing manifest to merge
        pass
    except Exception as e:
        print(f"[GridTester] ⚠️ Warning: Could not merge manifest changes: {e}")
        import traceback
        traceback.print_exc()
        raise  # Do not overwrite a manifest whose current contents cannot be read.


def save_manifest(manifest_path, manifest_data):
    """
    Save manifest data to disk, merging user changes first.
    Thread-safe: uses _manifest_lock for concurrent access from distributed workers.

    Args:
        manifest_path: Path to the manifest.json file
        manifest_data: Manifest data dictionary to save
    """
    with _manifest_lock:
        # Merge user changes from disk first
        merge_manifest_user_changes(manifest_path, manifest_data)

        # Save merged data
        _atomic_write_manifest(manifest_path, manifest_data)

        print(f"[GridTester] 💾 Manifest saved: {manifest_path}")


def load_existing_manifest(manifest_path):
    """
    Load existing manifest data from disk.
    
    Args:
        manifest_path: Path to the manifest.json file
        
    Returns:
        dict: Manifest data or new empty manifest structure
    """
    if os.path.exists(manifest_path):
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            print(f"[GridTester] 📂 Loaded existing manifest with {len(data.get('items', []))} items")
            return data
        except Exception as e:
            print(f"[GridTester] ⚠️ Error loading manifest: {e}")
    
    # Return new manifest structure
    return {
        "session_name": "default",
        "items": []
    }
