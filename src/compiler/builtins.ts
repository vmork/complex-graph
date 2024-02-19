import { DT, functionSignature } from "./types"

type BuiltinVariableInfo = { type: DT, value: number }
type BuiltinVariableEnv = Map<string, BuiltinVariableInfo>

export const builtinVars: BuiltinVariableEnv = new Map(Object.entries({
    'e':  { type: DT.Real, value: Math.exp(1) },
    'pi': { type: DT.Real, value: Math.PI },
}))

export type BuiltinFunctionInfo = { glslName?: string, signatures: functionSignature[] }
export type BuiltinFunctionEnv = Map<string, BuiltinFunctionInfo>

const sigs: { [key: string]: functionSignature[] } = {
    Re_Re_or_Re_Im:  [{out:DT.Real, in:[DT.Real]}, {out:DT.Real, in:[DT.Imag]}],
    Re_Re_or_Im_Im:  [{out:DT.Real, in:[DT.Real]}, {out:DT.Imag, in:[DT.Imag]}],
}

export const builtinFuncs: BuiltinFunctionEnv = new Map(Object.entries({
    're':      { glslName: 'Re',      signatures: sigs.Re_Re_or_Re_Im },
    'im':      { glslName: 'Im',      signatures: sigs.Re_Re_or_Re_Im },
    'abs':     { glslName: 'Abs',     signatures: sigs.Re_Re_or_Re_Im },
    'arg':     { glslName: 'Arg',     signatures: sigs.Re_Re_or_Re_Im },
          
    'conj':    { glslName: 'Conj',    signatures: sigs.Re_Re_or_Im_Im },
    'exp':     { glslName: 'Exp',     signatures: sigs.Re_Re_or_Im_Im },
    'log':     { glslName: 'Log',     signatures: sigs.Re_Re_or_Im_Im },
    'sqrt':    { glslName: 'Sqrt',    signatures: sigs.Re_Re_or_Im_Im },

    'sin':     { glslName: 'Sin',     signatures: sigs.Re_Re_or_Im_Im },
    'cos':     { glslName: 'Cos',     signatures: sigs.Re_Re_or_Im_Im },
    'tan':     { glslName: 'Tan',     signatures: sigs.Re_Re_or_Im_Im },
    'arctan':  { glslName: 'Arctan',  signatures: sigs.Re_Re_or_Im_Im },
    'arcsin':  { glslName: 'Arcsin',  signatures: sigs.Re_Re_or_Im_Im },
    'arccos':  { glslName: 'Arccos',  signatures: sigs.Re_Re_or_Im_Im },
}))
