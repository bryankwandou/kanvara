export const VERT = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

/**
 * Separable gaussian. Run once horizontally then once vertically; two 9-tap
 * passes cost 18 samples instead of the 81 a single 2D kernel would need,
 * and the result is identical because a gaussian is separable.
 */
export const FRAG_BLUR = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_tex;
uniform vec2 u_dir;      // texel-sized step, horizontal or vertical
uniform float u_radius;  // in texels

void main() {
  float w[5];
  w[0] = 0.227027; w[1] = 0.194594; w[2] = 0.121621; w[3] = 0.054054; w[4] = 0.016216;

  vec4 sum = texture(u_tex, v_uv) * w[0];
  for (int i = 1; i < 5; i++) {
    vec2 off = u_dir * u_radius * float(i);
    sum += texture(u_tex, v_uv + off) * w[i];
    sum += texture(u_tex, v_uv - off) * w[i];
  }
  fragColor = sum;
}`;

/**
 * The whole colour pipeline in one pass. Order matters and follows the order a
 * raw processor would use: exposure and white balance act on the signal before
 * tone shaping, tone shaping before saturation, and the film-like effects
 * (fade, vignette, grain) last, because they are meant to sit on top of a
 * finished image rather than be graded through.
 */
export const FRAG_MAIN = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_tex;
uniform vec2 u_texel;

uniform float u_exposure;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_vibrance;
uniform float u_temperature;
uniform float u_tint;
uniform float u_highlights;
uniform float u_shadows;
uniform float u_whites;
uniform float u_blacks;
uniform float u_hue;
uniform float u_sharpen;
uniform float u_grain;
uniform float u_vignette;
uniform float u_fade;
uniform float u_grayscale;
uniform float u_sepia;
uniform float u_invert;
uniform float u_seed;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

float luma(vec3 c) { return dot(c, LUMA); }

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + 1e-10)), d / (q.x + 1e-10), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec4 src = texture(u_tex, v_uv);
  vec3 col = src.rgb;

  // Unsharp mask. Sampled unconditionally so the texture fetches stay in
  // uniform control flow; when u_sharpen is 0 the term cancels out anyway.
  vec3 ring = (
      texture(u_tex, v_uv + vec2(u_texel.x, 0.0)).rgb
    + texture(u_tex, v_uv - vec2(u_texel.x, 0.0)).rgb
    + texture(u_tex, v_uv + vec2(0.0, u_texel.y)).rgb
    + texture(u_tex, v_uv - vec2(0.0, u_texel.y)).rgb
  ) * 0.25;
  col += (col - ring) * u_sharpen * 2.5;

  col *= pow(2.0, u_exposure);

  col.r += u_temperature * 0.12;
  col.b -= u_temperature * 0.12;
  col.g -= u_tint * 0.10;
  col.r += u_tint * 0.05;
  col.b += u_tint * 0.05;
  col = max(col, 0.0);

  float l = luma(col);
  col += u_highlights * 0.5 * smoothstep(0.45, 1.0, l);
  col += u_shadows * 0.5 * (1.0 - smoothstep(0.0, 0.55, l));
  col += u_whites * 0.3 * smoothstep(0.7, 1.0, l);
  col += u_blacks * 0.3 * (1.0 - smoothstep(0.0, 0.3, l));
  col = max(col, 0.0);

  col = (col - 0.5) * (1.0 + u_contrast) + 0.5;
  col += u_brightness;

  // Vibrance leans on already-muted pixels and mostly leaves saturated ones
  // alone, which is what keeps skin tones from going orange.
  float mx = max(col.r, max(col.g, col.b));
  float mn = min(col.r, min(col.g, col.b));
  float sat = mx - mn;
  col = mix(vec3(luma(col)), col, 1.0 + u_vibrance * (1.0 - clamp(sat, 0.0, 1.0)));
  col = mix(vec3(luma(col)), col, 1.0 + u_saturation);

  vec3 hsv = rgb2hsv(clamp(col, 0.0, 1.0));
  hsv.x = fract(hsv.x + u_hue);
  col = mix(col, hsv2rgb(hsv), step(0.0005, abs(u_hue)));

  col = mix(col, vec3(luma(col)), u_grayscale);

  vec3 sep = vec3(
    dot(col, vec3(0.393, 0.769, 0.189)),
    dot(col, vec3(0.349, 0.686, 0.168)),
    dot(col, vec3(0.272, 0.534, 0.131))
  );
  col = mix(col, sep, u_sepia);

  // Fade compresses the range upward, the way a print left in sunlight does.
  col = col * (1.0 - u_fade * 0.40) + u_fade * 0.18;

  col = mix(col, 1.0 - col, u_invert);

  float d = distance(v_uv, vec2(0.5)) * 1.4142;
  float vig = smoothstep(0.32, 0.92, d) * u_vignette;
  col *= 1.0 - max(vig, 0.0);
  col += max(-vig, 0.0) * 0.55;

  col += (hash(v_uv * 1024.0 + u_seed) - 0.5) * u_grain * 0.35;

  fragColor = vec4(clamp(col, 0.0, 1.0), src.a);
}`;
