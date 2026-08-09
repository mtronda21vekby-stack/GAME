from __future__ import annotations

import json
import math
import random
from array import array
from pathlib import Path

import bpy

from candidate_a_common import (
    _add_ico,
    _empty,
    _input,
    _mesh_object,
    _principled,
    add_bevel,
    add_vertex_group,
    apply_transform,
    clear_scene,
    configure_scene,
    join_objects,
    mesh_stats,
    parent,
    prism_profile,
    selected_hierarchy,
    smart_uv,
)


ALLOWED_MATERIALS = (
    "BC_MAT_SHELL_TITANIUM",
    "BC_MAT_INNER_GUNMETAL",
    "BC_MAT_CARBON",
    "BC_MAT_CORE_GLASS",
    "BC_MAT_CORE_ENERGY",
    "BC_MAT_PORTAL",
)


def _write_texture(path: Path, size: int, mode: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image = bpy.data.images.new(path.stem, width=size, height=size, alpha=True, float_buffer=False)
    pixels = array("f")
    for y in range(size):
        for x in range(size):
            brush = 0.5 + 0.5 * math.sin(x * 0.23 + math.sin(y * 0.017) * 1.7)
            long_wave = 0.5 + 0.5 * math.sin(x * 0.031 + y * 0.007)
            weave = 1.0 if ((x // 7) + (y // 7)) % 2 else 0.0
            if mode == "shell_base":
                value = 0.115 + brush * 0.018 + long_wave * 0.012
                pixels.extend((value * 0.78, value * 0.9, value, 1.0))
            elif mode == "shell_normal":
                pixels.extend((0.5 + (brush - 0.5) * 0.02, 0.5 + (long_wave - 0.5) * 0.012, 1.0, 1.0))
            elif mode == "shell_orm":
                pixels.extend((1.0, 0.42 + brush * 0.07, 0.73, 1.0))
            elif mode == "carbon_base":
                value = 0.024 + weave * 0.018 + long_wave * 0.006
                pixels.extend((value, value * 1.08, value * 1.18, 1.0))
            elif mode == "carbon_normal":
                offset = (weave - 0.5) * 0.018
                pixels.extend((0.5 + offset, 0.5 - offset, 1.0, 1.0))
            else:
                pixels.extend((1.0, 0.7 + long_wave * 0.06, 0.12, 1.0))
    image.pixels.foreach_set(pixels)
    image.filepath_raw = str(path)
    image.file_format = "PNG"
    image.save()
    bpy.data.images.remove(image)


def ensure_texture_sources(texture_dir: Path, size: int) -> dict[str, Path]:
    definitions = {
        "shell_base": "BCB_Shell_BaseColor.png",
        "shell_normal": "BCB_Shell_Normal.png",
        "shell_orm": "BCB_Shell_ORM.png",
        "carbon_base": "BCB_Carbon_BaseColor.png",
        "carbon_normal": "BCB_Carbon_Normal.png",
        "carbon_orm": "BCB_Carbon_ORM.png",
    }
    paths = {key: texture_dir / filename for key, filename in definitions.items()}
    for key, path in paths.items():
        _write_texture(path, size, key)
    return paths


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
        normal.inputs["Strength"].default_value = 0.2
        material.node_tree.links.new(node.outputs["Color"], normal.inputs["Color"])
        material.node_tree.links.new(normal.outputs["Normal"], _input(shader, "Normal"))
    else:
        separate = material.node_tree.nodes.new("ShaderNodeSeparateColor")
        material.node_tree.links.new(node.outputs["Color"], separate.inputs["Color"])
        material.node_tree.links.new(separate.outputs["Green"], _input(shader, "Roughness"))
        material.node_tree.links.new(separate.outputs["Blue"], _input(shader, "Metallic"))


def create_materials(texture_dir: Path, size: int) -> dict[str, bpy.types.Material]:
    textures = ensure_texture_sources(texture_dir, size)
    specs = {
        "BC_MAT_SHELL_TITANIUM": ((0.032, 0.043, 0.057, 1.0), 0.76, 0.42),
        "BC_MAT_INNER_GUNMETAL": ((0.07, 0.082, 0.10, 1.0), 0.62, 0.5),
        "BC_MAT_CARBON": ((0.014, 0.018, 0.024, 1.0), 0.2, 0.76),
        "BC_MAT_CORE_GLASS": ((0.025, 0.12, 0.15, 1.0), 0.12, 0.28),
        "BC_MAT_CORE_ENERGY": ((0.01, 0.31, 0.42, 1.0), 0.04, 0.3),
        "BC_MAT_PORTAL": ((0.34, 0.052, 0.007, 1.0), 0.32, 0.46),
    }
    result = {}
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
                coat.default_value = 0.12
            _attach_texture(material, shader, textures["shell_base"], "base")
            _attach_texture(material, shader, textures["shell_normal"], "normal", True)
            _attach_texture(material, shader, textures["shell_orm"], "orm", True)
        elif name == "BC_MAT_CARBON":
            _attach_texture(material, shader, textures["carbon_base"], "base")
            _attach_texture(material, shader, textures["carbon_normal"], "normal", True)
            _attach_texture(material, shader, textures["carbon_orm"], "orm", True)
        elif name in {"BC_MAT_CORE_ENERGY", "BC_MAT_PORTAL"}:
            emission = _input(shader, "Emission Color", "Emission")
            strength = _input(shader, "Emission Strength")
            if emission:
                emission.default_value = color
            if strength:
                strength.default_value = 1.8 if name == "BC_MAT_CORE_ENERGY" else 0.72
        elif name == "BC_MAT_CORE_GLASS":
            alpha = _input(shader, "Alpha")
            if alpha:
                alpha.default_value = 0.56
            material.surface_render_method = "DITHERED"
        result[name] = material
    return result


def _shell_grid(
    name: str,
    x_center: float,
    y_center: float,
    z0: float,
    z1: float,
    width0: float,
    width1: float,
    depth: float,
    camber: float,
    cross_samples: int,
    levels: int,
    lean: float,
    material: bpy.types.Material,
    group_name: str,
    channel_recess: bool,
) -> bpy.types.Object:
    vertices = []
    for side in (0, 1):
        for row in range(levels):
            t = row / (levels - 1)
            smooth_t = t * t * (3.0 - 2.0 * t)
            half_width = (width0 + (width1 - width0) * smooth_t) * 0.5
            center_shift = lean * (t ** 1.45)
            for column in range(cross_samples):
                u = (column / (cross_samples - 1)) * 2.0 - 1.0
                x = x_center + center_shift + u * half_width * (1.0 - 0.035 * math.cos(t * math.pi))
                z = z0 + (z1 - z0) * t
                crown = max(0.0, 1.0 - u * u)
                vertical = 0.55 + 0.45 * math.sin(t * math.pi)
                if side == 0:
                    y = y_center - depth * 0.5 - camber * crown * vertical
                    if channel_recess and abs(u) < 0.24 and 0.18 < t < 0.84:
                        edge = 1.0 - min(1.0, abs(u) / 0.24)
                        y += 0.026 * edge
                else:
                    y = y_center + depth * 0.5 + camber * crown * 0.18
                vertices.append((x, y, z))

    plane = levels * cross_samples
    faces = []
    for side in (0, 1):
        offset = side * plane
        for row in range(levels - 1):
            for column in range(cross_samples - 1):
                a = offset + row * cross_samples + column
                b = a + 1
                c = a + cross_samples + 1
                d = a + cross_samples
                faces.append((a, b, c, d) if side == 0 else (d, c, b, a))
    for row in range(levels - 1):
        for column in (0, cross_samples - 1):
            a = row * cross_samples + column
            b = (row + 1) * cross_samples + column
            faces.append((a, b, plane + b, plane + a))
    for row in (0, levels - 1):
        for column in range(cross_samples - 1):
            a = row * cross_samples + column
            b = a + 1
            faces.append((a, plane + a, plane + b, b))
    obj = _mesh_object(name, vertices, faces, material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    add_vertex_group(obj, group_name)
    return obj


def _channel_piece(
    name: str,
    x: float,
    y: float,
    z0: float,
    z1: float,
    half_width: float,
    depth: float,
    material: bpy.types.Material,
    group: str,
) -> bpy.types.Object:
    obj = prism_profile(
        name,
        [(-half_width, z0), (half_width, z0), (half_width * 0.82, z1), (-half_width * 0.82, z1)],
        depth,
        material,
    )
    obj.location = (x, y, 0.0)
    apply_transform(obj)
    add_vertex_group(obj, group)
    return obj


def create_shell(config: dict, lod: str, root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> bpy.types.Object:
    detail = config["lods"][lod]
    count = int(config["segmentCount"])
    center = (count - 1) / 2
    width = float(config["dimensions"]["width"])
    heights = [1.42, 1.54, 1.69, 1.83, 1.98, 1.80, 1.66, 1.52, 1.40]
    shoulders = [0.76, 0.79, 0.84, 0.89, 0.94, 0.88, 0.83, 0.78, 0.75]

    armature_data = bpy.data.armatures.new("BC_SHELL_ARMATURE")
    armature = bpy.data.objects.new("BC_SHELL_ROOT", armature_data)
    bpy.context.collection.objects.link(armature)
    parent(armature, root)
    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bones = []
    for index in range(count):
        normalized = (index - center) / center
        x = normalized * (width * 0.425)
        y = 0.10 + abs(normalized) ** 1.3 * 0.20
        shoulder = shoulders[index]
        segment = armature_data.edit_bones.new(f"BC_SEG_{index:02d}")
        segment.head = (x, y, 0.06)
        segment.tail = (x, y, shoulder)
        spire = armature_data.edit_bones.new(f"BC_SPIRE_{index:02d}")
        spire.head = (x, y, shoulder)
        spire.tail = (x, y, heights[index])
        spire.parent = segment
        spire.use_connect = False
        bones.append((index, normalized, x, y, shoulder, heights[index], segment.name, spire.name))
    bpy.ops.object.mode_set(mode="OBJECT")
    armature.select_set(False)

    shell_parts = []
    housing_parts = []
    diffuser_parts = []
    for index, normalized, x, y, shoulder, height, segment_name, spire_name in bones:
        inner = 1.0 - abs(normalized)
        body_width = 0.245 + inner * 0.035
        shoulder_width = body_width * (0.72 + inner * 0.04)
        depth = 0.31 - abs(normalized) * 0.035
        lean = normalized * 0.055
        body = _shell_grid(
            f"BCB_BODY_{index:02d}", x, y, 0.06, shoulder, body_width, shoulder_width,
            depth, 0.055 + inner * 0.018, int(detail["crossSamples"]), int(detail["bodyLevels"]),
            lean, materials["BC_MAT_SHELL_TITANIUM"], segment_name, True,
        )
        add_bevel(body, 0.012 if lod == "lod0" else 0.009, int(detail["bevelSegments"]))
        smart_uv(body)
        shell_parts.append(body)

        spire = _shell_grid(
            f"BCB_SPIRE_{index:02d}", x + lean, y, shoulder, height,
            shoulder_width, 0.006 + abs(normalized) * 0.002, depth * 0.82,
            0.048 + inner * 0.015, int(detail["crossSamples"]), int(detail["spireLevels"]),
            normalized * 0.028, materials["BC_MAT_SHELL_TITANIUM"], spire_name, True,
        )
        add_bevel(spire, 0.011 if lod == "lod0" else 0.008, int(detail["bevelSegments"]))
        smart_uv(spire)
        shell_parts.append(spire)

        front_y = y - depth * 0.5 - (0.055 + inner * 0.018) + 0.018
        channel_z0 = 0.22
        channel_z1 = shoulder + (height - shoulder) * 0.37
        diffuser_width = 0.017 + inner * 0.002
        diffuser = prism_profile(
            f"BCB_DIFFUSER_{index:02d}",
            [
                (0.0, channel_z0),
                (diffuser_width, channel_z0 + 0.055),
                (diffuser_width * 0.82, channel_z1 - 0.055),
                (0.0, channel_z1),
                (-diffuser_width * 0.82, channel_z1 - 0.055),
                (-diffuser_width, channel_z0 + 0.055),
            ],
            0.012,
            materials["BC_MAT_CORE_ENERGY"],
        )
        diffuser.location = (x + lean * 0.2, front_y + 0.012, 0.0)
        apply_transform(diffuser)
        add_vertex_group(diffuser, segment_name)
        add_bevel(diffuser, 0.003, 1)
        diffuser_parts.append(diffuser)

        if detail["channelHousing"]:
            rail_x = 0.027 + inner * 0.003
            for side in (-1.0, 1.0):
                housing = _channel_piece(
                    f"BCB_CHANNEL_HOUSING_{index:02d}_{'L' if side < 0 else 'R'}",
                    x + lean * 0.2 + side * rail_x, front_y - 0.002, channel_z0 - 0.025, channel_z1 + 0.025,
                    0.006, 0.018, materials["BC_MAT_INNER_GUNMETAL"], segment_name,
                )
                add_bevel(housing, 0.003, 1)
                housing_parts.append(housing)
            for suffix, zc in (("BASE", channel_z0 - 0.012), ("CAP", channel_z1 + 0.012)):
                cap = _channel_piece(
                    f"BCB_CHANNEL_{suffix}_{index:02d}", x + lean * 0.2, front_y - 0.002,
                    zc - 0.012, zc + 0.012, rail_x + 0.006, 0.018,
                    materials["BC_MAT_INNER_GUNMETAL"], segment_name,
                )
                add_bevel(cap, 0.003, 1)
                housing_parts.append(cap)

            collar = prism_profile(
                f"BCB_SHOULDER_COLLAR_{index:02d}",
                [
                    (-shoulder_width * 0.58, shoulder - 0.026),
                    (shoulder_width * 0.58, shoulder - 0.026),
                    (shoulder_width * 0.54, shoulder + 0.024),
                    (-shoulder_width * 0.54, shoulder + 0.024),
                ],
                depth * 0.9,
                materials["BC_MAT_INNER_GUNMETAL"],
            )
            collar.location = (x + lean, y, 0.0)
            apply_transform(collar)
            add_bevel(collar, 0.006, 1)
            add_vertex_group(collar, segment_name)
            housing_parts.append(collar)

    parts = shell_parts + housing_parts + diffuser_parts
    shell = join_objects(parts, "BC_SHELL_SKIN")
    triangulate = shell.modifiers.new("BC_EXPORT_TRIANGULATE", "TRIANGULATE")
    triangulate.quad_method = "BEAUTY"
    triangulate.ngon_method = "BEAUTY"
    bpy.context.view_layer.objects.active = shell
    shell.select_set(True)
    bpy.ops.object.modifier_apply(modifier=triangulate.name)
    shell.select_set(False)
    bind = shell.modifiers.new("BC_SHELL_BIND", "ARMATURE")
    bind.object = armature
    parent(shell, armature)
    return armature


def _broken_ring(
    name: str,
    radius_x: float,
    radius_z: float,
    band: float,
    depth: float,
    sections: int,
    gap_every: int,
    gap_size: int,
    material: bpy.types.Material,
) -> bpy.types.Object:
    vertices = []
    faces = []
    for index in range(sections):
        angle0 = (index / sections) * math.tau
        angle1 = ((index + 1) / sections) * math.tau
        if (index % gap_every) < gap_size:
            continue
        base = len(vertices)
        for y in (-depth * 0.5, depth * 0.5):
            for radius_offset in (-band * 0.5, band * 0.5):
                vertices.append(((radius_x + radius_offset) * math.cos(angle0), y, (radius_z + radius_offset) * math.sin(angle0)))
                vertices.append(((radius_x + radius_offset) * math.cos(angle1), y, (radius_z + radius_offset) * math.sin(angle1)))
        faces.extend(
            (
                (base, base + 1, base + 3, base + 2),
                (base + 4, base + 6, base + 7, base + 5),
                (base, base + 4, base + 5, base + 1),
                (base + 2, base + 3, base + 7, base + 6),
                (base, base + 2, base + 6, base + 4),
                (base + 1, base + 5, base + 7, base + 3),
            )
        )
    return _mesh_object(name, vertices, faces, material)


def _upper_arc(
    name: str,
    radius_x: float,
    radius_z: float,
    z_center: float,
    band: float,
    depth: float,
    sections: int,
    material: bpy.types.Material,
) -> bpy.types.Object:
    vertices = []
    faces = []
    for index in range(sections):
        angle0 = (index / sections) * math.pi
        angle1 = ((index + 1) / sections) * math.pi
        base = len(vertices)
        for y in (-depth * 0.5, depth * 0.5):
            for offset in (-band * 0.5, band * 0.5):
                vertices.append(((radius_x + offset) * math.cos(angle0), y, z_center + (radius_z + offset) * math.sin(angle0)))
                vertices.append(((radius_x + offset) * math.cos(angle1), y, z_center + (radius_z + offset) * math.sin(angle1)))
        faces.extend(((base, base + 1, base + 3, base + 2), (base + 4, base + 6, base + 7, base + 5),
                      (base, base + 4, base + 5, base + 1), (base + 2, base + 3, base + 7, base + 6),
                      (base, base + 2, base + 6, base + 4), (base + 1, base + 5, base + 7, base + 3)))
    return _mesh_object(name, vertices, faces, material)


def create_base(config: dict, lod: str, root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    sections = int(config["lods"][lod]["ringSections"]) // 2
    parts = [
        _upper_arc("BCB_BASE_OUTER", 1.08, 0.27, 0.035, 0.065, 0.15, sections, materials["BC_MAT_INNER_GUNMETAL"]),
        _upper_arc("BCB_BASE_INNER", 0.94, 0.19, 0.055, 0.04, 0.10, sections, materials["BC_MAT_INNER_GUNMETAL"]),
    ]
    support_count = 9 if lod != "lod2" else 5
    for index in range(support_count):
        normalized = index / (support_count - 1) * 2.0 - 1.0
        support = prism_profile(
            f"BCB_BASE_SUPPORT_{index:02d}",
            [(-0.045, 0.035), (0.045, 0.035), (0.036, 0.22 + (1.0 - abs(normalized)) * 0.08), (-0.036, 0.22 + (1.0 - abs(normalized)) * 0.08)],
            0.16,
            materials["BC_MAT_INNER_GUNMETAL"],
        )
        support.location = (normalized * 0.96, 0.11 + abs(normalized) * 0.07, 0.0)
        apply_transform(support)
        add_bevel(support, 0.008, 1)
        parts.append(support)
    base = join_objects(parts, "BC_BASE_FIELD")
    base.location.y = 0.16
    parent(base, root)


def create_core(config: dict, lod: str, root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> bpy.types.Object:
    detail = config["lods"][lod]
    core = _empty("BC_CORE_ROOT", "SPHERE")
    core.location = (0.0, 0.0, float(config["dimensions"]["coreY"]))
    parent(core, root)

    ring_specs = (
        ("BC_RING_INNER", 0.29, 0.23, 0.022, 0.055, 10, 1, 0.10),
        ("BC_RING_MIDDLE", 0.43, 0.33, 0.028, 0.052, 8, 1, 0.16),
        ("BC_RING_OUTER", 0.59, 0.43, 0.034, 0.064, 7, 1, 0.22),
    )
    ring_objects = {}
    for name, rx, rz, band, depth, gap_every, gap_size, y in ring_specs:
        ring_material = materials["BC_MAT_CARBON"] if lod == "lod0" and name == "BC_RING_INNER" else materials["BC_MAT_INNER_GUNMETAL"]
        ring = _broken_ring(name, rx, rz, band, depth, int(detail["ringSections"]), gap_every, gap_size, ring_material)
        ring.location.y = y
        parent(ring, core)
        ring_objects[name] = ring

    containment_node = _empty("BC_CORE_CONTAINMENT", "SPHERE")
    volume_node = _empty("BC_CORE_VOLUME", "SPHERE")
    nucleus_node = _empty("BC_CORE_NUCLEUS", "SPHERE")
    cage_node = _empty("BC_CORE_CAGE", "CIRCLE")
    for node in (containment_node, volume_node, nucleus_node, cage_node):
        parent(node, core)

    layers = int(detail["coreLayers"])
    energy_parts = []
    if layers >= 3:
        containment = _add_ico("BCB_CORE_CONTAINMENT_GEO", 0.235, 2 if lod == "lod0" else 1, materials["BC_MAT_CORE_GLASS"], (1.0, 1.16, 0.82))
        parent(containment, containment_node)
    volume = _add_ico("BCB_CORE_VOLUME_GEO", 0.15 if lod != "lod2" else 0.17, 2 if lod == "lod0" else 1, materials["BC_MAT_CORE_ENERGY"], (0.86, 1.32, 0.86))
    parent(volume, volume_node)
    energy_parts.append(volume)
    if layers >= 4:
        nucleus = _add_ico("BCB_CORE_NUCLEUS_GEO", 0.062, 2, materials["BC_MAT_CORE_ENERGY"], (0.78, 1.42, 0.78))
        parent(nucleus, nucleus_node)
        energy_parts.append(nucleus)

    if len(energy_parts) > 1:
        energy = join_objects(energy_parts, "BCB_CORE_ENERGY_GEO")
        parent(energy, volume_node)

    if lod == "lod0":
        cage_parts = [
            _broken_ring("BCB_CORE_CAGE_A", 0.36, 0.29, 0.022, 0.03, 48, 12, 2, materials["BC_MAT_CARBON"]),
            _broken_ring("BCB_CORE_CAGE_B", 0.30, 0.34, 0.018, 0.03, 48, 10, 2, materials["BC_MAT_CARBON"]),
        ]
        cage_parts[1].rotation_euler[1] = math.radians(58)
        apply_transform(cage_parts[1])
        cage = join_objects(cage_parts, "BCB_CORE_CAGE_GEO")
        parent(cage, core)
        combined = join_objects([ring_objects["BC_RING_INNER"], cage], "BC_RING_INNER")
        parent(combined, core)

    cyan = _empty("BC_ENERGY_CYAN", "SPHERE")
    parent(cyan, core)
    return core


def _create_iris_blades(config: dict, lod: str, iris_root: bpy.types.Object, material: bpy.types.Material) -> bpy.types.Object:
    count = int(config["irisBladeCount"])
    armature_data = bpy.data.armatures.new("BC_PORTAL_IRIS_ARMATURE")
    armature = bpy.data.objects.new("BC_PORTAL_BLADES", armature_data)
    bpy.context.collection.objects.link(armature)
    parent(armature, iris_root)
    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    for index in range(count):
        angle = (index / count) * math.tau
        pivot = (math.cos(angle) * 0.28, 0.0, math.sin(angle) * 0.28)
        bone = armature_data.edit_bones.new(f"BC_IRIS_BLADE_{index:02d}")
        bone.head = pivot
        bone.tail = (pivot[0], 0.08, pivot[2])
    bpy.ops.object.mode_set(mode="OBJECT")
    armature.select_set(False)

    pieces = []
    for index in range(count):
        angle = (index / count) * math.tau
        blade = prism_profile(
            f"BCB_IRIS_BLADE_{index:02d}",
            [(-0.07, -0.08), (0.31, -0.05), (0.44, 0.13), (0.18, 0.24), (-0.09, 0.13)],
            0.055 if lod != "lod2" else 0.04,
            material,
        )
        blade.location = (math.cos(angle) * 0.28, 0.0, math.sin(angle) * 0.28)
        blade.rotation_euler[1] = -angle
        apply_transform(blade)
        add_bevel(blade, 0.008 if lod == "lod0" else 0.005, max(1, int(config["lods"][lod]["bevelSegments"]) - 1))
        add_vertex_group(blade, f"BC_IRIS_BLADE_{index:02d}")
        pieces.append(blade)
    mesh = join_objects(pieces, "BC_PORTAL_IRIS_MESH")
    triangulate = mesh.modifiers.new("BC_IRIS_TRIANGULATE", "TRIANGULATE")
    bpy.context.view_layer.objects.active = mesh
    mesh.select_set(True)
    bpy.ops.object.modifier_apply(modifier=triangulate.name)
    mesh.select_set(False)
    bind = mesh.modifiers.new("BC_IRIS_BIND", "ARMATURE")
    bind.object = armature
    parent(mesh, armature)
    return armature


def create_portal(config: dict, lod: str, root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> bpy.types.Object:
    detail = config["lods"][lod]
    portal = _empty("BC_PORTAL_ROOT", "CIRCLE")
    portal.location = (0.0, 0.32, float(config["dimensions"]["coreY"]))
    parent(portal, root)
    iris = _empty("BC_PORTAL_IRIS", "CIRCLE")
    parent(iris, portal)
    iris_material = materials["BC_MAT_PORTAL"] if lod == "lod2" else materials["BC_MAT_INNER_GUNMETAL"]
    _create_iris_blades(config, lod, iris, iris_material)

    if lod == "lod2":
        frame = _empty("BC_PORTAL_APERTURE", "CIRCLE")
        parent(frame, portal)
    else:
        frame_parts = []
        planes = 4 if lod == "lod0" else 3
        for plane in range(planes):
            ring = _broken_ring(
                f"BCB_PORTAL_FRAME_{plane}", 0.54 - plane * 0.055, 0.43 - plane * 0.042,
                0.045 - plane * 0.004, 0.045, max(24, int(detail["ringSections"]) // 2),
                9 - min(2, plane), 1, materials["BC_MAT_PORTAL"],
            )
            ring.location.y = plane * 0.095
            apply_transform(ring)
            frame_parts.append(ring)
        for index in range(7):
            angle = (index / 7) * math.tau
            spoke = prism_profile(
                f"BCB_PORTAL_SPOKE_{index:02d}",
                [(-0.018, 0.31), (0.018, 0.31), (0.013, 0.52), (-0.013, 0.52)],
                0.038,
                materials["BC_MAT_PORTAL"],
            )
            spoke.rotation_euler[1] = -angle
            apply_transform(spoke)
            frame_parts.append(spoke)
        frame = join_objects(frame_parts, "BC_PORTAL_APERTURE")
        parent(frame, portal)

    cavity_node = _empty("BC_PORTAL_CAVITY", "CIRCLE")
    cavity_node.location.y = 0.22
    parent(cavity_node, portal)
    tunnel = _empty("BC_PORTAL_TUNNEL", "CIRCLE")
    tunnel.location.y = 0.28
    parent(tunnel, portal)
    shutters = _empty("BC_PORTAL_SHUTTERS", "CIRCLE")
    parent(shutters, portal)
    if lod == "lod0":
        cavity = _broken_ring("BCB_PORTAL_CAVITY_GEO", 0.32, 0.25, 0.08, 0.16, 40, 20, 2, materials["BC_MAT_INNER_GUNMETAL"])
        cavity.location.y = 0.20
        parent(cavity, cavity_node)
    orange = _empty("BC_ENERGY_ORANGE", "SPHERE")
    parent(orange, portal)
    return portal


def build_candidate_scene(config: dict, lod: str, texture_dir: Path) -> dict:
    clear_scene()
    configure_scene(config)
    random.seed(int(config["seed"]))
    materials = create_materials(texture_dir, int(config["textureSize"]))
    root = _empty("BC_CROWN_ROOT", "ARROWS")
    root.empty_display_size = 0.18
    create_shell(config, lod, root, materials)
    create_base(config, lod, root, materials)
    create_core(config, lod, root, materials)
    create_portal(config, lod, root, materials)
    bpy.context.view_layer.update()
    return {"root": root, "materials": materials}


def source_record(config: dict, source_path: Path, texture_dir: Path) -> dict:
    import hashlib

    return {
        "assetId": config["assetId"],
        "blenderVersion": bpy.app.version_string,
        "sourceBlend": str(source_path),
        "sourceBlendBytes": source_path.stat().st_size,
        "sourceBlendSha256": hashlib.sha256(source_path.read_bytes()).hexdigest(),
        "textureSource": str(texture_dir),
        "fixedSeed": config["seed"],
        "lod0SourceStats": mesh_stats(),
    }


def dump_record(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


__all__ = [
    "ALLOWED_MATERIALS",
    "build_candidate_scene",
    "dump_record",
    "mesh_stats",
    "selected_hierarchy",
    "source_record",
]
