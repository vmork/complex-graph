export enum DT {
    Bool, Real, Imag, Color 
}

export type glslType = "float" | "vec2" | "bool" | "vec3"

export type functionSignature = { out: DT, in: DT[] }

export function signatureString(sig: functionSignature) {
    return `(${sig.in.map(s => DT[s]).join(",")}) -> ${DT[sig.out]}`
}

export const typeToGlslType = new Map<DT, glslType>([
    [DT.Real, "float"], [DT.Imag, "vec2"], [DT.Bool, "bool"], [DT.Color, "vec3"]
])

export const glslTypeToDT = new Map<glslType, DT>([
    ["float", DT.Real, ], ["vec2", DT.Imag, ], ["bool", DT.Bool], ["vec3", DT.Color]
])
