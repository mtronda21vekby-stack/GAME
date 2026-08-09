import React from "react";

const VERTEX_SOURCE = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main(){
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

const FRAGMENT_SOURCE = `
    precision highp float;
    varying vec2 v_uv;
    uniform vec2 u_resolution;
    uniform vec2 u_pointer;
    uniform float u_time;
    uniform float u_scroll;
    uniform float u_velocity;

    #define PI 3.14159265359
    #define TAU 6.28318530718

    mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
    float saturate(float x){return clamp(x,0.0,1.0);}
    float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
    float hash11(float p){return fract(sin(p*127.1)*43758.5453123);}
    float sdSphere(vec3 p,float r){return length(p)-r;}
    float sdTorusY(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}
    float sdTorusZ(vec3 p,vec2 t){vec2 q=vec2(length(p.xy)-t.x,p.z);return length(q)-t.y;}
    float sdRoundBox(vec3 p,vec3 b,float r){vec3 q=abs(p)-b;return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0)-r;}

    float windowMask(float x,float a,float b){
      return smoothstep(a,a+0.075,x)*(1.0-smoothstep(b-0.075,b,x));
    }

    float crownSdf(vec3 p){
      p.y += 0.04;
      float band = max(abs(length(p.xz)-0.92)-0.12, abs(p.y+0.31)-0.18);
      float lowerRing = sdTorusY(p-vec3(0.0,-0.46,0.0),vec2(0.95,0.075));
      float a = atan(p.z,p.x);
      float sector = TAU/7.0;
      float aa = mod(a+0.5*sector,sector)-0.5*sector;
      float radius = length(p.xz);
      vec3 q = vec3(aa*radius, p.y-0.36, radius-0.88);
      float hn = saturate((q.y+0.66)/1.32);
      vec3 bounds = vec3(mix(0.23,0.026,hn),0.66,mix(0.17,0.045,hn));
      float spike = sdRoundBox(q,bounds,0.035);
      float jewel = sdSphere(q-vec3(0.0,0.76,0.0),0.105);
      return min(min(band,lowerRing),min(spike,jewel));
    }

    vec2 sceneMap(vec3 p){
      p.xz = rot(u_time*0.12 + u_scroll*5.2 + u_pointer.x*0.28) * p.xz;
      p.xy = rot((u_pointer.y-0.5)*0.28 + sin(u_time*0.22)*0.035) * p.xy;

      float crownVisible = 1.0-smoothstep(0.31,0.50,u_scroll);
      float portalVisible = windowMask(u_scroll,0.12,0.43);
      float oceanVisible = windowMask(u_scroll,0.35,0.65);
      float reactorVisible = windowMask(u_scroll,0.56,0.84);
      float networkVisible = smoothstep(0.77,0.93,u_scroll);

      float dc = crownSdf(p*mix(0.92,1.26,smoothstep(0.0,0.34,u_scroll)))/mix(0.92,1.26,smoothstep(0.0,0.34,u_scroll));
      dc += (1.0-crownVisible)*3.5;

      vec3 pp = p;
      pp.xy = rot(u_time*0.08) * pp.xy;
      float dp = min(sdTorusZ(pp,vec2(1.48,0.036)),sdTorusZ(pp,vec2(1.18,0.022)));
      vec3 pp2=p;pp2.xy=rot(PI*0.25-u_time*0.055)*pp2.xy;
      dp=min(dp,sdTorusZ(pp2,vec2(1.67,0.017)));
      dp += (1.0-portalVisible)*3.5;

      vec3 po = p;
      float liquid = sin(po.x*6.0+u_time)*sin(po.y*5.0-u_time*0.7)*sin(po.z*6.0+u_time*0.45);
      float ocean = sdSphere(po,0.93)+liquid*0.035;
      ocean += (1.0-oceanVisible)*3.5;

      vec3 pr = p;
      float core = sdSphere(pr,0.67+0.035*sin(u_time*3.0));
      float reactorRing = sdTorusY(pr,vec2(1.02,0.055));
      float reactor = min(core,reactorRing);
      reactor += (1.0-reactorVisible)*3.5;

      vec3 pn = p;
      float shell = abs(sdSphere(pn,1.02))-0.018;
      float n1=sdTorusZ(pn,vec2(1.05,0.012));
      pn.yz=rot(PI*0.5)*pn.yz;
      float n2=sdTorusZ(pn,vec2(1.05,0.012));
      float network=min(shell,min(n1,n2));
      network += (1.0-networkVisible)*3.5;

      vec2 hit=vec2(dc,1.0);
      if(dp<hit.x)hit=vec2(dp,2.0);
      if(ocean<hit.x)hit=vec2(ocean,3.0);
      if(reactor<hit.x)hit=vec2(reactor,4.0);
      if(network<hit.x)hit=vec2(network,5.0);
      return hit;
    }

    vec3 getNormal(vec3 p){
      vec2 e=vec2(0.0015,0.0);
      float d=sceneMap(p).x;
      return normalize(vec3(
        sceneMap(p+e.xyy).x-d,
        sceneMap(p+e.yxy).x-d,
        sceneMap(p+e.yyx).x-d
      ));
    }

    vec3 materialColor(float id,vec3 p,vec3 n,vec3 rd){
      vec3 cyan=vec3(0.34,0.90,1.0);
      vec3 violet=vec3(0.54,0.33,1.0);
      vec3 gold=vec3(0.96,0.63,0.22);
      vec3 hot=vec3(1.0,0.26,0.065);
      vec3 base=gold;
      if(id<1.5){base=mix(gold,cyan,0.28+0.22*sin(p.y*5.0+u_time));}
      else if(id<2.5){base=mix(cyan,violet,0.5+0.5*sin(p.x*2.0+u_time));}
      else if(id<3.5){base=mix(vec3(0.015,0.24,0.48),cyan,0.42+0.35*n.y);}
      else if(id<4.5){base=mix(hot,vec3(1.0,0.72,0.24),0.34+0.25*sin(u_time*2.0+p.y*7.0));}
      else{base=mix(cyan,violet,0.45+0.4*sin(p.y*8.0+p.x*5.0));}
      return base;
    }

    vec3 background(vec2 p){
      vec3 col=mix(vec3(0.002,0.004,0.012),vec3(0.008,0.015,0.035),saturate(p.y*0.5+0.5));
      vec3 phaseColor=mix(vec3(0.06,0.32,0.50),vec3(0.36,0.12,0.64),smoothstep(0.72,1.0,u_scroll));
      phaseColor=mix(phaseColor,vec3(0.65,0.12,0.025),windowMask(u_scroll,0.56,0.84)*0.8);
      col+=phaseColor*exp(-dot(p,p)*1.65)*0.16;

      vec2 cell=floor((p+vec2(u_time*0.006,-u_time*0.01))*vec2(95.0,62.0));
      vec2 local=fract((p+vec2(u_time*0.006,-u_time*0.01))*vec2(95.0,62.0))-0.5;
      float starHash=hash21(cell);
      float star=smoothstep(0.055,0.0,length(local))*step(0.972,starHash);
      col+=star*mix(vec3(0.36,0.75,1.0),vec3(0.9,0.7,1.0),starHash)*0.85;

      float horizon=smoothstep(-0.55,-0.02,p.y)*(1.0-smoothstep(-0.02,0.45,p.y));
      vec2 gp=vec2(p.x/(p.y+1.18),1.0/(p.y+1.18));
      float gridX=smoothstep(0.035,0.0,abs(fract(gp.x*8.0)-0.5));
      float gridY=smoothstep(0.025,0.0,abs(fract(gp.y*1.6+u_time*0.05)-0.5));
      col+=(gridX+gridY)*horizon*vec3(0.12,0.48,0.62)*0.08*smoothstep(0.75,1.0,u_scroll);

      float pointerY=(u_pointer.y-0.5)*0.24;
      float upper=abs(p.y-(0.82+0.035*sin(p.x*5.0+u_time*1.25)+pointerY));
      float lower=abs(p.y-(-0.82+0.04*sin(p.x*4.2-u_time*1.05)-pointerY));
      float tubeA=exp(-upper*upper*2100.0);
      float tubeB=exp(-lower*lower*1800.0);
      float kinetic=1.0+min(abs(u_velocity)*18.0,2.0);
      col+=tubeA*mix(vec3(0.18,0.9,1.0),vec3(0.7,0.25,1.0),0.5+0.5*sin(p.x*3.0+u_time))*0.46*kinetic;
      col+=tubeB*mix(vec3(1.0,0.20,0.08),vec3(0.63,0.28,1.0),smoothstep(0.45,0.8,u_scroll))*0.32*kinetic;

      for(int i=0;i<12;i++){
        float fi=float(i);
        float seed=hash11(fi*9.17);
        float ang=fi*2.399+u_time*(0.025+seed*0.04);
        float rad=0.45+seed*1.2+0.12*sin(u_time*0.3+fi);
        vec2 q=vec2(cos(ang),sin(ang))*rad;
        q.y*=0.62;
        float d=length(p-q);
        col+=exp(-d*d*850.0)*mix(vec3(0.15,0.78,1.0),vec3(0.7,0.32,1.0),seed)*0.26;
      }
      return col;
    }

    void main(){
      vec2 frag=v_uv*u_resolution;
      vec2 p=(frag*2.0-u_resolution)/min(u_resolution.x,u_resolution.y);
      vec3 col=background(p);

      vec3 ro=vec3((u_pointer.x-0.5)*0.52,(u_pointer.y-0.5)*0.30,4.2+0.35*sin(u_scroll*PI));
      vec3 ta=vec3(0.0,0.02,0.0);
      vec3 ww=normalize(ta-ro);
      vec3 uu=normalize(cross(vec3(0.0,1.0,0.0),ww));
      vec3 vv=cross(ww,uu);
      float lens=mix(1.72,1.95,smoothstep(0.75,1.0,u_scroll));
      vec3 rd=normalize(uu*p.x+vv*p.y+ww*lens);

      float t=0.0;
      float matId=0.0;
      float glow=0.0;
      for(int i=0;i<60;i++){
        vec3 pos=ro+rd*t;
        vec2 h=sceneMap(pos);
        glow+=0.0018/(0.018+abs(h.x));
        if(h.x<0.0015||t>9.5){matId=h.y;break;}
        t+=h.x*0.72;
      }

      if(t<9.5){
        vec3 pos=ro+rd*t;
        vec3 n=getNormal(pos);
        vec3 lightDir=normalize(vec3(-0.48,0.72,0.62));
        float diff=max(dot(n,lightDir),0.0);
        float back=max(dot(n,-lightDir),0.0);
        float fres=pow(1.0-max(dot(n,-rd),0.0),2.5);
        float spec=pow(max(dot(reflect(-lightDir,n),-rd),0.0),42.0);
        vec3 base=materialColor(matId,pos,n,rd);
        vec3 surface=base*(0.10+diff*0.72+back*0.12)+spec*vec3(1.0,0.94,0.82)*1.5+fres*base*1.65;
        float fog=exp(-t*t*0.028);
        col=mix(col,surface,fog);
      }

      vec3 glowColor=mix(vec3(0.1,0.72,1.0),vec3(0.64,0.24,1.0),smoothstep(0.72,1.0,u_scroll));
      glowColor=mix(glowColor,vec3(1.0,0.28,0.06),windowMask(u_scroll,0.56,0.84)*0.8);
      col+=glowColor*min(glow,0.85)*0.035;
      col*=1.0-0.12*dot(p,p);
      col=pow(max(col,0.0),vec3(0.86));
      gl_FragColor=vec4(col,1.0);
    }
`;

type CrownWebGLCanvasProps = {
  rootRef: React.RefObject<HTMLElement>;
};

type UniformLocations = {
  resolution: WebGLUniformLocation | null;
  pointer: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  scroll: WebGLUniformLocation | null;
  velocity: WebGLUniformLocation | null;
};

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to allocate WebGL shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to allocate WebGL program.");

  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SOURCE);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) || "Unknown WebGL program link error.";
    gl.deleteProgram(program);
    throw new Error(info);
  }

  return program;
}

function readCssNumber(element: HTMLElement, name: string) {
  const value = Number.parseFloat(element.style.getPropertyValue(name));
  return Number.isFinite(value) ? value : 0;
}

export function CrownWebGLCanvas({ rootRef }: CrownWebGLCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [fallback, setFallback] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    let frame = 0;
    let quality = 1;
    let slowFrames = 0;
    let previousFrameAt = performance.now();
    let disposed = false;

    const contextAttributes: WebGLContextAttributes = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    };

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let uniforms: UniformLocations | null = null;

    const fail = (error: unknown) => {
      if (disposed) return;
      root.dataset.webglStatus = "fallback";
      setFallback(true);
      console.warn("Blackcrown WebGL scene entered fallback mode.", error);
    };

    const resize = () => {
      if (!gl) return;
      const dprCap = coarsePointer ? 1.0 : 1.35;
      const dpr = Math.max(0.68, Math.min(window.devicePixelRatio || 1, dprCap) * quality);
      const rawWidth = Math.max(1, canvas.clientWidth * dpr);
      const rawHeight = Math.max(1, canvas.clientHeight * dpr);
      const maxPixels = coarsePointer ? 680_000 : 1_300_000;
      const pixelScale = Math.min(1, Math.sqrt(maxPixels / Math.max(1, rawWidth * rawHeight)));
      const width = Math.max(1, Math.floor(rawWidth * pixelScale));
      const height = Math.max(1, Math.floor(rawHeight * pixelScale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.targetX = Math.max(0, Math.min(1, event.clientX / Math.max(1, window.innerWidth)));
      pointer.targetY = Math.max(0, Math.min(1, 1 - event.clientY / Math.max(1, window.innerHeight)));
    };

    const onResize = () => resize();

    try {
      gl = canvas.getContext("webgl", contextAttributes);
      if (!gl) throw new Error("WebGL is unavailable.");

      program = createProgram(gl);
      gl.useProgram(program);

      buffer = gl.createBuffer();
      if (!buffer) throw new Error("Unable to allocate WebGL vertex buffer.");
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );

      const position = gl.getAttribLocation(program, "a_position");
      if (position < 0) throw new Error("WebGL position attribute was not found.");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      uniforms = {
        resolution: gl.getUniformLocation(program, "u_resolution"),
        pointer: gl.getUniformLocation(program, "u_pointer"),
        time: gl.getUniformLocation(program, "u_time"),
        scroll: gl.getUniformLocation(program, "u_scroll"),
        velocity: gl.getUniformLocation(program, "u_velocity"),
      };

      resize();
      root.dataset.webglStatus = "ready";
      setFallback(false);
    } catch (error) {
      fail(error);
    }

    const render = (now: number) => {
      if (disposed) return;

      if (gl && program && uniforms) {
        pointer.x += (pointer.targetX - pointer.x) * (reducedMotion ? 0.35 : 0.075);
        pointer.y += (pointer.targetY - pointer.y) * (reducedMotion ? 0.35 : 0.075);

        gl.useProgram(program);
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
        gl.uniform1f(uniforms.time, reducedMotion ? 0 : now * 0.001);
        gl.uniform1f(uniforms.scroll, readCssNumber(root, "--cx-p"));
        gl.uniform1f(uniforms.velocity, readCssNumber(root, "--cx-v"));
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        const frameTime = now - previousFrameAt;
        previousFrameAt = now;
        slowFrames = frameTime > 29 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
        if (slowFrames > 50 && quality > 0.72) {
          quality = 0.72;
          slowFrames = 0;
          resize();
        }
      }

      frame = window.requestAnimationFrame(render);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
    frame = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (gl && buffer) gl.deleteBuffer(buffer);
      if (gl && program) gl.deleteProgram(program);
    };
  }, [rootRef]);

  return (
    <>
      <canvas ref={canvasRef} className="bcCinematicExperience__webgl" aria-hidden="true" />
      {fallback ? <span className="bcCinematicExperience__reducedBadge">REDUCED GRAPHICS</span> : null}
    </>
  );
}

export default CrownWebGLCanvas;
