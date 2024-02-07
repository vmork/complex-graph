import type { ShaderError } from './webgl-utils'

import { writable } from 'svelte/store'

export const shaderError = writable<ShaderError>(null)