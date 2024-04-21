#version 300 es

void main() {
    // draw the top left pixel only
    gl_Position = vec4(-0.9999, -0.9999, 0.0, 1.0); 
    gl_PointSize = 1.0;
}