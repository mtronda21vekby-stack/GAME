from __future__ import annotations

import math
import sys
from array import array
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))

from candidate_a_common import argv_after_separator, script_args


def look_at(obj: bpy.types.Object, target: tuple[float, float, float]) -> None:
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_camera() -> bpy.types.Object:
    data = bpy.data.cameras.new("BC_REVIEW_CAMERA")
    data.lens = 68
    data.sensor_width = 36
    camera = bpy.data.objects.new("BC_REVIEW_CAMERA", data)
    bpy.context.scene.collection.objects.link(camera)
    bpy.context.scene.camera = camera
    return camera


def add_area(name: str, location, color, energy: float, size: float) -> None:
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    data.color = color
    light = bpy.data.objects.new(name, data)
    light.location = location
    bpy.context.scene.collection.objects.link(light)
    look_at(light, (0.0, 0.0, 0.8))


def setup_render(output_dir: Path) -> bpy.types.Object:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1600
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.render.image_settings.color_depth = "8"
    scene.render.resolution_percentage = 100
    scene.render.filepath = str(output_dir)
    scene.world.color = (0.0015, 0.003, 0.006)
    add_area("BC_KEY", (3.4, -4.8, 4.2), (0.58, 0.76, 1.0), 1050, 3.4)
    add_area("BC_RIM", (-3.7, 2.8, 2.5), (0.05, 0.72, 1.0), 1250, 2.6)
    add_area("BC_FILL", (-2.4, -3.6, 0.8), (0.26, 0.34, 0.46), 520, 4.0)
    add_area("BC_ORANGE", (2.2, 3.0, 0.8), (1.0, 0.14, 0.025), 140, 2.0)
    return add_camera()


def render(camera: bpy.types.Object, output: Path, location, target=(0.0, 0.0, 0.88), lens=68) -> None:
    camera.location = location
    camera.data.lens = lens
    look_at(camera, target)
    bpy.context.scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)


def reset_pose() -> None:
    armature = bpy.data.objects.get("BC_SHELL_ROOT")
    if armature and armature.pose:
        for bone in armature.pose.bones:
            bone.location = (0.0, 0.0, 0.0)
            bone.rotation_mode = "QUATERNION"
            bone.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
            bone.scale = (1.0, 1.0, 1.0)
    portal = bpy.data.objects.get("BC_PORTAL_ROOT")
    if portal:
        portal.scale = (1.0, 1.0, 1.0)


def open_core(amount: float = 1.0) -> None:
    armature = bpy.data.objects.get("BC_SHELL_ROOT")
    if not armature or not armature.pose:
        return
    for index in range(9):
        normalized = (index - 4) / 4
        segment = armature.pose.bones.get(f"BC_SEG_{index:02d}")
        spire = armature.pose.bones.get(f"BC_SPIRE_{index:02d}")
        if segment:
            segment.location.x = math.copysign(0.16 + abs(normalized) * 0.12, normalized) * amount if normalized else 0.0
            segment.location.y = (0.10 + (1.0 - abs(normalized)) * 0.10) * amount
            segment.location.z = (1.0 - abs(normalized)) * 0.62 * amount
        if spire:
            spire.location.z = (0.06 + (1.0 - abs(normalized)) * 0.13) * amount


def material_override(color: tuple[float, float, float, float] | None):
    scene = bpy.context.scene
    if color is None:
        scene.view_layers[0].material_override = None
        return
    material = bpy.data.materials.get("BC_REVIEW_OVERRIDE") or bpy.data.materials.new("BC_REVIEW_OVERRIDE")
    material.diffuse_color = color
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    if shader:
        shader.inputs["Base Color"].default_value = color
        shader.inputs["Roughness"].default_value = 0.74
    scene.view_layers[0].material_override = material


def portal_render_visible(visible: bool) -> None:
    portal = bpy.data.objects.get("BC_PORTAL_ROOT")
    if not portal:
        return
    portal.hide_render = not visible
    for child in portal.children_recursive:
        child.hide_render = not visible


def contact_sheet(paths: list[Path], output: Path) -> None:
    tile = 400
    size = tile * 4
    canvas = array("f", [0.0]) * (size * size * 4)
    for index, path in enumerate(paths):
        image = bpy.data.images.load(str(path), check_existing=False)
        image.scale(tile, tile)
        pixels = array("f", [0.0]) * (tile * tile * 4)
        image.pixels.foreach_get(pixels)
        column = index % 4
        row = 3 - index // 4
        for y in range(tile):
            source_start = y * tile * 4
            target_start = ((row * tile + y) * size + column * tile) * 4
            canvas[target_start : target_start + tile * 4] = pixels[source_start : source_start + tile * 4]
        bpy.data.images.remove(image)
    sheet = bpy.data.images.new("Candidate A Turntable", width=size, height=size, alpha=True)
    sheet.pixels.foreach_set(canvas)
    sheet.filepath_raw = str(output)
    sheet.file_format = "PNG"
    sheet.save()
    bpy.data.images.remove(sheet)


def main() -> None:
    parser = script_args("Render Candidate A neutral review package.")
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args(argv_after_separator())
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    turntable_dir = output_dir / "turntable"
    turntable_dir.mkdir(parents=True, exist_ok=True)
    camera = setup_render(output_dir)
    portal_render_visible(False)

    views = {
        "candidate-a-front.png": ((0.0, -5.3, 1.12), (0.0, 0.0, 0.90), 72),
        "candidate-a-front-3q.png": ((3.7, -4.5, 1.95), (0.0, 0.0, 0.86), 70),
        "candidate-a-side.png": ((4.9, -0.05, 1.25), (0.0, 0.0, 0.83), 72),
        "candidate-a-back-3q.png": ((-3.2, 4.0, 1.75), (0.0, 0.0, 0.86), 70),
        "candidate-a-top.png": ((0.0, -1.1, 5.2), (0.0, 0.0, 0.65), 74),
        "candidate-a-material-closeup.png": ((1.55, -2.25, 1.15), (0.35, 0.0, 0.92), 84),
    }
    for filename, (location, target, lens) in views.items():
        reset_pose()
        render(camera, output_dir / filename, location, target, lens)

    reset_pose()
    material_override((0.003, 0.003, 0.004, 1.0))
    original_world = tuple(bpy.context.scene.world.color)
    bpy.context.scene.world.color = (0.86, 0.88, 0.92)
    render(camera, output_dir / "candidate-a-silhouette.png", (0.0, -5.3, 1.12), (0.0, 0.0, 0.90), 72)
    material_override(None)
    bpy.context.scene.world.color = original_world

    reset_pose()
    open_core(1.0)
    render(camera, output_dir / "candidate-a-core-open.png", (0.0, -4.2, 1.05), (0.0, 0.0, 0.82), 76)
    portal = bpy.data.objects.get("BC_PORTAL_ROOT")
    if portal:
        portal_render_visible(True)
        portal.scale = (1.22, 1.22, 1.22)
    render(camera, output_dir / "candidate-a-portal-open.png", (0.0, -3.6, 0.96), (0.0, 0.15, 0.72), 82)

    reset_pose()
    portal_render_visible(False)
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj.show_wire = True
            obj.show_all_edges = True
    material_override((0.055, 0.075, 0.092, 1.0))
    render(camera, output_dir / "candidate-a-wireframe.png", (2.7, -3.6, 1.75), (0.0, 0.0, 0.88), 72)
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
    contact_sheet(turntable, output_dir / "candidate-a-turntable-contact-sheet.png")
    print(f"Rendered {len(views) + 4 + len(turntable)} Candidate A review images to {output_dir}")


if __name__ == "__main__":
    main()
