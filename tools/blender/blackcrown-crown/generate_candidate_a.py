from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))

from candidate_a_common import argv_after_separator, build_candidate_scene, load_config, mesh_stats, script_args


def main() -> None:
    parser = script_args("Generate the deterministic BlackCrown Candidate A source scene.")
    parser.add_argument("--config", required=True)
    parser.add_argument("--output-blend", required=True)
    args = parser.parse_args(argv_after_separator())
    config = load_config(args.config)
    output = Path(args.output_blend).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    texture_dir = output.parent / "texture-source"
    build_candidate_scene(config, "lod0", texture_dir)
    bpy.ops.wm.save_as_mainfile(filepath=str(output), check_existing=False)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    record = {
        "assetId": config["assetId"],
        "blenderVersion": bpy.app.version_string,
        "sourceBlend": str(output),
        "sourceBlendBytes": output.stat().st_size,
        "sourceBlendSha256": digest,
        "textureSource": str(texture_dir),
        "lod0SourceStats": mesh_stats(),
    }
    record_path = output.parent / "candidate-a-source-record.json"
    record_path.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(record, indent=2))


if __name__ == "__main__":
    main()
