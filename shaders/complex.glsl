#define Pi 3.1415926535897932384626433832795
#define I vec2(0, 1)

vec2 Add(vec2 z1, vec2 z2) {
    return z1 + z2;
}

vec2 Mul(vec2 z1, vec2 z2) {
    return vec2(z1.x*z2.x - z1.y*z2.y, z1.x*z2.y + z1.y*z2.x);
}

vec2 Div(vec2 z1, vec2 z2) {
    return vec2(z1.x*z2.x + z1.y*z2.y, z1.y*z2.x - z1.x*z2.y) / dot(z2, z2);
}

float Re(vec2 z) {
    return z.x;
}

float Im(vec2 z) {
    return z.y;
}

vec2 Conj(vec2 z) {
    return vec2(z.x, -z.y);
}

float Abs(vec2 z) {
    return length(z);
}

float Arg(vec2 z) { // -Pi to Pi
    return atan(z.y, z.x);
}

vec2 Inv(vec2 z) {
    return vec2(z.x, -z.y) / dot(z, z);
}

vec2 TimesI(vec2 z) {
    return vec2(-z.y, z.x);
}

vec2 Pow(vec2 z, float p) {
    float t = Arg(z);
    return pow(length(z), p) * vec2(cos(p*t), sin(p*t));
}

vec2 Sqrt(vec2 z) {
    return Pow(z, 0.5);
}

vec2 Exp(vec2 z) {
    return exp(z.x) * vec2(cos(z.y), sin(z.y));
}

vec2 Log(vec2 z) {
    return vec2(log(length(z)), atan(z.y, z.x));
}

vec2 PowC(vec2 z, vec2 w) {
    return Exp(Mul(w, Log(z)));
}

// Trig functions
// https://en.wikipedia.org/wiki/Inverse_trigonometric_functions#Extension_to_the_complex_plane
// https://scipp.ucsc.edu/~haber/archives/physics116A10/arc_10.pdf

vec2 Sin(vec2 z) {
    return vec2(sin(z.x)*cosh(z.y), cos(z.x)*sinh(z.y));
}

vec2 Cos(vec2 z) {
    return vec2(cos(z.x)*cosh(z.y), -sin(z.x)*sinh(z.y));
}

vec2 Tan(vec2 z) {
    return Div(Sin(z), Cos(z));
}

vec2 Arctan(vec2 z) {
    return -0.5*TimesI(Log(Div(I - z, I + z)));
}

vec2 Arcsin(vec2 z) {
    return TimesI(Log(Sqrt(vec2(1,0) - Mul(z,z)) - TimesI(z)));
}

vec2 Arccos(vec2 z) {
    return -TimesI(Log(z + TimesI(Sqrt(vec2(1,0) - Mul(z,z)))));
}

