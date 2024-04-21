#version 300 es 

in vec2 a_position;
uniform mat3 u_worldMat;
out vec2 uv;

void main() {
    gl_Position = vec4(a_position, 0, 1);
    uv = (u_worldMat * vec3(a_position, 1)).xy;
    // uv = a_position;
}