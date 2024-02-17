vec2 f(vec2 z) {
    return Pow(z, Pow(z, Pow(z, Pow(z, 1.0)))) - Cos(Arccos(z)) + z;
}

// PowC(z*Im(z), PowC(z, PowC(z, Pow(z, 1.5))))
// Cos(Arccos(z)) - z