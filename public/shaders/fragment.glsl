#version 300 es 

precision highp float;

#define PI 3.1415926535897932384626433832795
#define TAU 6.283185307179586476925286766559

in vec2 uv;
out vec4 outColor;

//#UNIFORMS

//#include complex.glsl

//#UFUNC

const float modRepeat = 2.0; const float modStrength = 0.2;
const float phaseRepeat = 8.0; const float phaseStrength = 0.1;

vec3 gradient(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b*cos(TAU*(c*t+d));
}

vec3 color(vec2 z) {
    float t = Arg(z) / TAU + 0.5; // 0-1 
    vec3 c = gradient(t, vec3(0.4), vec3(0.5), vec3(1.0, 1.0, 0.75), vec3(0.8, 0.9, 0.3));
    
    float modContour = pow(fract(modRepeat*log(Abs(z))), modStrength);
    float phaseContour = pow(fract(phaseRepeat*t), phaseStrength);
    return c * modContour * phaseContour;
}

void main() {
    vec2 z = f(uv);

    vec3 col = color(z);

    // float r = length(z - u_mouse);
    // col *= (1.0 - smoothstep(1.0, 2.0, r));

    outColor = vec4(col, 1.0);
}