#version 300 es 

precision highp float;

#define PI 3.1415926535897932384626433832795
#define TAU 6.283185307179586476925286766559

in vec2 uv;
out vec4 outColor;

//#UNIFORMS

//#include complex.glsl

//#UFUNC

const float modRepeat = 1.0;    const float modStrength = 0.08;
const float phaseRepeat = 10.0; const float phaseStrength = 0.05;
const vec3 gridColor = vec3(0.2);

float grid(vec2 z) {
    float pix = 1.5 * u_scale.y / u_resolution.y; // pixel size
    float gs = u_gridSpacing * exp(-ceil(-log(u_scale.y))); // grid spacing
    float gw = 0.5*pix; // line width

    vec2 p = abs(mod(z + gw/2.0 + pix, gs) - pix);
    float g = min(p.x, p.y) - gw;

    return smoothstep(pix, 0.0, g);
}

vec3 gradient(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b*cos(TAU*(c*t+d));
}

vec3 domainColor(vec2 z) {
    float t = Arg(z) / TAU + 0.5; // 0-1 
    vec3 c = gradient(t, vec3(0.4), vec3(0.5), vec3(1.0, 1.0, 0.75), vec3(0.8, 0.9, 0.3));
    
    float modContour = u_showModContours ? pow(fract(modRepeat*log(Abs(z))), modStrength) : 1.0;
    float phaseContour = u_showPhaseContours ? pow(fract(phaseRepeat*t), phaseStrength) : 1.0;

    return c * modContour * phaseContour;
}

void main() {
    vec2 z = f(uv);

    vec3 col = domainColor(z);
    if (u_showGrid) col = mix(col, gridColor, grid(z));

    outColor = vec4(col, 1.0);
}