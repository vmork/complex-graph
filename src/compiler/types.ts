export enum DT {
    Bool, Real, Imag 
}

export type glslType = "float" | "vec2" | "bool"

export type functionSignature = { out: DT, in: DT[] }

export const typeToGlslType = new Map<DT, glslType>([
    [DT.Real, "float"], [DT.Imag, "vec2"], [DT.Bool, "bool"]
])

export const glslTypeToDT = new Map<glslType, DT>([
    ["float", DT.Real, ], ["vec2", DT.Imag, ], ["bool", DT.Bool]
])
