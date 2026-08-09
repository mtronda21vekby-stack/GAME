from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))

from candidate_a_common import argv_after_separator, build_candidate_scene, load_config, script_args, selected_hierarchy
from validate_blender_scene import BUDGETS, validate_scene


LOD_FILES = {
    "lod0": "crown-candidate-a-lod0.glb",
    "lod1": "crown-candidate-a-lod1.glb",
    "lod2": "crown-candidate-a-lod2.glb",
}

LOD_TIERS = {"high": "lod0", "medium": "lod1", "low": "lod2"}


def export_lod(config: dict, lod: str, output: Path, texture_dir: Path) -> dict:
    built = build_candidate_scene(config, lod, texture_dir)
    validation = validate_scene(config, lod)
    if not validation["ok"]:
        raise RuntimeError(json.dumps(validation, indent=2))
    bpy.ops.object.select_all(action="DESELECT")
    for obj in selected_hierarchy(built["root"]):
        obj.select_set(True)
    bpy.context.view_layer.objects.active = built["root"]
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=False,
        export_texcoords=True,
        export_normals=True,
        export_tangents=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_skins=True,
        export_morph=False,
        export_image_format="AUTO",
        export_keep_originals=False,
    )
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    return {
        **validation["stats"],
        "file": str(output),
        "bytes": output.stat().st_size,
        "sha256": digest,
    }


def main() -> None:
    parser = script_args("Export all Candidate A LODs as self-contained GLB files.")
    parser.add_argument("--config", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--report", default="/tmp/blackcrown-production-crown-candidate-a/candidate-a-export-record.json")
    args = parser.parse_args(argv_after_separator())
    config = load_config(args.config)
    output_dir = Path(args.output_dir).resolve()
    texture_dir = Path(args.report).resolve().parent / "texture-source"
    stats = {}
    for lod, filename in LOD_FILES.items():
        stats[lod] = export_lod(config, lod, output_dir / filename, texture_dir)

    lods = {}
    for tier, lod in LOD_TIERS.items():
        budget = BUDGETS[lod]
        maximum_bytes = {"lod0": 8_388_608, "lod1": 5_242_880, "lod2": 2_621_440}[lod]
        maximum_materials = budget["materials"]
        lods[tier] = {
            "url": f"/experience/crown/candidate-a/{LOD_FILES[lod]}",
            "maxTriangles": budget["triangles"],
            "maxBytes": maximum_bytes,
            "maxMaterials": maximum_materials,
            "maxDrawCalls": budget["drawCalls"],
            "sha256": stats[lod]["sha256"],
            "bytes": stats[lod]["bytes"],
        }
    manifest = {
        "schemaVersion": 1,
        "enabled": True,
        "candidateOnly": True,
        "assetId": config["assetId"],
        "frontAxis": config["frontAxis"],
        "upAxis": config["upAxis"],
        "units": config["units"],
        "segmentCount": config["segmentCount"],
        "spires": config["spireCount"],
        "dimensions": config["dimensions"],
        "lods": lods,
        "features": {"ktx2": False, "meshopt": False, "draco": False, "skinnedShell": True},
    }
    manifest_path = output_dir / "crown-candidate-a.manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    report = {
        "assetId": config["assetId"],
        "blenderVersion": bpy.app.version_string,
        "manifest": str(manifest_path),
        "lods": stats,
    }
    report_path = Path(args.report).resolve()
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
