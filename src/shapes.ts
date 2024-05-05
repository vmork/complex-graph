import { Color, VariableID } from "./types";
import { v4 as uuidv4 } from "uuid";
import { randomColorRGB } from "./utils";
import { ProgramManager } from "./webgl-program";

function circleVertices(x: number, y: number, r: number, N: number) {
  let points = new Array(N);
  for (let i = 0; i < N; i++) {
    let t = (i * 2 * Math.PI) / N;
    points.push(x + r * Math.cos(t), y + r * Math.sin(t));
  }
  // assume were drawing using gl.LINE_STRIP, so need to join last segment
  points.push(points[0], points[1]);
  return new Float32Array(points);
}

function diskVertices(x: number, y: number, r: number, N: number) {
  // note: will generate less than N vertices
  let points = [];
  for (let i = 0; i < N; i++) {
    const pointX = x + 2 * r * (Math.random() - 0.5);
    const pointY = y + 2 * r * (Math.random() - 0.5);
    const d2 = Math.pow(pointX - x, 2) + Math.pow(pointY - y, 2);
    if (d2 < r * r) {
      points.push(pointX, pointY);
    }
  }
  return new Float32Array(points);
}

type LineStyle = "lines" | "points" | "filled";

export abstract class Shape {
  public readonly id: VariableID = uuidv4();
  vertices: Float32Array;
  constructor(
    public color: Color = randomColorRGB(),
    public numVerts: number = 5000,
    public lineStyle: LineStyle = "lines",
    public thickness: number = 3
  ) {}

  abstract setVertices(): void
}

export class Circle extends Shape {
  constructor(
    public x: number,
    public y: number,
    public r: number,
    color: Color = undefined,
    numVerts = undefined,
    lineStyle: LineStyle = "lines",
    thickness: number = undefined
  ) {
    super(color, numVerts, lineStyle, thickness);
    this.setVertices();
  }

  setVertices() {
    if (this.lineStyle === "filled") this.vertices = diskVertices(this.x, this.y, this.r, this.numVerts);
    else this.vertices = circleVertices(this.x, this.y, this.r, this.numVerts);
  }
}

export class ParametricShape extends Shape {
  constructor(
    public program: ProgramManager,
    color: Color = undefined,
    numVerts = undefined,
    thickness: number = undefined
  ) {
    super(color, numVerts, "lines", thickness);
    this.setVertices();
  }
  setVertices() {
      // this.vertices = 
  }
}
