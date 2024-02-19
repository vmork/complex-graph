import { Point, UserPoint, UserSlider, UserVariable, VariableType } from "./types";
import { v4 as uuidv4 } from 'uuid';
import { randomColorRGB } from "./utils";
import { Canvas } from "./canvas";
import { uvars } from "./stores";

const codes = {
    identity: `f(z) := z`,

    juliaSetStandard: 
`g(z) := z^2 + c

f(z) := 
  for j = 1..N: z = g(z)
  return z`,

    juliaSetBurningShip: 
`g(z) := (abs(re(z)) + i abs(im(z)))^x + c

f(z) := 
  for j = 1..N: z = g(z)
  return z`,

    mandelbrotStandard: 
`g(z, c) := z^x + c

f(c) := 
  w := 0 + 0i
  for j = 1..N: 
    if abs(w) > 2: break
    w = g(w, c)
  return w`
}

export type WorkspaceData = {
    code: string;
    vars: UserVariable[]
}

function makeSlider(name: string, value: number, min=-10, max=10, step=0.001): UserSlider {
    return {id: uuidv4(), type: "float", name, value, min, max, step};
}
function makePoint(name: string, x=0, y=0, color=randomColorRGB()): UserPoint {
    return {id: uuidv4(), type: "vec2", name, x, y, color};
}

export const workspaceExamples: {[key: string]: WorkspaceData} = {
    identity: {
        code: codes.identity,
        vars: []
    },
    juliaSetStandard: {
        code: codes.juliaSetStandard,
        vars: [ makeSlider("N", 50, 0, 100, 1), makePoint("c", 0.272, 0.575)]
    },
    juliaSetBurningShip1: {
        code: codes.juliaSetBurningShip,
        vars: [ makeSlider("N", 100, 0, 100, 1), makePoint("c", -0.128, -0.847), makeSlider("x", 2.0) ]
    },
    juliaSetBurningShip2: {
        code: codes.juliaSetBurningShip,
        vars: [ makeSlider("N", 100, 0, 100, 1), makePoint("c", -0.371, 0.412), makeSlider("x", -1.46939) ]
    },
    mandelbrotStandard: {
        code: codes.mandelbrotStandard,
        vars: [ makeSlider("N", 100, 0, 100, 1), makeSlider("x", 2.0) ]
    },
}

export const defaultWorkspaceName = "juliaSetBurningShip2";