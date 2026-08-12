from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ASSET_IDS = (
    "world-gate",
    "crown-front-reactor",
    "network-architecture",
    "collection-vault",
    "identity-frame",
)

EXPORT_FILES = {
    "world-gate": "world-gate.glb",
    "crown-front-reactor": "crown-front-reactor.glb",
    "network-architecture": "network-architecture.glb",
    "collection-vault": "collection-vault.glb",
    "identity-frame": "identity-frame.glb",
}

ROOT_NAMES = {
    "world-gate": "BC_ENV_WORLD_GATE",
    "crown-front-reactor": "BC_ENV_CROWN_FRONT_REACTOR",
    "network-architecture": "BC_ENV_NETWORK_ARCHITECTURE",
    "collection-vault": "BC_ENV_COLLECTION_VAULT",
    "identity-frame": "BC_ENV_IDENTITY_FRAME",
}


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        if collection.name != "Collection":
            bpy.data.collections.remove(collection)


def principled(material: bpy.types.Material) -> bpy.types.Node:
    material.use_nodes = True
    return next(node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED")


def set_input(node: bpy.types.Node, name: str, value) -> None:
    socket = node.inputs.get(name)
    if socket is not None:
        socket.default_value = value


def create_materials() -> dict[str, bpy.types.Material]:
    specs = {
        "BC_ENV_MAT_BLACK_TITANIUM": ((0.018, 0.027, 0.039, 1), 0.86, 0.31, None, 0.0),
        "BC_ENV_MAT_GUNMETAL": ((0.055, 0.069, 0.084, 1), 0.72, 0.43, None, 0.0),
        "BC_ENV_MAT_CYAN_ENERGY": ((0.008, 0.18, 0.24, 1), 0.16, 0.3, (0.01, 0.64, 0.92, 1), 3.2),
        "BC_ENV_MAT_VIOLET_ENERGY": ((0.09, 0.04, 0.2, 1), 0.12, 0.34, (0.38, 0.16, 0.95, 1), 2.1),
        "BC_ENV_MAT_TACTICAL_ORANGE": ((0.22, 0.035, 0.008, 1), 0.22, 0.38, (1.0, 0.13, 0.015, 1), 3.4),
    }
    materials: dict[str, bpy.types.Material] = {}
    for name, (color, metallic, roughness, emission, strength) in specs.items():
        material = bpy.data.materials.new(name)
        shader = principled(material)
        set_input(shader, "Base Color", color)
        set_input(shader, "Metallic", metallic)
        set_input(shader, "Roughness", roughness)
        if emission is not None:
            set_input(shader, "Emission Color", emission)
            set_input(shader, "Emission", emission)
            set_input(shader, "Emission Strength", strength)
        materials[name] = material
    return materials


def parent(obj: bpy.types.Object, root: bpy.types.Object) -> bpy.types.Object:
    obj.parent = root
    return obj


def apply_transform(obj: bpy.types.Object) -> None:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    obj.select_set(False)


def add_box(name: str, location, scale, material, root, rotation=(0.0, 0.0, 0.0), bevel=0.09):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    apply_transform(obj)
    if bevel > 0:
        modifier = obj.modifiers.new("BC_CHAMFER", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.data.materials.append(material)
    return parent(obj, root)


def add_cylinder(name: str, location, radius, depth, material, root, vertices=16, rotation=(math.pi / 2, 0.0, 0.0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    apply_transform(obj)
    bevel = obj.modifiers.new("BC_EDGE", "BEVEL")
    bevel.width = min(radius * 0.08, 0.08)
    bevel.segments = 2
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    obj.data.materials.append(material)
    return parent(obj, root)


def add_ico(name: str, location, scale, material, root, subdivisions=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    apply_transform(obj)
    obj.data.materials.append(material)
    return parent(obj, root)


def add_arc(name: str, radius: float, start: float, end: float, depth: float, tube: float, material, root, offset=(0.0, 0.0, 0.0), samples=40):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 2
    curve.bevel_depth = tube
    curve.bevel_resolution = 2
    spline = curve.splines.new("POLY")
    spline.points.add(samples)
    for index in range(samples + 1):
        t = index / samples
        angle = start + (end - start) * t
        spline.points[index].co = (
            offset[0] + math.cos(angle) * radius,
            depth + offset[1],
            offset[2] + math.sin(angle) * radius,
            1.0,
        )
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    parent(obj, root)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)
    return obj


def add_radial_beams(prefix: str, count: int, radius: float, beam_scale, material, root, depth=0.0, angle_offset=0.0, skip=()):
    result = []
    for index in range(count):
        if index in skip:
            continue
        angle = angle_offset + index / count * math.tau
        x = math.cos(angle) * radius
        z = math.sin(angle) * radius
        result.append(add_box(
            f"{prefix}_{index:02d}",
            (x, depth, z),
            beam_scale,
            material,
            root,
            rotation=(0.0, -angle, 0.0),
            bevel=min(beam_scale) * 0.32,
        ))
    return result


def create_root(name: str) -> bpy.types.Object:
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    root["blackcrownAsset"] = True
    root["frontAxis"] = "+Z"
    root["upAxis"] = "+Y"
    return root


def build_world_gate(materials) -> bpy.types.Object:
    root = create_root(ROOT_NAMES["world-gate"])
    shell = materials["BC_ENV_MAT_BLACK_TITANIUM"]
    inner = materials["BC_ENV_MAT_GUNMETAL"]
    cyan = materials["BC_ENV_MAT_CYAN_ENERGY"]
    violet = materials["BC_ENV_MAT_VIOLET_ENERGY"]
    add_arc("BC_GATE_ARC_A", 2.45, -2.45, 0.78, 0.18, 0.11, shell, root, offset=(0.25, 0, 0.08))
    add_arc("BC_GATE_ARC_B", 3.15, 0.35, 2.55, 0.5, 0.13, inner, root, offset=(-0.35, 0, -0.1))
    add_arc("BC_GATE_ARC_C", 3.7, -1.35, 0.08, 0.88, 0.09, cyan, root, offset=(0.45, 0, 0.2))
    add_arc("BC_GATE_ARC_D", 2.0, 1.8, 3.78, -0.32, 0.07, violet, root, offset=(-0.3, 0, 0.0))
    add_radial_beams("BC_GATE_RIB", 12, 2.05, (0.1, 0.22, 0.72), inner, root, depth=0.42, angle_offset=0.08, skip=(1, 4, 7, 10))
    add_radial_beams("BC_GATE_DEPTH_RIB", 10, 1.48, (0.075, 0.18, 0.52), shell, root, depth=1.1, angle_offset=0.24, skip=(2, 6))
    add_box("BC_GATE_FRAME_LEFT", (-3.55, 0.25, 0.1), (0.28, 0.45, 2.65), shell, root, rotation=(0.0, -0.08, -0.12), bevel=0.14)
    add_box("BC_GATE_FRAME_RIGHT", (3.25, 0.48, -0.25), (0.24, 0.38, 2.35), shell, root, rotation=(0.0, 0.1, 0.16), bevel=0.13)
    add_box("BC_GATE_SHUTTER_TOP", (-0.7, -0.18, 3.0), (2.25, 0.32, 0.24), inner, root, rotation=(0.0, 0.05, 0.1), bevel=0.12)
    add_box("BC_GATE_SHUTTER_BOTTOM", (0.8, -0.12, -2.9), (2.1, 0.3, 0.22), inner, root, rotation=(0.0, -0.05, -0.08), bevel=0.11)
    add_cylinder("BC_GATE_APERTURE", (0.18, 1.32, 0.0), 0.82, 0.18, cyan, root, vertices=12)
    add_ico("BC_GATE_NUCLEUS", (0.18, 1.18, 0.0), (0.34, 0.42, 0.34), violet, root, subdivisions=1)
    return root


def build_reactor(materials) -> bpy.types.Object:
    root = create_root(ROOT_NAMES["crown-front-reactor"])
    shell = materials["BC_ENV_MAT_BLACK_TITANIUM"]
    inner = materials["BC_ENV_MAT_GUNMETAL"]
    orange = materials["BC_ENV_MAT_TACTICAL_ORANGE"]
    cyan = materials["BC_ENV_MAT_CYAN_ENERGY"]
    for depth, radius in ((0.65, 2.2), (1.05, 2.85), (1.55, 3.45)):
        add_radial_beams(f"BC_REACTOR_RIB_{int(depth * 100)}", 12, radius, (0.14, 0.34, 0.7 + depth * 0.18), shell if depth < 1.5 else inner, root, depth=depth, angle_offset=depth * 0.13, skip=(2, 8) if depth > 1 else ())
    add_arc("BC_REACTOR_CAGE_A", 2.45, -2.62, 0.25, 0.36, 0.15, shell, root, offset=(0.2, 0, 0.0))
    add_arc("BC_REACTOR_CAGE_B", 3.35, 0.38, 2.78, 1.0, 0.18, inner, root, offset=(-0.3, 0, 0.08))
    add_arc("BC_REACTOR_ENERGY_ARC", 1.52, -2.9, 2.58, 0.08, 0.08, orange, root)
    for index in range(8):
        angle = index / 8 * math.tau + 0.12
        add_box(
            f"BC_REACTOR_SHUTTER_{index:02d}",
            (math.cos(angle) * 1.65, -0.25 + (index % 2) * 0.12, math.sin(angle) * 1.65),
            (0.23, 0.46, 0.82),
            inner,
            root,
            rotation=(0.0, -angle, angle * 0.08),
            bevel=0.12,
        )
    for side in (-1, 1):
        add_box(f"BC_REACTOR_WALL_{side}", (side * 4.0, 1.0, 0.15), (0.38, 0.72, 3.05), shell, root, rotation=(0.0, side * 0.08, side * 0.08), bevel=0.16)
        add_box(f"BC_REACTOR_BRIDGE_TOP_{side}", (side * 2.75, 0.55, 2.65), (1.55, 0.34, 0.17), inner, root, rotation=(0.0, 0.0, side * -0.08), bevel=0.1)
        add_box(f"BC_REACTOR_BRIDGE_BOTTOM_{side}", (side * 2.6, 0.7, -2.55), (1.45, 0.32, 0.16), inner, root, rotation=(0.0, 0.0, side * 0.07), bevel=0.1)
    add_cylinder("BC_REACTOR_APERTURE_OUTER", (0.0, 0.86, 0.0), 1.18, 0.42, shell, root, vertices=12)
    add_cylinder("BC_REACTOR_APERTURE_ENERGY", (0.0, 0.52, 0.0), 0.72, 0.26, orange, root, vertices=12)
    add_ico("BC_REACTOR_CORE", (0.0, 0.22, 0.0), (0.42, 0.54, 0.42), orange, root, subdivisions=1)
    add_box("BC_REACTOR_CYAN_RESIDUAL", (-2.15, 0.28, 0.88), (0.07, 0.12, 0.75), cyan, root, rotation=(0.0, 0.0, -0.18), bevel=0.04)
    return root


def build_network(materials) -> bpy.types.Object:
    root = create_root(ROOT_NAMES["network-architecture"])
    shell = materials["BC_ENV_MAT_BLACK_TITANIUM"]
    inner = materials["BC_ENV_MAT_GUNMETAL"]
    cyan = materials["BC_ENV_MAT_CYAN_ENERGY"]
    violet = materials["BC_ENV_MAT_VIOLET_ENERGY"]
    positions = ((-1.55, 0.6, 0.4), (1.05, 0.9, 1.65), (2.85, 1.4, -0.2), (0.7, 2.0, -1.85), (-2.65, 1.5, -1.25))
    for index, (x, depth, z) in enumerate(positions):
        if index == 0:
            add_cylinder("BC_NETWORK_COMMAND", (x, depth, z), 0.78, 0.42, shell, root, vertices=10)
            add_ico("BC_NETWORK_COMMAND_CORE", (x, depth - 0.28, z), (0.34, 0.4, 0.34), cyan, root, subdivisions=1)
            add_radial_beams("BC_NETWORK_COMMAND_BRACKET", 6, 1.08, (0.09, 0.16, 0.34), inner, root, depth=depth, angle_offset=0.1)
        elif index % 3 == 1:
            add_box(f"BC_NETWORK_NODE_{index:02d}", (x, depth, z), (0.48, 0.34, 0.55), shell, root, rotation=(0.0, 0.1 * index, 0.08), bevel=0.14)
            add_box(f"BC_NETWORK_NODE_CORE_{index:02d}", (x, depth - 0.36, z), (0.15, 0.12, 0.24), cyan, root, bevel=0.06)
        elif index % 3 == 2:
            add_ico(f"BC_NETWORK_NODE_{index:02d}", (x, depth, z), (0.56, 0.42, 0.56), inner, root, subdivisions=1)
            add_cylinder(f"BC_NETWORK_NODE_CORE_{index:02d}", (x, depth - 0.34, z), 0.16, 0.14, violet, root, vertices=8)
        else:
            add_cylinder(f"BC_NETWORK_NODE_{index:02d}", (x, depth, z), 0.48, 0.4, shell, root, vertices=8)
            add_box(f"BC_NETWORK_NODE_CORE_{index:02d}", (x, depth - 0.32, z), (0.2, 0.12, 0.2), cyan, root, rotation=(0.0, 0.0, 0.45), bevel=0.05)
        add_arc(f"BC_NETWORK_BRACKET_{index:02d}", 0.78 if index else 1.15, -2.4 + index * 0.12, 1.0 + index * 0.08, depth + 0.12, 0.055, inner, root, offset=(x, 0, z), samples=18)
    for lane in range(9):
        x = -4.4 + lane * 1.05
        height = 0.5 + (lane % 4) * 0.28
        add_box(f"BC_NETWORK_CITY_{lane:02d}", (x, 2.5, -2.8 + height * 0.5), (0.08 + (lane % 2) * 0.035, 0.18, height), inner, root, bevel=0.035)
    return root


def build_collection(materials) -> bpy.types.Object:
    root = create_root(ROOT_NAMES["collection-vault"])
    shell = materials["BC_ENV_MAT_BLACK_TITANIUM"]
    inner = materials["BC_ENV_MAT_GUNMETAL"]
    cyan = materials["BC_ENV_MAT_CYAN_ENERGY"]
    violet = materials["BC_ENV_MAT_VIOLET_ENERGY"]
    orange = materials["BC_ENV_MAT_TACTICAL_ORANGE"]
    for x in (-3.8, 3.8):
        add_box(f"BC_VAULT_RAIL_{x:+.0f}", (x, 1.5, 0.0), (0.13, 0.28, 3.25), inner, root, rotation=(0.0, 0.0, x * 0.012), bevel=0.07)
    # Skin: tall armor/display housing.
    add_box("BC_VAULT_SKIN_FRAME", (1.25, 0.9, 0.35), (0.92, 0.42, 1.75), shell, root, rotation=(0.0, -0.08, -0.04), bevel=0.18)
    add_ico("BC_VAULT_SKIN_CORE", (1.25, 0.42, 0.38), (0.48, 0.34, 1.05), cyan, root, subdivisions=1)
    add_box("BC_VAULT_SKIN_CROWN", (1.25, 0.72, 2.22), (1.08, 0.3, 0.13), inner, root, rotation=(0.0, -0.08, -0.04), bevel=0.08)
    # Badge: radial medallion housing.
    add_cylinder("BC_VAULT_BADGE_FRAME", (-1.65, 1.45, 1.1), 0.88, 0.4, inner, root, vertices=10)
    add_ico("BC_VAULT_BADGE_CORE", (-1.65, 1.1, 1.1), (0.4, 0.3, 0.4), violet, root, subdivisions=1)
    add_arc("BC_VAULT_BADGE_BRACKET", 1.15, -2.7, 1.45, 1.48, 0.08, shell, root, offset=(-1.65, 0, 1.1), samples=24)
    # Bundle: broad multi-cell vault housing.
    add_box("BC_VAULT_BUNDLE_FRAME", (2.8, 1.8, -1.7), (1.32, 0.48, 0.82), shell, root, rotation=(0.0, 0.1, 0.05), bevel=0.18)
    for index, offset in enumerate((-0.68, 0.0, 0.68)):
        add_box(f"BC_VAULT_BUNDLE_CELL_{index:02d}", (2.8 + offset, 1.28, -1.7), (0.22, 0.2, 0.48 + index * 0.06), orange if index == 1 else inner, root, rotation=(0.0, 0.1, 0.05), bevel=0.08)
    return root


def build_identity(materials) -> bpy.types.Object:
    root = create_root(ROOT_NAMES["identity-frame"])
    shell = materials["BC_ENV_MAT_BLACK_TITANIUM"]
    inner = materials["BC_ENV_MAT_GUNMETAL"]
    cyan = materials["BC_ENV_MAT_CYAN_ENERGY"]
    violet = materials["BC_ENV_MAT_VIOLET_ENERGY"]
    add_arc("BC_ID_ARC_LEFT", 2.65, 1.35, 3.45, 0.4, 0.11, shell, root, offset=(-0.25, 0, 0.15))
    add_arc("BC_ID_ARC_RIGHT", 3.25, -1.35, 0.82, 0.85, 0.09, inner, root, offset=(0.3, 0, -0.1))
    add_arc("BC_ID_ARC_ENERGY", 1.85, -2.7, 1.8, 0.05, 0.055, cyan, root, offset=(0.15, 0, 0.2))
    column_positions = (-3.1, -2.15, -1.0, 0.25, 1.55, 2.55, 3.3)
    for index, x in enumerate(column_positions):
        height = 1.0 + (3 - abs(index - 3)) * 0.42
        add_box(f"BC_ID_COLUMN_{index:02d}", (x, 1.35, -1.75 + height * 0.45), (0.09, 0.22, height), inner, root, rotation=(0.0, 0.0, (index - 3) * -0.025), bevel=0.045)
    add_box("BC_ID_AXIS", (0.25, 0.8, 0.25), (0.04, 0.16, 3.25), cyan, root, bevel=0.025)
    add_ico("BC_ID_CORE", (0.25, 0.42, 0.65), (0.34, 0.28, 0.44), violet, root, subdivisions=1)
    # Crown-like framing, not a Crown asset or candidate.
    for index, (x, height) in enumerate(((-1.35, 1.35), (-0.55, 1.75), (0.25, 2.15), (1.05, 1.62), (1.75, 1.22))):
        add_box(f"BC_ID_SPIRE_FRAME_{index:02d}", (x, 1.55, 1.2 + height * 0.45), (0.11, 0.24, height * 0.5), shell, root, rotation=(0.0, 0.0, (x - 0.25) * -0.045), bevel=0.07)
    return root


def hierarchy(root: bpy.types.Object) -> list[bpy.types.Object]:
    result = [root]
    stack = list(root.children)
    while stack:
        obj = stack.pop()
        result.append(obj)
        stack.extend(obj.children)
    return result


def join_by_material(root: bpy.types.Object) -> None:
    groups: dict[str, list[bpy.types.Object]] = {}
    for obj in hierarchy(root):
        if obj.type != "MESH" or not obj.data.materials:
            continue
        groups.setdefault(obj.data.materials[0].name, []).append(obj)
    for material_name, objects in groups.items():
        if len(objects) == 1:
            objects[0].name = f"{root.name}_{material_name.removeprefix('BC_ENV_MAT_')}"
            continue
        bpy.ops.object.select_all(action="DESELECT")
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        bpy.ops.object.join()
        joined = bpy.context.object
        joined.name = f"{root.name}_{material_name.removeprefix('BC_ENV_MAT_')}"
        joined.parent = root
        joined.select_set(False)


def mesh_stats(root: bpy.types.Object) -> dict[str, int]:
    triangles = 0
    meshes = 0
    materials = set()
    for obj in hierarchy(root):
        if obj.type != "MESH":
            continue
        meshes += 1
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
        materials.update(material.name for material in obj.data.materials)
    return {"triangles": triangles, "drawCalls": meshes, "materials": len(materials)}


def export_asset(root: bpy.types.Object, output: Path) -> dict:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in hierarchy(root):
        obj.select_set(True)
    bpy.context.view_layer.objects.active = root
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=False,
        export_texcoords=False,
        export_normals=True,
        export_tangents=False,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_skins=False,
        export_morph=False,
    )
    stats = mesh_stats(root)
    stats.update({
        "bytes": output.stat().st_size,
        "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
        "file": output.name,
    })
    if stats["triangles"] > 30_000 or stats["drawCalls"] > 5 or stats["materials"] > 5 or stats["bytes"] > 1_572_864:
        raise RuntimeError(f"Asset budget failed for {root.name}: {stats}")
    return stats


def look_at(obj: bpy.types.Object, target) -> None:
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def setup_preview() -> bpy.types.Object:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 768
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"
    world = bpy.data.worlds.new("BC_ENV_WORLD") if not scene.world else scene.world
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.002, 0.004, 0.008, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.16
    bpy.ops.object.camera_add(location=(5.7, -10.5, 4.6))
    camera = bpy.context.object
    camera.name = "BC_PREVIEW_CAMERA"
    camera.data.lens = 62
    look_at(camera, (0.0, 0.7, 0.1))
    scene.camera = camera
    lights = (
        ("BC_KEY", "AREA", (3.8, -4.8, 6.2), (0.58, 0.8, 1.0), 1150, 5.0),
        ("BC_RIM", "AREA", (-4.5, 1.8, 3.5), (0.05, 0.58, 1.0), 980, 4.0),
        ("BC_FILL", "AREA", (-2.8, -3.5, -1.2), (0.34, 0.42, 0.5), 520, 5.0),
    )
    for name, light_type, location, color, energy, size in lights:
        data = bpy.data.lights.new(name, light_type)
        data.color = color
        data.energy = energy
        data.shape = "DISK"
        data.size = size
        light = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(light)
        light.location = location
        look_at(light, (0.0, 0.5, 0.0))
    return camera


def render_previews(roots: dict[str, bpy.types.Object], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    camera = setup_preview()
    camera_positions = {
        "world-gate": ((5.6, -10.8, 3.8), (0.0, 0.6, 0.0), 60),
        "crown-front-reactor": ((5.4, -10.2, 3.4), (0.0, 0.65, 0.0), 62),
        "network-architecture": ((5.8, -11.2, 4.5), (0.0, 1.2, -0.1), 58),
        "collection-vault": ((5.6, -10.6, 3.9), (0.2, 1.1, 0.0), 60),
        "identity-frame": ((5.2, -10.0, 4.0), (0.0, 0.9, 0.1), 62),
    }
    for asset_id, root in roots.items():
        for candidate in roots.values():
            hidden = candidate is not root
            for obj in hierarchy(candidate):
                obj.hide_render = hidden
        location, target, lens = camera_positions[asset_id]
        camera.location = location
        camera.data.lens = lens
        look_at(camera, target)
        bpy.context.scene.render.filepath = str(output_dir / f"{asset_id}.png")
        bpy.ops.render.render(write_still=True)


def arrange_master_gallery(roots: dict[str, bpy.types.Object]) -> None:
    positions = {
        "world-gate": (-16.0, 0.0, 0.0),
        "crown-front-reactor": (-8.0, 0.0, 0.0),
        "network-architecture": (0.0, 0.0, 0.0),
        "collection-vault": (8.0, 0.0, 0.0),
        "identity-frame": (16.0, 0.0, 0.0),
    }
    for asset_id, root in roots.items():
        root.location = positions[asset_id]
        for obj in hierarchy(root):
            obj.hide_render = False
            obj.hide_viewport = False
    camera = bpy.data.objects.get("BC_PREVIEW_CAMERA")
    if camera:
        camera.location = (0.0, -38.0, 13.0)
        camera.data.lens = 58
        look_at(camera, (0.0, 0.8, 0.0))


def save_master(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(path))


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", required=True)
    parser.add_argument("--preview-dir", required=True)
    return parser.parse_args(argv)


def main() -> None:
    separator = sys.argv.index("--") if "--" in sys.argv else len(sys.argv)
    args = parse_args(sys.argv[separator + 1 :])
    repo_root = Path(args.repo_root).resolve()
    preview_dir = Path(args.preview_dir).resolve()
    public_dir = repo_root / "apps/site/public/experience/environments/blender-v1"
    source_dir = repo_root / "art-source/blackcrown-environments/blender-v1"
    clear_scene()
    materials = create_materials()
    roots = {
        "world-gate": build_world_gate(materials),
        "crown-front-reactor": build_reactor(materials),
        "network-architecture": build_network(materials),
        "collection-vault": build_collection(materials),
        "identity-frame": build_identity(materials),
    }
    for root in roots.values():
        join_by_material(root)
    stats = {asset_id: export_asset(root, public_dir / EXPORT_FILES[asset_id]) for asset_id, root in roots.items()}
    manifest = {
        "schemaVersion": 1,
        "enabled": False,
        "reviewOnly": True,
        "assetId": "blackcrown-blender-site-elements-v1",
        "override": "bcenv=blender",
        "assets": {
            asset_id: {
                "url": f"/experience/environments/blender-v1/{EXPORT_FILES[asset_id]}",
                "maxBytes": 1_572_864,
                "maxTriangles": 30_000,
                "sha256": stats[asset_id]["sha256"],
                "bytes": stats[asset_id]["bytes"],
                "triangles": stats[asset_id]["triangles"],
                "drawCalls": stats[asset_id]["drawCalls"],
                "materials": stats[asset_id]["materials"],
            }
            for asset_id in ASSET_IDS
        },
    }
    public_dir.mkdir(parents=True, exist_ok=True)
    (public_dir / "site-elements.manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    source_dir.mkdir(parents=True, exist_ok=True)
    (source_dir / "source-manifest.json").write_text(json.dumps({
        "generator": "tools/blender/blackcrown-environments/generate_site_elements.py",
        "blenderVersion": bpy.app.version_string,
        "generatedAssets": stats,
        "externalAssets": [],
    }, indent=2) + "\n", encoding="utf-8")
    render_previews(roots, preview_dir)
    arrange_master_gallery(roots)
    save_master(source_dir / "blackcrown-site-elements-v1.blend")
    (preview_dir / "generation-report.json").write_text(json.dumps({
        "blenderVersion": bpy.app.version_string,
        "masterBlend": str(source_dir / "blackcrown-site-elements-v1.blend"),
        "manifest": str(public_dir / "site-elements.manifest.json"),
        "assets": stats,
    }, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
