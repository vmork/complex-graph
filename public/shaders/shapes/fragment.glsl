#version 300 es 

precision highp float;

out vec4 outColor;

//#UNIFORMS

void main() {
    outColor = vec4(u_color, 1.0);
}