import React from "react";

const VERTEX_SHADER = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;
uniform float u_scroll;
uniform float u_motion;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise21(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.52;
  mat2 rotation = mat2(0.82, -0.57, 0.57, 0.82);

  for (int i = 0; i < 4; i++) {
    value += amplitude * noise21(p);
    p = rotation * p * 2.03 + 7.13;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / max(u_resolution, vec2(1.0));
  float aspect = u_resolution.x / max(1.0, u_resolution.y);

  vec2 p = uv - 0.5;
  p.x *= aspect;

  float time = u_time * u_motion;
  float slowTime = time * 0.085;

  float broadNoise = fbm(p * 2.45 + vec2(slowTime * 0.24, -slowTime * 0.18));
  float fineNoise = fbm(p * 5.2 + vec2(-slowTime * 0.12, slowTime * 0.22));

  float ribbonAOffset = 0.1 * sin(p.x * 3.1 + slowTime * 1.8 + broadNoise * 4.2);
  float ribbonBOffset = 0.13 * sin(p.x * 2.2 - slowTime * 1.35 + fineNoise * 3.7);
  float ribbonA = exp(-abs(p.y - 0.12 - ribbonAOffset) * 8.4);
  float ribbonB = exp(-abs(p.y + 0.25 - ribbonBOffset) * 7.2);

  vec2 pointer = u_pointer - 0.5;
  pointer.x *= aspect;
  vec2 pointerDelta = p - pointer;
  float pointerField = exp(-dot(pointerDelta, pointerDelta) * 5.4);

  float pulse = 0.5 + 0.5 * sin(time * 0.42 + broadNoise * 6.2831);
  float nodePattern = sin((p.x + p.y) * 17.0 + fineNoise * 8.0 - time * 0.22) * 0.5 + 0.5;
  float nodes = smoothstep(0.91, 1.0, nodePattern) * (0.35 + pulse * 0.22);

  float scanWave = sin((uv.y + time * 0.012) * 230.0) * 0.5 + 0.5;
  float scan = pow(scanWave, 30.0) * 0.028;

  float viewportFade = mix(1.0, 0.2, smoothstep(0.02, 1.0, u_scroll));
  float vignette = 1.0 - smoothstep(0.25, 1.04, length(p * vec2(0.78, 1.08)));
  float heroFocus = smoothstep(-0.58, 0.4, p.y) * 0.48 + 0.52;

  float cyanField = ribbonA * (0.2 + broadNoise * 0.19) + pointerField * 0.18 + nodes * 0.045 + scan;
  float violetField = ribbonB * (0.12 + fineNoise * 0.12) + pulse * broadNoise * 0.025;

  vec3 cyan = vec3(0.02, 0.78, 1.0);
  vec3 ice = vec3(0.42, 0.93, 1.0);
  vec3 violet = vec3(0.42, 0.18, 1.0);

  vec3 color = mix(cyan, ice, clamp(pointerField * 0.58 + ribbonA * 0.2, 0.0, 1.0));
  color += violet * violetField;

  float alpha = clamp((cyanField + violetField) * vignette * heroFocus * viewportFade, 0.0, 0.42);
  gl_FragColor = vec4(color * (0.58 + alpha * 1.25), alpha * 0.72);
}
`;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("BlackCrown shader compilation failed", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("BlackCrown shader linking failed", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

/**
 * A deliberately low-resolution WebGL atmosphere pass.
 * It adds real GPU-rendered energy fog and ribbons behind the public site while
 * keeping the existing Matrix canvas as the recognizable primary background.
 */
export function GameShaderLayer() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
    });

    if (!gl) {
      canvas.dataset.fallback = "true";
      return;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      canvas.dataset.fallback = "true";
      return;
    }

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      canvas.dataset.fallback = "true";
      return;
    }

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const pointerLocation = gl.getUniformLocation(program, "u_pointer");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const scrollLocation = gl.getUniformLocation(program, "u_scroll");
    const motionLocation = gl.getUniformLocation(program, "u_motion");

    const buffer = gl.createBuffer();
    if (!buffer || positionLocation < 0) {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      canvas.dataset.fallback = "true";
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    let reduced = reducedMotion.matches;
    let coarse = coarsePointer.matches;
    let rafId = 0;
    let resizeRafId = 0;
    let lastFrameTime = 0;
    const startedAt = performance.now();

    const pointer = {
      x: 0.68,
      y: 0.72,
      targetX: 0.68,
      targetY: 0.72,
    };

    let scrollProgress = 0;
    let targetScrollProgress = 0;

    const stop = () => {
      if (!rafId) return;
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const draw = (timestamp: number) => {
      if (canvas.width <= 0 || canvas.height <= 0) return;

      pointer.x += (pointer.targetX - pointer.x) * (reduced ? 1 : 0.075);
      pointer.y += (pointer.targetY - pointer.y) * (reduced ? 1 : 0.075);
      scrollProgress += (targetScrollProgress - scrollProgress) * (reduced ? 1 : 0.09);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(pointerLocation, pointer.x, pointer.y);
      gl.uniform1f(timeLocation, reduced ? 0.8 : (timestamp - startedAt) / 1000);
      gl.uniform1f(scrollLocation, scrollProgress);
      gl.uniform1f(motionLocation, reduced ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (timestamp: number) => {
      rafId = 0;
      if (reduced || document.visibilityState === "hidden") return;

      const interval = 1000 / (coarse ? 18 : 32);
      if (timestamp - lastFrameTime < interval) {
        rafId = window.requestAnimationFrame(frame);
        return;
      }

      lastFrameTime = timestamp;
      draw(timestamp);
      rafId = window.requestAnimationFrame(frame);
    };

    const start = () => {
      stop();
      if (reduced || document.visibilityState === "hidden") {
        draw(performance.now());
        return;
      }

      lastFrameTime = 0;
      rafId = window.requestAnimationFrame(frame);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.2 : 1.5);
      const renderScale = coarse ? 0.46 : 0.64;
      const width = Math.max(1, Math.round(rect.width * dpr * renderScale));
      const height = Math.max(1, Math.round(rect.height * dpr * renderScale));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      draw(performance.now());
    };

    const requestResize = () => {
      if (resizeRafId) return;
      resizeRafId = window.requestAnimationFrame(() => {
        resizeRafId = 0;
        resize();
      });
    };

    const updateScrollTarget = () => {
      const viewport = Math.max(1, window.innerHeight || 1);
      targetScrollProgress = clamp((window.scrollY || 0) / (viewport * 0.95), 0, 1);
      if (reduced) draw(performance.now());
    };

    const onPointerMove = (event: PointerEvent) => {
      if (reduced || coarse || !finePointer.matches || event.isPrimary === false) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      pointer.targetX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      pointer.targetY = clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") stop();
      else start();
    };

    const onReducedMotionChange = () => {
      reduced = reducedMotion.matches;
      start();
    };

    const onPointerModeChange = () => {
      coarse = coarsePointer.matches;
      if (coarse) {
        pointer.targetX = 0.66;
        pointer.targetY = 0.72;
      }
      requestResize();
      start();
    };

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(requestResize) : null;
    resizeObserver?.observe(canvas);

    root.classList.add("bcGameShaderReady");
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", updateScrollTarget, { passive: true });
    window.addEventListener("resize", requestResize, { passive: true });
    window.addEventListener("orientationchange", requestResize, { passive: true });
    window.visualViewport?.addEventListener?.("resize", requestResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.addEventListener?.("change", onReducedMotionChange);
    coarsePointer.addEventListener?.("change", onPointerModeChange);

    updateScrollTarget();
    resize();
    start();

    return () => {
      stop();
      resizeObserver?.disconnect();

      if (resizeRafId) window.cancelAnimationFrame(resizeRafId);

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", updateScrollTarget);
      window.removeEventListener("resize", requestResize);
      window.removeEventListener("orientationchange", requestResize);
      window.visualViewport?.removeEventListener?.("resize", requestResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener?.("change", onReducedMotionChange);
      coarsePointer.removeEventListener?.("change", onPointerModeChange);

      root.classList.remove("bcGameShaderReady");
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return <canvas ref={canvasRef} className="bcGameShader" aria-hidden="true" />;
}

export default GameShaderLayer;
