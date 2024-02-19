import type { UserVariable } from './types';
import type { ShaderError as glslShaderError } from './webgl-utils'
import { v4 as uuidv4 } from 'uuid';
import { randomColorRGB } from './utils';
import { CompileError } from './compiler/error';
import { writable } from 'svelte/store'

type CompilationError = glslShaderError | CompileError;

export const compilationErrors = writable<CompilationError[]>([])

export const uvars = writable<UserVariable[]>([
    {id: uuidv4(), type: "float", name: "x", value: 0, min: -10, max: 10, step: 0.01},
    {id: uuidv4(), type: "vec2", name: "p", x: 0, y: 0, color: randomColorRGB()},
]);