#version 300 es

in vec2 a_position;

//#UNIFORMS
//#include complex.glsl
//#UFUNC

void main() { 
    vec2 pos = mix(a_position, f(a_position), u_t);
    pos = (u_worldMatInv * vec3(pos, 1.0)).xy;
    gl_Position = vec4(pos, 0.0, 1.0);
}