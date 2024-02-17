#define Pi 3.1415926535897932384626433832795
#define I vec2(0, 1)

// Unary operations

float Re(vec2 z) { return z.x; }
float Re(float x) { return x; }

float Im(vec2 z) { return z.y; } 
float Im(float x) { return 0.0; }

vec2 Conj(vec2 z) { return vec2(z.x, -z.y); }
float Conj(float z) { return z; }

float Abs(vec2 z) { return length(z); }
float Abs(float x) { return abs(x); }

float Arg(vec2 z) { return atan(z.y, z.x); } // [-pi, pi]
float Arg(float x) { return x < 0.0 ? Pi : 0.0; }

vec2 Inv(vec2 z) { return vec2(z.x, -z.y) / dot(z, z); }
float Inv(float x) { return 1.0 / x; }

vec2 TimesI(vec2 z) { return vec2(-z.y, z.x); }
vec2 TimesI(float x) { return x * I; }

vec2 Exp(vec2 z) { return exp(z.x) * vec2(cos(z.y), sin(z.y)); }
float Exp(float x) { return exp(x); }

vec2 Log(vec2 z) { return vec2(log(length(z)), atan(z.y, z.x)); }
float Log(float x) { return log(x); }

// Binary operations

vec2 Mul(vec2 z1, vec2 z2) { return vec2(z1.x*z2.x - z1.y*z2.y, z1.x*z2.y + z1.y*z2.x); }

vec2 Div(vec2 z1, vec2 z2) { return vec2(z1.x*z2.x + z1.y*z2.y, z1.y*z2.x - z1.x*z2.y) / dot(z2, z2); }
vec2 Div(float x1, vec2 z2) { return x1 * Inv(z2); }

vec2 Pow(vec2 z, vec2 w) { return Exp(Mul(w, Log(z))); }
vec2 Pow(vec2 z, float p) { float t = Arg(z); return pow(length(z), p) * vec2(cos(p*t), sin(p*t)); }
vec2 Pow(float x, vec2 w) { return Exp(log(x) * w); }
float Pow(float x, float p) { return pow(x, p); }

vec2 Sqrt(vec2 z) { return Pow(z, 0.5); }
float Sqrt(float x) { return sqrt(x); }

// Trig functions
// https://en.wikipedia.org/wiki/Inverse_trigonometric_functions#Extension_to_the_complex_plane
// https://scipp.ucsc.edu/~haber/archives/physics116A10/arc_10.pdf

vec2 Sin(vec2 z) { return vec2(sin(z.x)*cosh(z.y), cos(z.x)*sinh(z.y)); }
float Sin(float x) { return sin(x); }

vec2 Cos(vec2 z) { return vec2(cos(z.x)*cosh(z.y), -sin(z.x)*sinh(z.y)); }
float Cos(float x) { return cos(x); }

vec2 Tan(vec2 z) { return Div(Sin(z), Cos(z)); }
float Tan(float x) { return tan(x); }

vec2 Arctan(vec2 z) { return -0.5*TimesI(Log(Div(I - z, I + z))); }
float Arctan(float x) { return atan(x); }

vec2 Arcsin(vec2 z) { return TimesI(Log(Sqrt(vec2(1,0) - Mul(z,z)) - TimesI(z))); }
float Arccos(float x) { return acos(x); }

vec2 Arccos(vec2 z) { return -TimesI(Log(z + TimesI(Sqrt(vec2(1,0) - Mul(z,z))))); }
float Arcsin(float x) { return asin(x);}

