"""Reproducible corrective sculpt of the original BLACKCROWN model.

Run Blender --background --factory-startup --disable-autoexec --python THIS -- REPO.
The published original is an immutable input. No extra meshes or subdivisions.
"""
import bpy
import hashlib
import json
import math
import struct
import sys
import tempfile
from pathlib import Path
from mathutils import Matrix, Vector

arguments=sys.argv[sys.argv.index('--')+1:]
repo=Path(arguments[0]).resolve()
profile={'folder':'sculpt-v2','spine_lateral':.00085,'spine_depth':.00175,'spine_width':.035}
if len(arguments)>2:
    settings=json.loads(Path(arguments[2]).read_text())
    assert set(settings)==set(profile)
    assert settings['folder'].startswith('sculpt-') and '/' not in settings['folder']
    assert all(0.<=settings[key]<=limit for key,limit in [('spine_lateral',.004),('spine_depth',.006),('spine_width',.1)])
    profile.update(settings)
original=repo/'apps/site/public/experience/blackcrown-skull/blackcrown-skull-desktop.glb'
source_sha=hashlib.sha256(original.read_bytes()).hexdigest()
assert source_sha=='7c1d400b5c8a91c3e3383c7d34fa07757e43a9bcdcbde3c3031c0a110e4c53a4'
out=original.parent/profile['folder']
out.mkdir(parents=True,exist_ok=True)
work=Path(arguments[1]).resolve() if len(arguments)>1 else Path(tempfile.mkdtemp(prefix='blackcrown-sculpt-v2-'))
work.mkdir(exist_ok=True)
bpy.context.preferences.filepaths.use_scripts_auto_execute=False
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(original))
meshes=[obj for obj in bpy.context.scene.objects if obj.type=='MESH']
assert len(meshes)==6

def smooth(lo,hi,value):
    t=max(0.,min(1.,(value-lo)/(hi-lo)))
    return t*t*(3.-2.*t)

def bump(x,y,cx,cy,rx,ry):
    return math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2)*2.)

def sculpt(x,height,front,name):
    """Coordinates in the source's glTF axes: x, height, forward depth."""
    cavity=0.
    if name in ['SKULL_FACE','SKULL_CRANIUM']:
        facing=smooth(.0005,.004,front) if name=='SKULL_CRANIUM' else smooth(.0015,.007,front)
        # Concave orbital floors; the original orbital rim remains intact.
        q=((abs(x)-.00465)/.00305)**2+((height-.03965)/.00222)**2
        orbit=(1.-smooth(.16,1.03,q))*facing
        front-=(.00165 if name=='SKULL_CRANIUM' else .00315)*orbit
        cavity=max(cavity,orbit*.87)
    if name=='SKULL_FACE':
        # Small, continuous brow and cheek corrections, not attached ornaments.
        brow=bump(abs(x),height,.0048,.0422,.0031,.0008)*facing
        cheek=bump(abs(x),height,.00725,.03675,.00165,.00135)*facing
        hollow=bump(abs(x),height,.0059,.0347,.0018,.00125)*facing
        front+=.00026*brow+.00038*cheek-.00048*hollow
        x+=math.copysign(.00022*cheek,x)
        cavity=max(cavity,.24*hollow)
        nose=bump(x,height,0.,.03625,.00092,.0015)*facing
        front-=.0006*nose
        cavity=max(cavity,.66*nose)
        # Preserve the original teeth; carve shallow separations and the bite line.
        teeth=bump(x,height,0.,.0332,.0048,.00145)*smooth(.0065,.009,front)
        dental_arch=.0093-.00125*(x/.005)**2
        front+=(dental_arch-front)*teeth*.24
        groove=math.exp(-(math.sin((x+.00016)*math.pi/.00095)/.24)**2)*teeth
        bite=bump(x,height,0.,.0315,.0052,.00032)*facing
        front-=.00025*groove+.00035*bite
        cavity=max(cavity,.45*groove,.75*bite)
        chin=bump(x,height,0.,.0289,.0029,.00125)*facing
        front+=.00017*chin
    elif name=='SPINE':
        t=max(0.,min(1.,(.0323833-height)/.0923679))
        envelope=math.sin(math.pi*t)**2
        # Gentle, fixed anatomical S-curve. Both end joints stay connected.
        x+=profile['spine_lateral']*math.sin(2.*math.pi*t)*envelope
        front+=profile['spine_depth']*math.sin(2.*math.pi*t-.35)*envelope
        x*=1.+profile['spine_width']*math.sin(3.*math.pi*t)*envelope
    return Vector((x,-front,height)),cavity

changes=[]
for obj in meshes:
    if obj.name not in ['SKULL_FACE','SKULL_CRANIUM','SPINE']:continue
    mesh=obj.data
    before=[v.co.copy() for v in mesh.vertices]
    source_normals=[normal.vector.copy() for normal in mesh.corner_normals]
    inverse=obj.matrix_world.inverted()
    cavities=[]
    normal_matrices=[]
    determinants=[]
    for vertex in mesh.vertices:
        point=obj.matrix_world@vertex.co
        changed,cavity=sculpt(point.x,point.z,-point.y,obj.name)
        # Transform the original split normals with the sculpt's Jacobian.
        # This preserves smooth shading across the original UV/split seams.
        columns=[]
        for axis in range(3):
            plus=point.copy();minus=point.copy();plus[axis]+=1e-6;minus[axis]-=1e-6
            a=sculpt(plus.x,plus.z,-plus.y,obj.name)[0]
            b=sculpt(minus.x,minus.z,-minus.y,obj.name)[0]
            columns.append((a-b)/2e-6)
        jacobian=inverse.to_3x3()@Matrix(columns).transposed()@obj.matrix_world.to_3x3()
        determinants.append(jacobian.determinant())
        normal_matrices.append(jacobian.inverted().transposed())
        vertex.co=inverse@changed
        cavities.append(cavity)
    mesh.update()
    assert min(determinants)>.01,(obj.name,min(determinants))
    mesh.normals_split_custom_set([(normal_matrices[loop.vertex_index]@source_normals[loop.index]).normalized() for loop in mesh.loops])
    if obj.name.startswith('SKULL'):
        color=mesh.color_attributes.new(name='AnatomyCavity',type='FLOAT_COLOR',domain='CORNER')
        for loop in mesh.loops:
            value=1.-cavities[loop.vertex_index]
            color.data[loop.index].color=(value,value,value,1.)
        mesh.color_attributes.active_color_index=len(mesh.color_attributes)-1
        mesh.color_attributes.render_color_index=len(mesh.color_attributes)-1
    changes.append({'name':obj.name,'moved_vertices':sum((v.co-p).length>1e-9 for v,p in zip(mesh.vertices,before)),'max_local_displacement':max((v.co-p).length for v,p in zip(mesh.vertices,before)),'min_sculpt_jacobian':min(determinants)})

# Export the cavity as a native COLOR_0 attribute; the runtime also uses its
# value for roughness so an orbital floor cannot become a bright chrome lens.
face=next(o for o in meshes if o.name=='SKULL_FACE')
material=face.data.materials[0]
nodes=material.node_tree.nodes
principled=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
original_link=principled.inputs['Base Color'].links[0]
source_socket=original_link.from_socket
vertex=nodes.new('ShaderNodeVertexColor');vertex.layer_name='AnatomyCavity'
multiply=nodes.new('ShaderNodeMixRGB');multiply.blend_type='MULTIPLY';multiply.inputs[0].default_value=1.
material.node_tree.links.new(source_socket,multiply.inputs[1]);material.node_tree.links.new(vertex.outputs['Color'],multiply.inputs[2]);material.node_tree.links.new(multiply.outputs[0],principled.inputs['Base Color'])

def summary():
    parts=[]
    for obj in meshes:
        obj.data.calc_loop_triangles()
        parts.append({'name':obj.name,'triangles':len(obj.data.loop_triangles)})
    return parts

def export(path):
    available=bpy.ops.export_scene.gltf.get_rna_type().properties
    options={'filepath':str(path),'export_format':'GLB','export_animations':False,'export_yup':True,'use_selection':True}
    if 'export_vertex_color' in available:
        choices={item.identifier for item in available['export_vertex_color'].enum_items}
        if 'ACTIVE' in choices:options['export_vertex_color']='ACTIVE'
    if 'export_image_quality' in available:options['export_image_quality']=85
    bpy.ops.object.select_all(action='DESELECT')
    for obj in meshes:obj.select_set(True)
    bpy.ops.export_scene.gltf(**options)

desktop=out/'blackcrown-skull-desktop.glb'
desktop_parts=summary();assert sum(p['triangles'] for p in desktop_parts)==80310
export(desktop)
bpy.ops.wm.save_as_mainfile(filepath=str(work/('blackcrown-'+profile['folder']+'.blend')))

targets={'SKULL_REAR_LEFT':550,'SKULL_REAR_RIGHT':600,'SKULL_CRANIUM':1000,'SPINE':6098,'SKULL_FACE':6996,'CROWN':12000}
for obj in meshes:
    bpy.context.view_layer.objects.active=obj
    reference=obj.copy();reference.data=obj.data.copy();bpy.context.scene.collection.objects.link(reference)
    reference.hide_render=True;reference.hide_set(True)
    obj.data.calc_loop_triangles()
    modifier=obj.modifiers.new('MOBILE_LOD','DECIMATE');modifier.ratio=(targets[obj.name]-8)/len(obj.data.loop_triangles);modifier.use_collapse_triangulate=True
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    for polygon in obj.data.polygons:polygon.use_smooth=True
    normals=obj.modifiers.new('SCULPT_NORMALS','DATA_TRANSFER');normals.object=reference;normals.use_loop_data=True;normals.data_types_loops={'CUSTOM_NORMAL'};normals.loop_mapping='POLYINTERP_NEAREST'
    bpy.ops.object.modifier_apply(modifier=normals.name)
    data=reference.data;bpy.data.objects.remove(reference,do_unlink=True);bpy.data.meshes.remove(data)

images={node.image for obj in meshes for mat in obj.data.materials if mat for node in mat.node_tree.nodes if node.type=='TEX_IMAGE' and node.image}
texture_work=work/'mobile-textures';texture_work.mkdir(exist_ok=True)
for image in images:
    ratio=min(1.,512/max(image.size));image.scale(max(1,round(image.size[0]*ratio)),max(1,round(image.size[1]*ratio)))
    image.unpack(method='REMOVE')
    color='BaseColor' in image.name
    image.filepath_raw=str(texture_work/(image.name+('.jpg' if color else '.png')));image.file_format='JPEG' if color else 'PNG';image.save();image.pack()
mobile=out/'blackcrown-skull-mobile.glb';mobile_parts=summary()
assert sum(p['triangles'] for p in mobile_parts)<=27200
export(mobile)
assert hashlib.sha256(original.read_bytes()).hexdigest()==source_sha
def record(file,parts):return {'file':file.name,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'triangles':sum(p['triangles'] for p in parts),'parts':parts}
manifest={'source_sha256':source_sha,'source_preserved':True,'generated_with':'Blender '+bpy.app.version_string,'profile':profile,'changes':changes,'desktop':record(desktop,desktop_parts),'mobile':record(mobile,mobile_parts),'new_meshes':0,'subdivisions':0,'poster':'../blackcrown-skull-poster.png'}
poster=out/'blackcrown-skull-poster.png'
if poster.exists():
    manifest['poster']=poster.name
    poster_bytes=poster.read_bytes()
    width,height=struct.unpack('>II',poster_bytes[16:24])
    manifest['poster_details']={'width':width,'height':height,'bytes':len(poster_bytes),'sha256':hashlib.sha256(poster_bytes).hexdigest()}
(out/'asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('SCULPT_RESULT '+json.dumps(manifest),flush=True)
