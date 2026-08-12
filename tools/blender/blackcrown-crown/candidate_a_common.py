from __future__ import annotations

import argparse
import json
import math
import random
import sys
from array import array
from pathlib import Path

import bpy
from mathutils import Vector


ALLOWED_MATERIALS = (
    "BC_MAT_SHELL_TITANIUM",
    "BC_MAT_INNER_GUNMETAL",
    "BC_MAT_CARBON",
    "BC_MAT_CORE_GLASS",
    "BC_MAT_CORE_ENERGY",
    "BC_MAT_ENERGY_CYAN",
    "BC_MAT_ENERGY_ORANGE",
    "BC_MAT_PORTAL",
)


def script_args(description: str) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=description)
    return parser


def argv_after_separator() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def load_config(path: str | Path) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def clear_scene() -> None:
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.meshes, bpy.data.curves, bpy.data.armatures, bpy.data.materials, bpy.data.images):
        for item in list(collection):
            if item.users == 0:
                collection.remove(item)


def configure_scene(config: dict) -> None:
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.world.color = (0.002, 0.004, 0.008)
    random.seed(int(config["seed"]))


def _write_generated_image(path: Path, size: int, mode: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image = bpy.data.images.new(path.stem, width=size, height=size, alpha=True, float_buffer=False)
    pixels = array("f")
    for y in range(size):
        for x in range(size):
            wave = 0.5 + 0.5 * math.sin(x * 0.071 + y * 0.019)
            grain = 0.5 + 0.5 * math.sin(x * 0.311 - y * 0.127)
            if mode == "crown_base":
                value = 0.16 + wave * 0.035 + grain * 0.012
                pixels.extend((value * 0.82, value * 0.94, value, 1.0))
            elif mode == "carbon_base":
                weave = 0.075 if ((x // 8) + (y // 8)) % 2 else 0.045
                pixels.extend((weave, weave * 1.12, weave * 1.25, 1.0))
            elif mode.endswith("normal"):
                nx = 0.5 + (wave - 0.5) * 0.025
                ny = 0.5 + (grain - 0.5) * 0.025
                pixels.extend((nx, ny, 1.0, 1.0))
            elif mode == "crown_orm":
                pixels.extend((1.0, 0.36 + wave * 0.08, 0.78, 1.0))
            else:
                pixels.extend((1.0, 0.68 + grain * 0.08, 0.18, 1.0))
    image.pixels.foreach_set(pixels)
    image.filepath_raw = str(path)
    image.file_format = "PNG"
    image.save()
    bpy.data.images.remove(image)


def ensure_texture_sources(texture_dir: Path, size: int) -> dict[str, Path]:
    definitions = {
        "crown_base": "BC_Crown_BaseColor.png",
        "crown_normal": "BC_Crown_Normal.png",
        "crown_orm": "BC_Crown_ORM.png",
        "carbon_base": "BC_Carbon_BaseColor.png",
        "carbon_normal": "BC_Carbon_Normal.png",
        "carbon_orm": "BC_Carbon_ORM.png",
    }
    paths = {key: texture_dir / filename for key, filename in definitions.items()}
    for key, path in paths.items():
        _write_generated_image(path, size, key)
    return paths


def _principled(material: bpy.types.Material) -> bpy.types.Node:
    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    material.node_tree.links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return shader


def _input(shader: bpy.types.Node, *names: str):
    for name in names:
        if name in shader.inputs:
            return shader.inputs[name]
    return None


def _attach_texture(material: bpy.types.Material, shader: bpy.types.Node, path: Path, target: str, non_color: bool = False) -> None:
    image = bpy.data.images.get(path.name) or bpy.data.images.load(str(path), check_existing=True)
    image.name = path.name
    if non_color:
        image.colorspace_settings.name = "Non-Color"
    node = material.node_tree.nodes.new("ShaderNodeTexImage")
    node.image = image
    node.label = path.stem
    if target == "base":
        material.node_tree.links.new(node.outputs["Color"], _input(shader, "Base Color"))
    elif target == "normal":
        normal = material.node_tree.nodes.new("ShaderNodeNormalMap")
        normal.inputs["Strength"].default_value = 0.28
        material.node_tree.links.new(node.outputs["Color"], normal.inputs["Color"])
        material.node_tree.links.new(normal.outputs["Normal"], _input(shader, "Normal"))
    elif target == "orm":
        separate = material.node_tree.nodes.new("ShaderNodeSeparateColor")
        material.node_tree.links.new(node.outputs["Color"], separate.inputs["Color"])
        material.node_tree.links.new(separate.outputs["Green"], _input(shader, "Roughness"))
        material.node_tree.links.new(separate.outputs["Blue"], _input(shader, "Metallic"))


def create_materials(texture_dir: Path, size: int) -> dict[str, bpy.types.Material]:
    textures = ensure_texture_sources(texture_dir, size)
    specs = {
        "BC_MAT_SHELL_TITANIUM": ((0.025, 0.035, 0.048, 1.0), 0.78, 0.36),
        "BC_MAT_INNER_GUNMETAL": ((0.055, 0.072, 0.092, 1.0), 0.62, 0.50),
        "BC_MAT_CARBON": ((0.012, 0.016, 0.022, 1.0), 0.18, 0.72),
        "BC_MAT_CORE_GLASS": ((0.035, 0.12, 0.16, 1.0), 0.18, 0.22),
        "BC_MAT_CORE_ENERGY": ((0.02, 0.35, 0.48, 1.0), 0.05, 0.26),
        "BC_MAT_ENERGY_CYAN": ((0.015, 0.24, 0.32, 1.0), 0.08, 0.32),
        "BC_MAT_ENERGY_ORANGE": ((0.42, 0.075, 0.012, 1.0), 0.10, 0.38),
        "BC_MAT_PORTAL": ((0.18, 0.035, 0.008, 1.0), 0.28, 0.44),
    }
    materials = {}
    for name, (color, metalness, roughness) in specs.items():
        material = bpy.data.materials.new(name)
        material.use_nodes = True
        shader = _principled(material)
        _input(shader, "Base Color").default_value = color
        _input(shader, "Metallic").default_value = metalness
        _input(shader, "Roughness").default_value = roughness
        if name == "BC_MAT_SHELL_TITANIUM":
            coat = _input(shader, "Coat Weight", "Clearcoat")
            if coat:
                coat.default_value = 0.16
            _attach_texture(material, shader, textures["crown_base"], "base")
            _attach_texture(material, shader, textures["crown_normal"], "normal", True)
            _attach_texture(material, shader, textures["crown_orm"], "orm", True)
        elif name == "BC_MAT_CARBON":
            _attach_texture(material, shader, textures["carbon_base"], "base")
            _attach_texture(material, shader, textures["carbon_normal"], "normal", True)
            _attach_texture(material, shader, textures["carbon_orm"], "orm", True)
        if "ENERGY" in name or name == "BC_MAT_PORTAL":
            emission = _input(shader, "Emission Color", "Emission")
            strength = _input(shader, "Emission Strength")
            if emission:
                emission.default_value = color
            if strength:
                strength.default_value = 2.0 if name == "BC_MAT_CORE_ENERGY" else 0.75
        if name == "BC_MAT_CORE_GLASS":
            alpha = _input(shader, "Alpha")
            if alpha:
                alpha.default_value = 0.48
            transmission = _input(shader, "Transmission Weight", "Transmission")
            if transmission:
                transmission.default_value = 0.16
            material.surface_render_method = "DITHERED"
        materials[name] = material
    return materials


def _mesh_object(name: str, vertices: list[tuple[float, float, float]], faces: list[tuple[int, ...]], material: bpy.types.Material) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(f"{name}_MESH")
    mesh.from_pydata(vertices, [], faces)
    mesh.update(calc_edges=True)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = False
    return obj


def prism_profile(name: str, profile: list[tuple[float, float]], depth: float, material: bpy.types.Material) -> bpy.types.Object:
    vertices = []
    for y in (-depth / 2, depth / 2):
        vertices.extend((x, y, z) for x, z in profile)
    count = len(profile)
    faces = [tuple(range(count)), tuple(range(count, count * 2))[::-1]]
    for index in range(count):
        nxt = (index + 1) % count
        faces.append((index, nxt, count + nxt, count + index))
    return _mesh_object(name, vertices, faces, material)


def add_bevel(obj: bpy.types.Object, width: float, segments: int) -> None:
    modifier = obj.modifiers.new("BC_CHAMFER", "BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.select_set(False)


def smart_uv(obj: bpy.types.Object) -> None:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")
    obj.select_set(False)


def join_objects(objects: list[bpy.types.Object], name: str) -> bpy.types.Object:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    result = objects[0]
    result.name = name
    result.data.name = f"{name}_MESH"
    return result


def add_vertex_group(obj: bpy.types.Object, name: str) -> None:
    group = obj.vertex_groups.new(name=name)
    group.add(list(range(len(obj.data.vertices))), 1.0, "REPLACE")


def apply_transform(obj: bpy.types.Object) -> None:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.select_set(False)


def parent(child: bpy.types.Object, owner: bpy.types.Object) -> None:
    child.parent = owner


def _add_torus(name: str, major: float, minor: float, segments: int, tube_segments: int, material: bpy.types.Material, scale=(1.0, 1.0, 1.0)) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=segments, minor_segments=tube_segments)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_MESH"
    obj.rotation_euler[0] = math.radians(90)
    obj.scale = scale
    apply_transform(obj)
    obj.data.materials.append(material)
    return obj


def _add_ico(name: str, radius: float, subdivisions: int, material: bpy.types.Material, scale=(1.0, 1.0, 1.0)) -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=radius)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = f"{name}_MESH"
    obj.scale = (scale[0], scale[2], scale[1])
    apply_transform(obj)
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def _empty(name: str, display: str = "PLAIN_AXES") -> bpy.types.Object:
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = display
    obj.empty_display_size = 0.12
    bpy.context.collection.objects.link(obj)
    return obj


def create_shell(config: dict, lod: str, root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> bpy.types.Object:
    detail = config["lods"][lod]
    segment_count = int(config["segmentCount"])
    width = float(config["dimensions"]["width"])
    center = (segment_count - 1) / 2
    heights = [1.43, 1.55, 1.68, 1.79, 1.93, 1.76, 1.65, 1.52, 1.40]
    armature_data = bpy.data.armatures.new("BC_SHELL_ARMATURE")
    armature = bpy.data.objects.new("BC_SHELL_ROOT", armature_data)
    bpy.context.collection.objects.link(armature)
    parent(armature, root)
    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bones = []
    for index in range(segment_count):
        normalized = (index - center) / center
        x = normalized * (width * 0.43)
        z = 0.12 - abs(normalized) ** 1.35 * 0.32
        shoulder = 0.80 + (1.0 - abs(normalized)) * 0.12
        segment = armature_data.edit_bones.new(f"BC_SEG_{index:02d}")
        segment.head = (x, -z, 0.10)
        segment.tail = (x, -z, shoulder)
        spire = armature_data.edit_bones.new(f"BC_SPIRE_{index:02d}")
        spire.head = (x, -z, shoulder)
        spire.tail = (x, -z, heights[index])
        spire.parent = segment
        spire.use_connect = False
        bones.append((segment.name, spire.name, x, z, shoulder, heights[index], normalized))
    bpy.ops.object.mode_set(mode="OBJECT")
    armature.select_set(False)

    parts = []
    for index, (segment_name, spire_name, x, z, shoulder, height, normalized) in enumerate(bones):
        base_half = 0.115 + (1.0 - abs(normalized)) * 0.018
        top_half = base_half * 0.72
        body = prism_profile(
            f"BC_SHELL_BODY_{index:02d}",
            [
                (-base_half, 0.10),
                (base_half, 0.10),
                (base_half * 0.92, 0.30),
                (top_half, shoulder),
                (-top_half, shoulder),
                (-base_half * 0.92, 0.30),
            ],
            0.30 - abs(normalized) * 0.035,
            materials["BC_MAT_SHELL_TITANIUM"],
        )
        body.location = (x, -z, 0.0)
        body.rotation_euler[2] = normalized * 0.22
        apply_transform(body)
        add_bevel(body, 0.018 if lod == "lod0" else 0.014, int(detail["bevelSegments"]))
        smart_uv(body)
        add_vertex_group(body, segment_name)
        parts.append(body)

        channel = prism_profile(
            f"BC_SHELL_CHANNEL_{index:02d}",
            [(-0.018, 0.34), (0.018, 0.34), (0.014, shoulder - 0.07), (-0.014, shoulder - 0.07)],
            0.018,
            materials["BC_MAT_CORE_ENERGY"],
        )
        channel.location = (x, -(z + 0.174), 0.0)
        channel.rotation_euler[2] = normalized * 0.22
        apply_transform(channel)
        add_bevel(channel, 0.004, 1)
        add_vertex_group(channel, segment_name)
        parts.append(channel)

        tip_half = 0.020 + abs(normalized) * 0.006
        spire = prism_profile(
            f"BC_SHELL_SPIRE_{index:02d}",
            [
                (-top_half, shoulder),
                (top_half, shoulder),
                (top_half * 0.82, shoulder + 0.24),
                (tip_half * 1.8, height - 0.16),
                (tip_half, height - 0.06),
                (0.0, height),
                (-tip_half, height - 0.06),
                (-tip_half * 1.8, height - 0.16),
                (-top_half * 0.82, shoulder + 0.24),
            ],
            0.24 - abs(normalized) * 0.025,
            materials["BC_MAT_SHELL_TITANIUM"],
        )
        spire.location = (x, -z, 0.0)
        spire.rotation_euler[2] = normalized * 0.22
        apply_transform(spire)
        add_bevel(spire, 0.015 if lod == "lod0" else 0.011, int(detail["bevelSegments"]))
        smart_uv(spire)
        add_vertex_group(spire, spire_name)
        parts.append(spire)

        for rail_index in range(int(detail["panelDetail"])):
            rail_y = 0.27 + rail_index * 0.20
            rail = prism_profile(
                f"BC_PANEL_RAIL_{index:02d}_{rail_index}",
                [(-base_half * 0.82, rail_y), (base_half * 0.82, rail_y), (base_half * 0.72, rail_y + 0.045), (-base_half * 0.72, rail_y + 0.045)],
                0.034,
                materials["BC_MAT_SHELL_TITANIUM"],
            )
            rail.location = (x, -(z + 0.17), 0.0)
            apply_transform(rail)
            add_bevel(rail, 0.006, max(1, int(detail["bevelSegments"]) - 1))
            smart_uv(rail)
            add_vertex_group(rail, segment_name)
            parts.append(rail)

    shell_mesh = join_objects(parts, "BC_SHELL_SKIN")
    triangulate = shell_mesh.modifiers.new("BC_EXPORT_TRIANGULATE", "TRIANGULATE")
    triangulate.quad_method = "BEAUTY"
    triangulate.ngon_method = "BEAUTY"
    bpy.context.view_layer.objects.active = shell_mesh
    shell_mesh.select_set(True)
    bpy.ops.object.modifier_apply(modifier=triangulate.name)
    shell_mesh.select_set(False)
    modifier = shell_mesh.modifiers.new("BC_SHELL_BIND", "ARMATURE")
    modifier.object = armature
    parent(shell_mesh, armature)
    return armature


def create_base(config: dict, lod: str, root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    detail = config["lods"][lod]
    arc = _add_torus(
        "BC_BASE_FIELD",
        0.88,
        0.055 if lod != "lod2" else 0.045,
        int(detail["ringSegments"]),
        int(detail["ringTubeSegments"]),
        materials["BC_MAT_INNER_GUNMETAL"],
        scale=(1.18, 0.58, 1.0),
    )
    arc.location = (0.0, 0.09, 0.55)
    parent(arc, root)

    if lod == "lod0":
        braces = []
        for side in (-1, 1):
            brace = prism_profile(
                f"BC_INNER_BRACE_{'L' if side < 0 else 'R'}",
                [(-0.045, 0.18), (0.045, 0.18), (0.035, 0.92), (-0.035, 0.92)],
                0.12,
                materials["BC_MAT_CARBON"],
            )
            brace.location = (side * 0.56, 0.08, 0.0)
            brace.rotation_euler[1] = side * 0.28
            apply_transform(brace)
            add_bevel(brace, 0.01, 2)
            smart_uv(brace)
            braces.append(brace)
        structure = join_objects(braces, "BC_INNER_STRUCTURE")
        parent(structure, root)


def create_core(config: dict, lod: str, root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> bpy.types.Object:
    detail = config["lods"][lod]
    core_y = float(config["dimensions"]["coreY"])
    core = _empty("BC_CORE_ROOT", "SPHERE")
    core.location = (0.0, 0.0, core_y)
    parent(core, root)

    ring_specs = (
        ("BC_RING_INNER", 0.31, 0.024, (1.0, 0.78, 1.0), 0.02),
        ("BC_RING_MIDDLE", 0.48, 0.031, (1.0, 0.70, 1.0), -0.03),
        ("BC_RING_OUTER", 0.68, 0.039, (1.0, 0.64, 1.0), -0.08),
    )
    for name, major, minor, scale, z in ring_specs:
        ring = _add_torus(name, major, minor, int(detail["ringSegments"]), int(detail["ringTubeSegments"]), materials["BC_MAT_INNER_GUNMETAL"], scale)
        ring.location = (0.0, -z, 0.0)
        parent(ring, core)

    if lod == "lod0":
        containment = _add_ico("BC_CORE_CONTAINMENT", 0.28, int(detail["coreSubdivisions"]), materials["BC_MAT_CORE_GLASS"], (1.0, 1.08, 0.92))
        volume = _add_ico("BC_CORE_VOLUME", 0.20, max(2, int(detail["coreSubdivisions"]) - 1), materials["BC_MAT_CORE_ENERGY"], (1.0, 1.0, 0.9))
        nucleus = _add_ico("BC_CORE_NUCLEUS", 0.105, 2, materials["BC_MAT_CORE_ENERGY"], (0.9, 1.18, 0.9))
        cage = _add_torus("BC_CORE_CAGE", 0.34, 0.018, 48, 6, materials["BC_MAT_INNER_GUNMETAL"], (1.0, 0.82, 1.0))
        cage.rotation_euler[0] = math.radians(58)
        for obj in (containment, volume, nucleus, cage):
            parent(obj, core)
    elif lod == "lod1":
        containment = _add_ico("BC_CORE_CONTAINMENT", 0.26, int(detail["coreSubdivisions"]), materials["BC_MAT_CORE_GLASS"], (1.0, 1.08, 0.92))
        volume = _add_ico("BC_CORE_VOLUME", 0.15, 1, materials["BC_MAT_CORE_ENERGY"], (1.0, 1.15, 0.9))
        parent(containment, core)
        parent(volume, core)
        parent(_empty("BC_CORE_NUCLEUS", "SPHERE"), core)
        parent(_empty("BC_CORE_CAGE", "CIRCLE"), core)
    else:
        volume = _add_ico("BC_CORE_VOLUME", 0.22, 1, materials["BC_MAT_CORE_ENERGY"], (1.0, 1.06, 0.9))
        parent(volume, core)
        parent(_empty("BC_CORE_CONTAINMENT", "SPHERE"), core)
        parent(_empty("BC_CORE_NUCLEUS", "SPHERE"), core)
        parent(_empty("BC_CORE_CAGE", "CIRCLE"), core)

    cyan = _empty("BC_ENERGY_CYAN", "SPHERE")
    cyan.empty_display_size = 0.05
    parent(cyan, core)
    return core


def create_portal(config: dict, lod: str, root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> bpy.types.Object:
    detail = config["lods"][lod]
    core_y = float(config["dimensions"]["coreY"])
    portal = _empty("BC_PORTAL_ROOT", "CIRCLE")
    portal.location = (0.0, 0.34, core_y)
    parent(portal, root)
    parts = []
    aperture = _add_torus(
        "BC_PORTAL_APERTURE_SOURCE",
        0.52,
        0.045,
        int(detail["ringSegments"]),
        int(detail["ringTubeSegments"]),
        materials["BC_MAT_PORTAL"],
        (1.0, 0.78, 1.0),
    )
    parts.append(aperture)
    tunnel_ring = _add_torus(
        "BC_PORTAL_TUNNEL_SOURCE",
        0.40,
        0.036,
        max(24, int(detail["ringSegments"]) // 2),
        max(4, int(detail["ringTubeSegments"])),
        materials["BC_MAT_PORTAL"],
        (1.0, 0.76, 1.0),
    )
    tunnel_ring.location.y = 0.16
    parts.append(tunnel_ring)
    spoke_count = 8 if lod == "lod0" else 6 if lod == "lod1" else 4
    for index in range(spoke_count):
        angle = (index / spoke_count) * math.tau
        bpy.ops.mesh.primitive_cube_add(location=(math.cos(angle) * 0.39, 0.055, math.sin(angle) * 0.30))
        spoke = bpy.context.object
        spoke.name = f"BC_PORTAL_SPOKE_{index:02d}"
        spoke.scale = (0.16, 0.025, 0.018)
        spoke.rotation_euler[1] = -angle
        apply_transform(spoke)
        spoke.data.materials.append(materials["BC_MAT_PORTAL"])
        add_bevel(spoke, 0.008, max(1, int(detail["bevelSegments"]) - 1))
        parts.append(spoke)
    aperture = join_objects(parts, "BC_PORTAL_APERTURE")
    parent(aperture, portal)
    tunnel = _empty("BC_PORTAL_TUNNEL", "CIRCLE")
    tunnel.location.y = 0.18
    parent(tunnel, portal)
    shutters = _empty("BC_PORTAL_SHUTTERS", "CIRCLE")
    parent(shutters, portal)
    orange = _empty("BC_ENERGY_ORANGE", "SPHERE")
    orange.empty_display_size = 0.05
    parent(orange, portal)
    return portal


def build_candidate_scene(config: dict, lod: str, texture_dir: Path) -> dict:
    clear_scene()
    configure_scene(config)
    materials = create_materials(texture_dir, int(config["textureSize"]))
    root = _empty("BC_CROWN_ROOT", "ARROWS")
    root.empty_display_size = 0.18
    create_shell(config, lod, root, materials)
    create_base(config, lod, root, materials)
    create_core(config, lod, root, materials)
    create_portal(config, lod, root, materials)
    bpy.context.view_layer.update()
    return {"root": root, "materials": materials}


def selected_hierarchy(root: bpy.types.Object) -> list[bpy.types.Object]:
    result = []
    stack = [root]
    while stack:
        current = stack.pop()
        result.append(current)
        stack.extend(current.children)
    return result


def mesh_stats() -> dict:
    triangles = 0
    draw_calls = 0
    mesh_count = 0
    materials = set()
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        mesh_count += 1
        evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        triangles += len(mesh.loop_triangles)
        used = {polygon.material_index for polygon in mesh.polygons} or {0}
        draw_calls += len(used)
        for slot in obj.material_slots:
            if slot.material:
                materials.add(slot.material.name)
        evaluated.to_mesh_clear()
    return {"triangles": triangles, "drawCalls": draw_calls, "meshes": mesh_count, "materials": sorted(materials)}
