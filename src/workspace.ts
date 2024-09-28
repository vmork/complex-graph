import { UserPoint, UserSlider, UserVariable } from "./types";
import { v4 as uuidv4 } from "uuid";
import { randomColorRGB } from "./utils";
import { Circle, Shape } from "./shapes";

function makeSlider(name: string, value: number, min = -10, max = 10, step = 0.001): UserSlider {
  return { id: uuidv4(), type: "float", name, value, min, max, step };
}
function makePoint(name: string, x = 0, y = 0, color = randomColorRGB()): UserPoint {
  return { id: uuidv4(), type: "vec2", name, x, y, color };
}
function makeWsData(
  code: string,
  vars: UserVariable[],
  shapes: Shape[],
  coloringFunc: string = coloringFuncs.domainColoring
): WorkspaceData {
  return { code, vars, shapes, coloringFunc };
}

export const codes = {
  identity: `
f(z) := z`,

  exp: `
f(z) := e^z`,

  juliaSetStandard: `
g(z) := z^2 + c

f(z) := 
  for j = 1..N: z = g(z)
  return z`,

  juliaSetBurningShip: `
g(z) := (abs(re(z)) + i abs(im(z)))^x + c

f(z) := 
  for j = 1..N: z = g(z)
  return z`,

  mandelbrotStandard: `
g(z, c) := z^x + c

f(c) := 
  w := 0 + 0i
  for j = 1..N: 
    if abs(w) > 2: break
    w = g(w, c)
  return w`,
} as const;
type CodeName = keyof typeof codes;

export const coloringFuncs = {
  constant: `col(z) :=
  return color(1, 0, 0)`,
  domainColoring: `col(z) :=
  t := arg(z) / (2 pi) + 0.5
  a := color(0.4)
  b := color(0.5)
  c := color(1.0,1.0,0.75)
  d := color(0.8, 0.9, 0.3)
  return a + b*cos(2*pi*(c*t+d))`,
  
  magnitude: `col(z) :=
  t := min(1, abs(z) / 10)
  c := color(1, 0, 0)
  return c * t`,
} as const;
export type ColoringFuncName = keyof typeof coloringFuncs;

export type WorkspaceData = {
  code: string;
  vars: UserVariable[];
  shapes?: Shape[];
  coloringFunc?: string;
};

export const workspaceExamples = {
  identity: makeWsData(codes.identity, [], [new Circle(0, 0, 1)]),
  exp: makeWsData(codes.exp, [], [new Circle(0, 0, 1)]),
  juliaSetStandard: makeWsData(codes.juliaSetStandard, [makeSlider("N", 50, 0, 100, 1), makePoint("c", 0.272, 0.575)], []),
  juliaSetBurningShip1: makeWsData(codes.juliaSetBurningShip, [
    makeSlider("N", 100, 0, 100, 1),
    makePoint("c", -0.128, -0.847),
    makeSlider("x", 2.0),
  ], []),
  juliaSetBurningShip2: makeWsData(codes.juliaSetBurningShip, [
    makeSlider("N", 100, 0, 100, 1),
    makePoint("c", -0.371, 0.412),
    makeSlider("x", -1.46939),
  ], []),
  mandelbrotStandard: makeWsData(codes.mandelbrotStandard, [makeSlider("N", 100, 0, 100, 1), makeSlider("x", 2.0)], []),

  // test: makeWsData(codes.identity, [], []),
};
export type WorkspaceName = keyof typeof workspaceExamples;

export const defaultWorkspaceName = "juliaSetBurningShip2";
export const defaultWorkspace = workspaceExamples[defaultWorkspaceName];
export const defaultColoringFunc = "domainColoring";
