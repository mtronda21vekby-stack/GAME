// Local recovery of Raze RdActor/RdPhys construction. Original attribution
// and recovered AS3 remain in source-audit-v4 / migration-audit.
// Real death RNG, cleanup and game integration require separate verification.
(function(root){'use strict';
 const B=root.RazeLegacyBox2D;
 const limbs=[
  [0,18,-1,1,5,-20,0,-17,-.2,.25],
  [0,8,30,1,-3,-13,0,20,0,0],[0,8,30,1,-3,-13,0,20,0,0],
  [2,7,20,1,-2.5,10,0,20,-.75,0],[3,7,20,1,-2.5,10,0,20,-.75,0],
  [4,6,9,1,0,28,0,10,-.25,.25],[5,6,9,1.5,0,28,0,10,-.25,.25],
  [0,13,37,1,-2,15,0,20,-.5,.25],[0,13,37,1,-2,15,0,20,-.5,.25],
  [8,12,37,1,-1.5,44,0,20,0,.85],[9,12,37,1,-1.5,44,0,20,0,.85],
  [10,20,10,1,0,72,8,2,-.15,.25],[11,20,10,1,0,72,8,2,-.15,.25]
 ];
 function world(ground){
  const aabb=new B.b2AABB();aabb.lowerBound.Set(-100,-100);aabb.upperBound.Set(100,100);
  const w=new B.b2World(aabb,new B.b2Vec2(0,10),true),floor=w.CreateBody(new B.b2BodyDef());
  for(const r of ground){const p=new B.b2PolygonDef();p.SetAsOrientedBox(r.width/60,r.height/60,new B.b2Vec2(r.x/30,r.y/30),r.rotation/(180/Math.PI));p.friction=.3;p.density=0;floor.CreateShape(p)}
  floor.SetMassFromShapes();return w;
 }
 function actor(world,unit){
  const x=unit.x/30,y=(unit.y-50)/30,scale=unit.scale,flip=unit.flip;
  const bodyDef=new B.b2BodyDef();bodyDef.position.x=x;bodyDef.position.y=y;
  const shape=new B.b2PolygonDef();shape.SetAsBox(20/60*scale,40/60*scale);shape.density=1;shape.friction=.5;shape.restitution=.2;shape.filter.groupIndex=-1;
  const body=world.CreateBody(bodyDef);body.CreateShape(shape);body.SetMassFromShapes();const parts=[body];
  for(const [parent,w,h,density,px,py,ox,oy,lo,hi] of limbs){
   const dx=px/30,dy=py/30,bd=new B.b2BodyDef();bd.position.x=x+dx*scale*flip;bd.position.y=y+dy*scale;
   let definition;
   if(h!==-1){definition=new B.b2PolygonDef();definition.SetAsOrientedBox(w/60*scale,h/60*scale,new B.b2Vec2(ox/60*scale*flip,oy/60*scale),0)}
   else{definition=new B.b2CircleDef();definition.radius=w/60*scale;definition.localPosition.Set(ox/60*scale*flip,oy/60*scale)}
   definition.density=density;definition.friction=.5;definition.restitution=.2;definition.filter.groupIndex=-1;
   const child=world.CreateBody(bd);child.CreateShape(definition);child.SetMassFromShapes();parts.push(child);
   const jd=new B.b2RevoluteJointDef(),anchor=new B.b2Vec2(body.GetWorldCenter().x,body.GetWorldCenter().y);
   anchor.x+=dx*scale*flip;anchor.y+=dy*scale;jd.Initialize(parts[parent],child,anchor);
   if(lo!==0||hi!==0){jd.lowerAngle=(flip!==-1?lo:hi*flip)*B.b2Settings.b2_pi;jd.upperAngle=(flip!==-1?hi:lo*flip)*B.b2Settings.b2_pi;jd.enableLimit=true}
   jd.maxMotorTorque=.02;jd.motorSpeed=0;jd.enableMotor=true;world.CreateJoint(jd);
  }
  return parts;
 }
 root.RazeLegacyRagdolls={world,actor};
 const scenes=new Map();let nextScene=0;
 const trace=typeof location!=='undefined'&&new URLSearchParams(location.search).has('test')?[]:null;
 const diagnostic=root.razeLegacyPhysicsState={worldsCreated:0,worldsDisposed:0,actorsCreated:0,gunsCreated:0,steps:0,activeBodies:0,lastError:null};
 function record(command){if(trace){if(command.op==='step'&&trace.length&&trace[trace.length-1].op==='step'&&trace[trace.length-1].id===command.id)trace[trace.length-1].count++;else if(trace.length<20000)trace.push(command)}}
 root.razeLegacyPhysicsTrace=trace;
 function register(scene,body){const id=scene.nextBody++;scene.bodies.set(id,body);return id}
 function force(body,f){body.ApplyForce(new B.b2Vec2(f.x,f.y),new B.b2Vec2(body.GetWorldCenter().x+(f.ox||0)/30,body.GetWorldCenter().y+(f.oy||0)/30))}
 root.RazeLegacyRuntime={
  create(map){const id=++nextScene;scenes.set(id,{world:world(map.rectangles),bodies:new Map(),nextBody:1});diagnostic.worldsCreated++;record({op:'create',id,map});return id},
  actor(id,data){const scene=scenes.get(id),parts=actor(scene.world,data),first=scene.nextBody;for(const p of parts)register(scene,p);for(const f of data.forces)force(parts[f.body],f);diagnostic.actorsCreated++;record({op:'actor',id,data,first});return first},
  gun(id,data){
   const scene=scenes.get(id),bd=new B.b2BodyDef();bd.position.x=data.x/30;bd.position.y=(data.y-60*data.scale)/30;
   const pd=new B.b2PolygonDef();pd.SetAsBox(data.width*data.scale/60,data.height*data.scale/60);pd.density=1;pd.friction=.4;pd.restitution=.3;pd.filter.groupIndex=-1;
   const b=scene.world.CreateBody(bd);b.CreateShape(pd);b.SetMassFromShapes();for(const f of data.forces)force(b,f);const first=register(scene,b);diagnostic.gunsCreated++;record({op:'gun',id,data,first});return first;
  },
  // Optional owned-world presentation impulse. Validate every corpse body
  // before any mutation; do not create bodies, change force draws or step time.
  presentationKick26(id,first,vx,vy,bounce){
   if(!Number.isSafeInteger(id)||id<=0||!Number.isSafeInteger(first)||first<=0||
      typeof vx!=='number'||typeof vy!=='number'||typeof bounce!=='number'||
      !Number.isFinite(vx)||!Number.isFinite(vy)||!Number.isFinite(bounce)||
      vx*vx+vy*vy>9||bounce<0||bounce>.35)return false;
   const scene=scenes.get(id);if(!scene)return false;
   const validated=[];
   for(let i=0;i<14;i++){
    const body=scene.bodies.get(first+i);
    if(!body||typeof body.ApplyImpulse!=='function'||typeof body.GetShapeList!=='function')return false;
    const mass=body.GetMass(),center=body.GetWorldCenter(),shapes=[];
    if(!Number.isFinite(mass)||mass<=0||!center||!Number.isFinite(center.x)||!Number.isFinite(center.y)||
       !Number.isFinite(mass*vx)||!Number.isFinite(mass*vy))return false;
    for(let shape=body.GetShapeList();shape;shape=shape.GetNext()){
     if(typeof shape.GetNext!=='function'||(typeof shape.SetRestitution!=='function'&&!('m_restitution' in shape)))return false;
     shapes.push(shape);
    }
    if(!shapes.length)return false;
    validated.push({body,mass,center,shapes});
   }
   for(const item of validated){
    item.body.ApplyImpulse(new B.b2Vec2(item.mass*vx,item.mass*vy),item.center);
    for(const shape of item.shapes){if(typeof shape.SetRestitution==='function')shape.SetRestitution(bounce);else shape.m_restitution=bounce;}
   }
   return true;
  },
  step(id,write){const scene=scenes.get(id);try{scene.world.Step(1/30,10);for(const [index,b] of scene.bodies)write(index,b.GetPosition().x,b.GetPosition().y,b.GetAngle(),b.IsSleeping()?1:0,b.GetMass());diagnostic.steps++;diagnostic.activeBodies=scene.bodies.size;record({op:'step',id,count:1});return scene.bodies.size}catch(error){diagnostic.lastError=String(error);throw error}},
  inspect(id){
   if(!trace)throw new Error('Private source comparison requires explicit test entry');
   const scene=scenes.get(id);return Array.from(scene.bodies,([index,b])=>({index,x:b.GetPosition().x,y:b.GetPosition().y,angle:b.GetAngle(),forceX:b.m_force.x,forceY:b.m_force.y,torque:b.m_torque,mass:b.GetMass(),sleep:b.IsSleeping()}));
  },
  remove(id,first,count){
   record({op:'remove',id,first,count});const scene=scenes.get(id),order=count===14?[5,3,7,13,11,9,12,10,8,0,1,4,2,6]:[0];
   for(const offset of order){const index=first+offset,b=scene.bodies.get(index);if(b){b.m_userData=null;scene.world.DestroyBody(b);scene.bodies.delete(index)}}
  },
  dispose(id){scenes.delete(id);diagnostic.worldsDisposed++;record({op:'dispose',id})}
 };
})(typeof globalThis!=='undefined'?globalThis:this);
