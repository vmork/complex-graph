import type { UserVariable } from './types';
import type { ShaderError as glslShaderError } from './webgl-utils'
import { CompileError } from './compiler/error';
import { writable } from 'svelte/store'
import { Shape } from './shapes';


type CompilationError = glslShaderError | CompileError;

export const compilationErrors = writable<CompilationError[]>([])

export const uvars = writable<UserVariable[]>([]);

export const shapes = writable<Shape[]>([]);
