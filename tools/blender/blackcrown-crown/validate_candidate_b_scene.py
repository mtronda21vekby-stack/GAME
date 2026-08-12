from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))

from candidate_a_common import argv_after_separator, load_config, script_args
from candidate_b_common import ALLOWED_MATERIALS, mesh_stats


REQUIRED_OBJECTS = {
    "BC_CROWN_ROOT",
    "BC_SHELL_ROOT",
    "BC_CORE_ROOT",
    "BC_PORTAL_ROOT",
    "BC_RING_INNER",
    "BC_RING_MIDDLE",
    "BC_RING_OUTER",
    "BC_PORTAL_IRIS",
    "BC_PORTAL_BLADES",
    "BC_PORTAL_CAVITY",
}

HARD_BUDGETS = {
    "lod0": {"triangles": 100_000, "drawCalls": 20, "materials": 8},
    "lod1": {"triangles": 50_000, "drawCalls": 14, "materials": 6},
    "lod2": {"triangles": 20_000, "drawCalls": 8, "materials": 4},
}

REVIEW_TARGETS = {
    "lod0": {"triangles": 32_000, "drawCalls": 12},
    "lod1": {"triangles": 16_000, "drawCalls": 9},
    "lod2": {"triangles": 8_000, "drawCalls": 8},
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

    shell = bpy.data.objects.get("BC_SHELL_ROOT")
    shell_bones = set(shell.data.bones.keys()) if shell and shell.type == "ARMATURE" else set()
    expected_segments = {f"BC_SEG_{index:02d}" for index in range(int(config["segmentCount"]))}
    expected_spires = {f"BC_SPIRE_{index:02d}" for index in range(int(config["spireCount"]))}
    if expected_segments - shell_bones:
        errors.append(f"Missing segment bones: {', '.join(sorted(expected_segments - shell_bones))}")
    if expected_spires - shell_bones:
        errors.append(f"Missing spire bones: {', '.join(sorted(expected_spires - shell_bones))}")

    iris = bpy.data.objects.get("BC_PORTAL_BLADES")
    iris_bones = set(iris.data.bones.keys()) if iris and iris.type == "ARMATURE" else set()
    expected_iris = {f"BC_IRIS_BLADE_{index:02d}" for index in range(int(config["irisBladeCount"]))}
    if expected_iris - iris_bones:
        errors.append(f"Missing iris blade bones: {', '.join(sorted(expected_iris - iris_bones))}")

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
        if obj.type == "MESH" and not obj.data.polygons:
            errors.append(f"{obj.name} has no polygon geometry.")

    used_materials = {
        slot.material.name
        for obj in bpy.context.scene.objects
        for slot in obj.material_slots
        if slot.material
    }
    invalid_materials = sorted(used_materials - set(ALLOWED_MATERIALS))
    if invalid_materials:
        errors.append(f"Materials outside contract: {', '.join(invalid_materials)}")

    stats = mesh_stats()
    hard = HARD_BUDGETS[lod]
    target = REVIEW_TARGETS[lod]
    if stats["triangles"] > hard["triangles"]:
        errors.append(f"{lod} has {stats['triangles']} triangles; hard maximum is {hard['triangles']}.")
    if stats["drawCalls"] > hard["drawCalls"]:
        errors.append(f"{lod} has {stats['drawCalls']} draw calls; hard maximum is {hard['drawCalls']}.")
    if len(stats["materials"]) > hard["materials"]:
        errors.append(f"{lod} has {len(stats['materials'])} materials; hard maximum is {hard['materials']}.")
    if stats["triangles"] > target["triangles"]:
        errors.append(f"{lod} misses Candidate B triangle target: {stats['triangles']} > {target['triangles']}.")
    if stats["drawCalls"] > target["drawCalls"]:
        errors.append(f"{lod} misses Candidate B draw-call target: {stats['drawCalls']} > {target['drawCalls']}.")
    if bpy.data.actions:
        errors.append("Candidate B contains baked animation actions.")
    if any(obj.type in {"CAMERA", "LIGHT"} for obj in bpy.context.scene.objects):
        warnings.append("Lookdev cameras/lights are source-only and must remain outside selection export.")

    return {"lod": lod, "ok": not errors, "errors": errors, "warnings": warnings, "stats": stats}


def main() -> None:
    parser = script_args("Validate Candidate B Blender scene and review targets.")
    parser.add_argument("--config", required=True)
    parser.add_argument("--lod", choices=("lod0", "lod1", "lod2"), default="lod0")
    args = parser.parse_args(argv_after_separator())
    result = validate_scene(load_config(args.config), args.lod)
    print(json.dumps(result, indent=2))
    if not result["ok"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
