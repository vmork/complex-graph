#version 300 es
precision highp float;

out vec4 outColor;

//#UNIFORMS

//#include complex.glsl

//#UFUNC

void main() {
    outColor = vec4(f(u_point), 0.0, 1.0);
}