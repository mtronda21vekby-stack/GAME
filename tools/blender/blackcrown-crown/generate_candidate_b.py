from __future__ import annotations

import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))

from candidate_a_common import argv_after_separator, load_config, script_args
from candidate_b_common import build_candidate_scene, dump_record, source_record


def main() -> None:
    parser = script_args("Generate the deterministic BlackCrown Candidate B source scene.")
    parser.add_argument("--config", required=True)
    parser.add_argument("--output-blend", required=True)
    args = parser.parse_args(argv_after_separator())
    config = load_config(args.config)
    output = Path(args.output_blend).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    texture_dir = output.parent / "texture-source"
    build_candidate_scene(config, "lod0", texture_dir)
    bpy.ops.wm.save_as_mainfile(filepath=str(output), check_existing=False)
    record = source_record(config, output, texture_dir)
    dump_record(output.parent / "candidate-b-source-record.json", record)
    print(record)


if __name__ == "__main__":
    main()
