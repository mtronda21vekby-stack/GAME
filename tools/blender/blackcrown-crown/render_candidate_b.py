from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))

from candidate_a_common import argv_after_separator, script_args
from render_candidate_a import contact_sheet, material_override, portal_render_visible, render, setup_render


def reset_pose() -> None:
    for armature_name in ("BC_SHELL_ROOT", "BC_PORTAL_BLADES"):
        armature = bpy.data.objects.get(armature_name)
        if not armature or not armature.pose:
            continue
        for bone in armature.pose.bones:
            bone.location = (0.0, 0.0, 0.0)
            bone.rotation_mode = "XYZ"
            bone.rotation_euler = (0.0, 0.0, 0.0)
            bone.scale = (1.0, 1.0, 1.0)
    portal = bpy.data.objects.get("BC_PORTAL_ROOT")
    if portal:
        portal.scale = (1.0, 1.0, 1.0)


def open_core(amount: float = 1.0) -> None:
    armature = bpy.data.objects.get("BC_SHELL_ROOT")
    if armature and armature.pose:
        for index in range(9):
            normalized = (index - 4) / 4
            segment = armature.pose.bones.get(f"BC_SEG_{index:02d}")
            spire = armature.pose.bones.get(f"BC_SPIRE_{index:02d}")
            if segment:
                direction = -1.0 if normalized < 0 else 1.0 if normalized > 0 else 0.0
                segment.location.x = direction * (0.17 + abs(normalized) * 0.13) * amount
                segment.location.y = (0.11 + (1.0 - abs(normalized)) * 0.11) * amount
                segment.location.z = (1.0 - abs(normalized)) * 0.58 * amount
            if spire:
                spire.location.z = (0.07 + (1.0 - abs(normalized)) * 0.14) * amount


def open_iris(amount: float = 1.0) -> None:
    armature = bpy.data.objects.get("BC_PORTAL_BLADES")
    if not armature or not armature.pose:
        return
    for index in range(7):
        bone = armature.pose.bones.get(f"BC_IRIS_BLADE_{index:02d}")
        if bone:
            bone.rotation_mode = "XYZ"
            bone.rotation_euler[1] = math.radians(31) * amount
            bone.location.x = 0.055 * amount


def render_package(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    turntable_dir = output_dir / "turntable-b"
    turntable_dir.mkdir(parents=True, exist_ok=True)
    camera = setup_render(output_dir)
    portal_render_visible(False)

    views = {
        "candidate-b-front.png": ((0.0, -5.3, 1.12), (0.0, 0.0, 0.90), 72),
        "candidate-b-front-3q.png": ((3.7, -4.5, 1.95), (0.0, 0.0, 0.86), 70),
        "candidate-b-side.png": ((4.9, -0.05, 1.25), (0.0, 0.0, 0.83), 72),
        "candidate-b-back-3q.png": ((-3.2, 4.0, 1.75), (0.0, 0.0, 0.86), 70),
        "candidate-b-top.png": ((0.0, -1.1, 5.2), (0.0, 0.0, 0.65), 74),
        "candidate-b-material-closeup.png": ((1.55, -2.25, 1.15), (0.35, 0.0, 0.92), 84),
    }
    for filename, (location, target, lens) in views.items():
        reset_pose()
        render(camera, output_dir / filename, location, target, lens)

    reset_pose()
    material_override((0.003, 0.003, 0.004, 1.0))
    original_world = tuple(bpy.context.scene.world.color)
    bpy.context.scene.world.color = (0.86, 0.88, 0.92)
    render(camera, output_dir / "candidate-b-silhouette.png", (0.0, -5.3, 1.12), (0.0, 0.0, 0.90), 72)
    material_override((0.16, 0.17, 0.18, 1.0))
    bpy.context.scene.world.color = (0.035, 0.035, 0.035)
    render(camera, output_dir / "candidate-b-grayscale.png", (0.0, -5.3, 1.12), (0.0, 0.0, 0.90), 72)
    material_override(None)
    bpy.context.scene.world.color = original_world

    reset_pose()
    open_core(1.0)
    render(camera, output_dir / "candidate-b-core-open.png", (0.0, -4.2, 1.05), (0.0, 0.0, 0.82), 76)
    portal_render_visible(True)
    open_iris(1.0)
    portal = bpy.data.objects.get("BC_PORTAL_ROOT")
    if portal:
        portal.scale = (1.22, 1.22, 1.22)
    render(camera, output_dir / "candidate-b-portal-open.png", (0.0, -3.6, 0.96), (0.0, 0.15, 0.72), 82)

    reset_pose()
    portal_render_visible(False)
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj.show_wire = True
            obj.show_all_edges = True
    material_override((0.055, 0.075, 0.092, 1.0))
    render(camera, output_dir / "candidate-b-wireframe.png", (2.7, -3.6, 1.75), (0.0, 0.0, 0.88), 72)
    material_override(None)
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj.show_wire = False

    reset_pose()
    bpy.context.scene.render.resolution_x = 900
    bpy.context.scene.render.resolution_y = 900
    turntable = []
    for index in range(16):
        angle = (index / 16) * math.tau
        path = turntable_dir / f"angle-{index:02d}.png"
        render(camera, path, (math.sin(angle) * 4.5, -math.cos(angle) * 4.5, 1.25), (0.0, 0.0, 0.86), 70)
        turntable.append(path)
    contact_sheet(turntable, output_dir / "candidate-b-turntable-contact-sheet.png")
    print(f"Rendered {len(views) + 5 + len(turntable)} Candidate B review images to {output_dir}")


def main() -> None:
    parser = script_args("Render Candidate B with the immutable Candidate A review rig.")
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args(argv_after_separator())
    render_package(Path(args.output_dir).resolve())


if __name__ == "__main__":
    main()
