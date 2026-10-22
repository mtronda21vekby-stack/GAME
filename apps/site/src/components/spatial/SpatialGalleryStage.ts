import { Euler, Matrix4, Quaternion, Vector3, Group, Mesh, PlaneGeometry, MeshBasicMaterial, DataTexture, CanvasTexture, SRGBColorSpace, DoubleSide, type PerspectiveCamera } from "three";
import { panelCSSMatrix, panelScreenPosition, panelStyle } from "./panelProjection";

const planes:Record<string,{z:number;yaw:number;pitch:number;order:number}>={
  ballcrown:{z:1.4,yaw:.085,pitch:-.012,order:4},
  evofish:{z:-5,yaw:-.13,pitch:.016,order:1},
  "quiet-valley":{z:-.8,yaw:.07,pitch:-.012,order:3},
  "crown-front":{z:-3.3,yaw:-.105,pitch:.014,order:2},
};
type MediaTexture={texture?:CanvasTexture;ready:boolean};
type Surface={article:HTMLElement;element:HTMLElement;left:number;top:number;width:number;height:number;mediaTop:number;mediaHeight:number;z:number;yaw:number;pitch:number;style:string;screenVisible?:boolean;backing?:Mesh<PlaneGeometry,MeshBasicMaterial>;texture?:MediaTexture};

/** Native flow owns scroll/semantics. The real scene camera projects each live HTML plane. */
export class SpatialGalleryStage {
  private surfaces:Surface[]=[];
  private width=1;private height=1;private previous="";
  private readonly world=new Matrix4();private readonly origin=new Matrix4();
  private readonly rotation=new Quaternion();private readonly euler=new Euler();private readonly scale=new Vector3(1,1,1);
  private hoverId="";private hoverX=0;private hoverY=0;
  private readonly backingGroup=new Group();private readonly plane=new PlaneGeometry(1,1);
  private readonly placeholder=new DataTexture(new Uint8Array([0,0,0,0]),1,1);
  private readonly media=new Map<string,MediaTexture>();private compact=false;private disposed=false;
  private readonly backings=new Map<string,Mesh<PlaneGeometry,MeshBasicMaterial>>();
  private readonly local=new Matrix4();private readonly size=new Matrix4();
  constructor(private readonly stage:HTMLElement,scene?:Group|import("three").Scene,private readonly requestFrame:()=>void=()=>{}){this.placeholder.colorSpace=SRGBColorSpace;this.placeholder.needsUpdate=true;this.backingGroup.name="LIVE_GALLERY_PLANES";scene?.add(this.backingGroup);}

  private textureFor(article:HTMLElement,compact:boolean){
    const id=article.dataset.gameId??"",existing=this.media.get(id);if(existing)return existing;
    const record:MediaTexture={ready:false};this.media.set(id,record);const image=article.querySelector("img");if(!image)return record;
    const load=()=>{
      if(this.disposed||this.media.get(id)!==record||!image.naturalWidth)return;
      const canvas=document.createElement("canvas");canvas.width=compact?512:1024;canvas.height=canvas.width*10/16;const ctx=canvas.getContext("2d");if(!ctx)return;
      const w=canvas.width,h=canvas.height;ctx.beginPath();ctx.roundRect(0,0,w,h,8*w/360);ctx.clip();ctx.fillStyle="#071016";ctx.fillRect(0,0,w,h);
      const ratio=id==="crown-front"?Math.min(w/image.naturalWidth,h/image.naturalHeight):Math.max(w/image.naturalWidth,h/image.naturalHeight);
      const dw=image.naturalWidth*ratio,dh=image.naturalHeight*ratio;ctx.filter="saturate(72%) contrast(103%)";ctx.drawImage(image,(w-dw)/2,(h-dh)/2,dw,dh);
      record.texture=new CanvasTexture(canvas);record.texture.colorSpace=SRGBColorSpace;record.ready=true;this.invalidate();this.requestFrame();
    };
    if(image.complete)load();else image.addEventListener("load",load,{once:true});return record;
  }

  layout(width:number,height:number,compact:boolean,reduced:boolean){
    this.clear();this.width=width;this.height=height;
    if(this.compact!==compact){this.media.forEach(r=>r.texture?.dispose());this.media.clear();this.compact=compact;}
    const articles=[...this.stage.querySelectorAll<HTMLElement>(".spatialGamePanel")];
    const depth=18.8+(compact?(height<=520?.9:1.8):0),single=articles.length===1;
    for(const article of articles){
      const plane=planes[article.dataset.gameId??""]??planes.ballcrown;
      article.style.setProperty("--plane-factor",String(reduced||single?1:depth/(depth-plane.z)));
      article.style.zIndex=String(plane.order);
      article.dataset.plane=plane.z>0?"near":plane.z<-2?"far":"middle";
    }
    this.surfaces=articles.flatMap(article=>{
      const element=article.querySelector<HTMLElement>(".spatialPanelSurface");if(!element)return [];
      const box=article.getBoundingClientRect(),plane=planes[article.dataset.gameId??""]??planes.ballcrown;
      const media=article.querySelector<HTMLElement>(".spatialPanelMedia"),texture=this.textureFor(article,compact);
      const id=article.dataset.gameId??"";let backing=this.backings.get(id);
      if(!backing){backing=new Mesh(this.plane,new MeshBasicMaterial({map:texture.texture??this.placeholder,transparent:true,opacity:1,depthWrite:false,depthTest:true,side:DoubleSide,toneMapped:false,fog:false}));backing.matrixAutoUpdate=false;this.backings.set(id,backing);}
      backing.material.map=texture.texture??this.placeholder;backing.visible=false;this.backingGroup.add(backing);
      // On narrow screens the media shares the foreground with its DOM frame and actions.
      backing.material.depthTest=!compact;
      backing.renderOrder=compact?100+plane.order:0;
      return [{article,element,left:box.left+window.scrollX,top:box.top+window.scrollY,width:element.offsetWidth,height:element.offsetHeight,mediaTop:media?.offsetTop??40,mediaHeight:media?.offsetHeight??160,z:single?0:plane.z,yaw:single?plane.yaw*.4:plane.yaw,pitch:plane.pitch,style:"",backing,texture}];
    });
    this.invalidate();
  }

  invalidate(){this.previous="";}
  pointer(event:PointerEvent){
    if(event.pointerType!=="mouse")return;const panel=(event.target as Element).closest<HTMLElement>(".spatialGamePanel");
    this.hoverId=panel?.dataset.gameId??"";
    const b=panel?.getBoundingClientRect();this.hoverX=b?Math.max(-1,Math.min(1,(event.clientX-b.left)/b.width*2-1)):0;this.hoverY=b?Math.max(-1,Math.min(1,(event.clientY-b.top)/b.height*2-1)):0;
    panel?.style.setProperty("--panel-light-x",String((this.hoverX+1)*50)+"%");this.invalidate();
  }

  update(camera:PerspectiveCamera,_renderedScroll:number,nativeScroll:number,reduced:boolean,ready:boolean){
    if(reduced||!ready)return;
    // The camera may settle behind a gesture; native copy and controls cannot.
    // Keep their planes in document flow so reverse scroll cannot push them
    // through the collection heading or its filters.
    const clock=nativeScroll;
    const key=[nativeScroll,camera.position.x,camera.position.y,camera.position.z,camera.quaternion.x,camera.quaternion.y,camera.quaternion.z,camera.quaternion.w,camera.fov,this.hoverId,this.hoverX,this.hoverY].join(":");
    if(key===this.previous)return;this.previous=key;
    const worldUnit=2*camera.position.z*Math.tan(camera.fov*Math.PI/360)/this.height;
    for(const surface of this.surfaces){
      const y=surface.top-clock+surface.height*.5;
      const phase=Math.max(-1,Math.min(1,(y-this.height*.52)/(this.height*.8)));
      const focus=1-Math.min(1,Math.abs(y-this.height*.52)/(this.height*.75));
      const z=surface.z<0?surface.z+.8*focus:surface.z,factor=camera.position.z/(camera.position.z-z);
      const center=this.width*.5,nativeCenter=surface.left+surface.width*.5,side=nativeCenter<center?-1:1;
      const half=Math.min(center-8,surface.width*factor*.5+18);
      const projectedX=Math.max(half,Math.min(this.width-half,center+(nativeCenter-center)*factor+side*phase*(this.width<=760?14:46)));
      const axisX=center+(projectedX-center)/factor;
      const position=panelScreenPosition(camera,axisX,y,this.width,this.height,0);
      position.z=z;
      const distance=Math.min(1,Math.abs(y-this.height*.52)/(this.height*.65));
      const hovered=this.hoverId===surface.article.dataset.gameId;
      this.rotation.setFromEuler(this.euler.set(surface.pitch+(hovered?this.hoverY*.018:0),surface.yaw*(.7+.3*distance)+(hovered?this.hoverX*.025:0),0));
      this.world.compose(position,this.rotation,this.scale);
      if(surface.backing&&surface.texture?.ready){
        surface.backing.material.map=surface.texture.texture!;
        const unit=worldUnit,offset=(surface.height*.5-surface.mediaTop-surface.mediaHeight*.5)*unit;
        this.local.makeTranslation(0,offset,0);this.size.makeScale(surface.width*unit,surface.mediaHeight*unit,1);
        surface.backing.matrix.copy(this.world).multiply(this.local).multiply(this.size);surface.backing.matrixWorldNeedsUpdate=true;surface.screenVisible=y+surface.height>0&&y-surface.height<this.height;surface.backing.visible=surface.screenVisible;
        surface.article.dataset.mediaDepth="ready";
      }
      const matrix=panelCSSMatrix(camera,this.world,this.width,this.height,surface.width,surface.height,surface.width*worldUnit);
      this.origin.makeTranslation(-surface.left,-(surface.top-nativeScroll),0);matrix.premultiply(this.origin);
      // Quantise below visible precision so resting controls have a stable hit rectangle.
      matrix.elements.forEach((value,index)=>{matrix.elements[index]=Math.abs(value)<1e-7?0:Number(value.toFixed(7));});
      const style=panelStyle(matrix);
      if(style!==surface.style){surface.element.style.transform=style;surface.style=style;}
      surface.article.dataset.projection="ready";
    }
  }

  clear(){
    for(const surface of this.surfaces){
      surface.element.style.removeProperty("transform");surface.article.style.removeProperty("--plane-factor");surface.article.style.removeProperty("z-index");delete surface.article.dataset.projection;delete surface.article.dataset.plane;delete surface.article.dataset.mediaDepth;surface.backing?.removeFromParent();
    }
    this.surfaces=[];this.invalidate();
  }
  focus(amount:number){for(const surface of this.surfaces)if(surface.backing){surface.backing.material.opacity=1-amount*.83;surface.backing.visible=Boolean(surface.screenVisible)&&surface.article.dataset.caseHandoff!=="true";}}
  dispose(){this.disposed=true;this.clear();this.media.forEach(r=>r.texture?.dispose());this.media.clear();this.backings.forEach(m=>m.material.dispose());this.backings.clear();this.placeholder.dispose();this.plane.dispose();this.backingGroup.removeFromParent();}
}
