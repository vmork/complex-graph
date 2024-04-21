#version 300 es
precision highp float;

out vec4 value;

//#UNIFORMS

//#include complex.glsl

//#UFUNC

void main() {
    value = vec4(f(u_point), 0.0, 1.0);
}