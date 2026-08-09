from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))

from candidate_a_common import ALLOWED_MATERIALS, argv_after_separator, load_config, mesh_stats, script_args


REQUIRED_OBJECTS = {
    "BC_CROWN_ROOT",
    "BC_SHELL_ROOT",
    "BC_CORE_ROOT",
    "BC_PORTAL_ROOT",
    "BC_RING_INNER",
    "BC_RING_MIDDLE",
    "BC_RING_OUTER",
}

BUDGETS = {
    "lod0": {"triangles": 100_000, "drawCalls": 20, "materials": 8},
    "lod1": {"triangles": 50_000, "drawCalls": 14, "materials": 6},
    "lod2": {"triangles": 20_000, "drawCalls": 8, "materials": 4},
}


def validate_scene(config: dict, lod: str) -> dict:
    errors = []
    warnings = []
    object_names = [obj.name for obj in bpy.context.scene.objects]
    if len(object_names) != len(set(object_names)):
        errors.append("Object names are not unique.")
    missing = sorted(REQUIRED_OBJECTS - set(object_names))
    if missing:
        errors.append(f"Missing required objects: {', '.join(missing)}")

    armature = bpy.data.objects.get("BC_SHELL_ROOT")
    bone_names = set(armature.data.bones.keys()) if armature and armature.type == "ARMATURE" else set()
    expected_segments = {f"BC_SEG_{index:02d}" for index in range(int(config["segmentCount"]))}
    expected_spires = {f"BC_SPIRE_{index:02d}" for index in range(int(config["spireCount"]))}
    if not armature or armature.type != "ARMATURE":
        errors.append("BC_SHELL_ROOT must be an armature for the draw-call-aware shell binding.")
    if expected_segments - bone_names:
        errors.append(f"Missing segment bones: {', '.join(sorted(expected_segments - bone_names))}")
    if expected_spires - bone_names:
        errors.append(f"Missing spire bones: {', '.join(sorted(expected_spires - bone_names))}")

    root = bpy.data.objects.get("BC_CROWN_ROOT")
    if root:
        identity = tuple(root.location) == (0.0, 0.0, 0.0) and tuple(root.scale) == (1.0, 1.0, 1.0)
        identity = identity and all(abs(value) < 1e-8 for value in root.rotation_euler)
        if not identity:
            errors.append("BC_CROWN_ROOT must have an identity transform.")

    for obj in bpy.context.scene.objects:
        values = (*obj.location, *obj.scale, *obj.rotation_euler)
        if not all(math.isfinite(value) for value in values):
            errors.append(f"{obj.name} contains a non-finite transform.")
        if any(value <= 0 for value in obj.scale):
            errors.append(f"{obj.name} contains a zero or negative scale.")
        if obj.type == "MESH" and len(obj.data.polygons) == 0:
            errors.append(f"{obj.name} has no polygon geometry.")

    used_materials = set()
    for obj in bpy.context.scene.objects:
        for slot in obj.material_slots:
            if slot.material:
                used_materials.add(slot.material.name)
    invalid_materials = sorted(used_materials - set(ALLOWED_MATERIALS))
    if invalid_materials:
        errors.append(f"Materials outside contract: {', '.join(invalid_materials)}")

    stats = mesh_stats()
    budget = BUDGETS[lod]
    if stats["triangles"] > budget["triangles"]:
        errors.append(f"{lod} has {stats['triangles']} triangles; maximum is {budget['triangles']}.")
    if stats["drawCalls"] > budget["drawCalls"]:
        errors.append(f"{lod} has {stats['drawCalls']} draw calls; maximum is {budget['drawCalls']}.")
    if len(stats["materials"]) > budget["materials"]:
        errors.append(f"{lod} has {len(stats['materials'])} materials; maximum is {budget['materials']}.")
    if any(obj.type in {"CAMERA", "LIGHT"} for obj in bpy.context.scene.objects):
        warnings.append("Scene contains render camera/light objects; export must remain selection-only.")
    if bpy.data.actions:
        errors.append("Candidate source contains baked animation actions.")

    result = {"lod": lod, "ok": not errors, "errors": errors, "warnings": warnings, "stats": stats}
    return result


def main() -> None:
    parser = script_args("Validate Candidate A Blender source scene.")
    parser.add_argument("--config", required=True)
    parser.add_argument("--lod", choices=("lod0", "lod1", "lod2"), default="lod0")
    args = parser.parse_args(argv_after_separator())
    result = validate_scene(load_config(args.config), args.lod)
    print(json.dumps(result, indent=2))
    if not result["ok"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
