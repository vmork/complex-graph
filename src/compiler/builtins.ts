import { DT, functionSignature as FunctionSignature } from "./types"

type BuiltinVariableInfo = { type: DT, value: string }
type BuiltinVariableEnv = Map<string, BuiltinVariableInfo>

export const builtinVars: BuiltinVariableEnv = new Map(Object.entries({
    'e':  { type: DT.Real, value: 'exp(1.0)' },
    'pi': { type: DT.Real, value: 'Pi' },
}))

export type BuiltinFunctionInfo = { glslName?: string, signatures: FunctionSignature[] }
export type BuiltinFunctionEnv = Map<string, BuiltinFunctionInfo>

const sigs: Record<string, FunctionSignature[]> = {
    Re__Re_or_Im__Re:             [{out:DT.Real, in:[DT.Real]}, {out:DT.Real, in:[DT.Imag]}],
    Re__Re_or_Im__Im:             [{out:DT.Real, in:[DT.Real]}, {out:DT.Imag, in:[DT.Imag]}],
    Re__Re_or_Im__Im_or_Col__Col: [{out:DT.Real, in:[DT.Real]}, {out:DT.Imag, in:[DT.Imag]}, {out:DT.Color, in:[DT.Color]}],
    Re_Re__Re:                    [{out:DT.Real, in:[DT.Real, DT.Real]}],
    color:                        [{out:DT.Color, in:[DT.Real, DT.Real, DT.Real]}, {out: DT.Color, in:[DT.Real]}]
}

export const builtinFuncs: BuiltinFunctionEnv = new Map(Object.entries({
    're':      { glslName: 'Re',      signatures: sigs.Re__Re_or_Im__Re },
    'im':      { glslName: 'Im',      signatures: sigs.Re__Re_or_Im__Re },
    'abs':     { glslName: 'Abs',     signatures: sigs.Re__Re_or_Im__Re },
    'arg':     { glslName: 'Arg',     signatures: sigs.Re__Re_or_Im__Re },
          
    'conj':    { glslName: 'Conj',    signatures: sigs.Re__Re_or_Im__Im },
    'exp':     { glslName: 'Exp',     signatures: sigs.Re__Re_or_Im__Im },
    'log':     { glslName: 'Log',     signatures: sigs.Re__Re_or_Im__Im },
    'sqrt':    { glslName: 'Sqrt',    signatures: sigs.Re__Re_or_Im__Im },

    'sin':     { glslName: 'Sin',     signatures: sigs.Re__Re_or_Im__Im_or_Col__Col }, // col->col for ie gradients
    'cos':     { glslName: 'Cos',     signatures: sigs.Re__Re_or_Im__Im_or_Col__Col },
    'tan':     { glslName: 'Tan',     signatures: sigs.Re__Re_or_Im__Im_orl },
    'arctan':  { glslName: 'Arctan',  signatures: sigs.Re__Re_or_Im__Im },
    'arcsin':  { glslName: 'Arcsin',  signatures: sigs.Re__Re_or_Im__Im },
    'arccos':  { glslName: 'Arccos',  signatures: sigs.Re__Re_or_Im__Im },

    'min':     { glslName: 'min',     signatures: sigs.Re_Re__Re },
    'max':     { glslName: 'max',     signatures: sigs.Re_Re__Re },

    'color':   { glslName: 'vec3',    signatures: sigs.color },
}))
