import { Euler, Matrix4, Quaternion, Vector3, type PerspectiveCamera } from "three";
import { panelCSSMatrix, panelScreenPosition, panelStyle } from "./panelProjection";

const planes:Record<string,{z:number;yaw:number;pitch:number;order:number}>={
  ballcrown:{z:1.4,yaw:.085,pitch:-.012,order:4},
  evofish:{z:-5,yaw:-.13,pitch:.016,order:1},
  "quiet-valley":{z:-.8,yaw:.07,pitch:-.012,order:3},
  "crown-front":{z:-3.3,yaw:-.105,pitch:.014,order:2},
};
type Surface={article:HTMLElement;element:HTMLElement;left:number;top:number;width:number;height:number;z:number;yaw:number;pitch:number;style:string};

/** Native flow owns scroll/semantics. The real scene camera projects each live HTML plane. */
export class SpatialGalleryStage {
  private surfaces:Surface[]=[];
  private width=1;private height=1;private previous="";
  private readonly world=new Matrix4();private readonly origin=new Matrix4();
  private readonly rotation=new Quaternion();private readonly euler=new Euler();private readonly scale=new Vector3(1,1,1);
  constructor(private readonly stage:HTMLElement){}

  layout(width:number,height:number,compact:boolean,reduced:boolean){
    this.clear();this.width=width;this.height=height;
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
      return [{article,element,left:box.left+window.scrollX,top:box.top+window.scrollY,width:element.offsetWidth,height:element.offsetHeight,z:single?0:plane.z,yaw:single?plane.yaw*.4:plane.yaw,pitch:plane.pitch,style:""}];
    });
    this.invalidate();
  }

  invalidate(){this.previous="";}

  update(camera:PerspectiveCamera,renderedScroll:number,nativeScroll:number,reduced:boolean,ready:boolean){
    if(reduced||!ready)return;
    const clock=Math.abs(renderedScroll-nativeScroll)<.35?nativeScroll:renderedScroll;
    const key=[Math.round(clock*64),nativeScroll,camera.position.z,camera.fov].join(":");
    if(key===this.previous)return;this.previous=key;
    const worldUnit=2*camera.position.z*Math.tan(camera.fov*Math.PI/360)/this.height;
    for(const surface of this.surfaces){
      const y=surface.top-clock+surface.height*.5;
      const phase=Math.max(-1,Math.min(1,(y-this.height*.52)/(this.height*.8)));
      const focus=1-Math.min(1,Math.abs(y-this.height*.52)/(this.height*.75));
      const z=surface.z<0?surface.z+.8*focus:surface.z,factor=camera.position.z/(camera.position.z-z);
      const center=this.width*.5,nativeCenter=surface.left+surface.width*.5,side=nativeCenter<center?-1:1;
      const half=Math.min(center-8,surface.width*factor*.5+8);
      const projectedX=Math.max(half,Math.min(this.width-half,center+(nativeCenter-center)*factor+side*phase*(this.width<=760?14:46)));
      const axisX=center+(projectedX-center)/factor;
      const position=panelScreenPosition(camera,axisX,y,this.width,this.height,0);
      position.z=z;
      const distance=Math.min(1,Math.abs(y-this.height*.52)/(this.height*.65));
      this.rotation.setFromEuler(this.euler.set(surface.pitch,surface.yaw*(.7+.3*distance),0));
      this.world.compose(position,this.rotation,this.scale);
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
      surface.element.style.removeProperty("transform");surface.article.style.removeProperty("--plane-factor");surface.article.style.removeProperty("z-index");delete surface.article.dataset.projection;delete surface.article.dataset.plane;
    }
    this.surfaces=[];this.invalidate();
  }
}
