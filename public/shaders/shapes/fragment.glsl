#version 300 es 

precision highp float;

in vec2 uv;
out vec4 outColor;

//#UNIFORMS

//#include complex.glsl

float g(vec2 p) {
    return length(p) - 1.0;
}

vec2 f(vec2 uv) {
    return Log(uv);
    return Div(uv + vec2(0., 1.), -uv + vec2(0., 1.));
}

void main() {
    float pix = 1.0 * u_scale.y / u_resolution.y; // pixel size
    vec4 col = vec4(0.0, 0.0, 0.0, 1.0);

    float d = (g(f(uv)) <= 10.0*pix) ? 1.0 : -1.0;
    outColor = mix(col, vec4(0.0), 1.0-step(0.0, d));
    // outColor = mix(vec4(0.0, 0.8, 0.0, 1.0), vec4(0.0), step(0.0, d));
}