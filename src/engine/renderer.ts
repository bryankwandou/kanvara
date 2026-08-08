import { FRAG_BLUR, FRAG_MAIN, VERT } from './shaders';
import type { Adjustments } from './types';

/** UI sliders run -100..100; the shader wants physical units. */
function normalise(a: Adjustments) {
  return {
    u_exposure: a.exposure / 50, // ±2 stops at the extremes
    u_brightness: (a.brightness / 100) * 0.4,
    u_contrast: (a.contrast / 100) * 0.8,
    u_saturation: a.saturation / 100,
    u_vibrance: a.vibrance / 100,
    u_temperature: a.temperature / 100,
    u_tint: a.tint / 100,
    u_highlights: a.highlights / 100,
    u_shadows: a.shadows / 100,
    u_whites: a.whites / 100,
    u_blacks: a.blacks / 100,
    u_hue: a.hue / 360,
    u_sharpen: a.sharpen / 100,
    u_grain: a.grain / 100,
    u_vignette: a.vignette / 100,
    u_fade: a.fade / 100,
    u_grayscale: a.grayscale / 100,
    u_sepia: a.sepia / 100,
    u_invert: a.invert / 100,
  };
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`Shader failed to compile: ${log}`);
  }
  return sh;
}

function link(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'a_pos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(`Program failed to link: ${gl.getProgramInfoLog(p)}`);
  }
  return p;
}

type Target = { fb: WebGLFramebuffer; tex: WebGLTexture };

/**
 * Applies the adjustment stack to a single bitmap on the GPU.
 *
 * One instance is reused for the whole session — creating a WebGL context per
 * render would exhaust the browser's context limit within a few dozen edits,
 * and re-uploading the source texture on every slider tick is what makes
 * naive canvas editors feel sluggish. Here the source is uploaded once by
 * setSource() and every subsequent render() is pure GPU work.
 */
export class ImageRenderer {
  readonly canvas: HTMLCanvasElement | OffscreenCanvas;
  private gl: WebGL2RenderingContext;
  private progMain: WebGLProgram;
  private progBlur: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private srcTex: WebGLTexture | null = null;
  private targets: Target[] = [];
  private w = 0;
  private h = 0;

  constructor(canvas?: HTMLCanvasElement) {
    this.canvas = canvas ?? document.createElement('canvas');
    const gl = (this.canvas as HTMLCanvasElement).getContext('webgl2', {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      antialias: false,
      alpha: true,
    });
    if (!gl) throw new Error('WebGL2 is unavailable in this browser.');
    this.gl = gl;

    this.progMain = link(gl, VERT, FRAG_MAIN);
    this.progBlur = link(gl, VERT, FRAG_BLUR);

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  private makeTexture(): WebGLTexture {
    const gl = this.gl;
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
  }

  private ensureTargets(w: number, h: number) {
    const gl = this.gl;
    for (const t of this.targets) {
      gl.deleteFramebuffer(t.fb);
      gl.deleteTexture(t.tex);
    }
    this.targets = [];
    for (let i = 0; i < 2; i++) {
      const tex = this.makeTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const fb = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      this.targets.push({ fb, tex });
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** Upload the bitmap once. Cheap to call again when the layer changes. */
  setSource(source: TexImageSource, width: number, height: number) {
    const gl = this.gl;
    this.w = width;
    this.h = height;
    (this.canvas as HTMLCanvasElement).width = width;
    (this.canvas as HTMLCanvasElement).height = height;

    if (!this.srcTex) this.srcTex = this.makeTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    this.ensureTargets(width, height);
  }

  private drawQuad() {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  render(adj: Adjustments) {
    const gl = this.gl;
    if (!this.srcTex || !this.w || !this.h) return;

    gl.viewport(0, 0, this.w, this.h);
    gl.disable(gl.BLEND);

    let input = this.srcTex;

    // Blur runs first so that everything downstream — sharpen, grain,
    // vignette — lands on top of it rather than being smeared by it.
    const radius = (adj.blur / 100) * 22;
    if (radius > 0.01) {
      gl.useProgram(this.progBlur);
      gl.uniform1i(gl.getUniformLocation(this.progBlur, 'u_tex'), 0);
      gl.uniform1f(gl.getUniformLocation(this.progBlur, 'u_radius'), radius);
      gl.activeTexture(gl.TEXTURE0);

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.targets[0].fb);
      gl.bindTexture(gl.TEXTURE_2D, input);
      gl.uniform2f(gl.getUniformLocation(this.progBlur, 'u_dir'), 1 / this.w, 0);
      this.drawQuad();

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.targets[1].fb);
      gl.bindTexture(gl.TEXTURE_2D, this.targets[0].tex);
      gl.uniform2f(gl.getUniformLocation(this.progBlur, 'u_dir'), 0, 1 / this.h);
      this.drawQuad();

      input = this.targets[1].tex;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(this.progMain);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, input);
    gl.uniform1i(gl.getUniformLocation(this.progMain, 'u_tex'), 0);
    gl.uniform2f(gl.getUniformLocation(this.progMain, 'u_texel'), 1 / this.w, 1 / this.h);
    gl.uniform1f(gl.getUniformLocation(this.progMain, 'u_seed'), 0.0);

    const u = normalise(adj);
    for (const [name, value] of Object.entries(u)) {
      const loc = gl.getUniformLocation(this.progMain, name);
      if (loc) gl.uniform1f(loc, value as number);
    }

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.drawQuad();
  }

  dispose() {
    const gl = this.gl;
    for (const t of this.targets) {
      gl.deleteFramebuffer(t.fb);
      gl.deleteTexture(t.tex);
    }
    if (this.srcTex) gl.deleteTexture(this.srcTex);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

let shared: ImageRenderer | null = null;

/** One context for the whole app; browsers cap them at roughly 16. */
export function getRenderer(): ImageRenderer {
  if (!shared) shared = new ImageRenderer();
  return shared;
}
