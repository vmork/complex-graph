import { Color, VariableID } from "./types";
import { v4 as uuidv4 } from "uuid";
import { randomColorRGB } from "./utils";

function circleVertices(x: number, y: number, r: number) {
    let points = [];
    const N = 1000;
    for (let i of Array(N).keys()) {
        let t = (i * 2 * Math.PI) / N;
        points.push(x + r * Math.cos(t));
        points.push(y + r * Math.sin(t));
    }
    points = [...points, points[0], points[1]] // assumes were drawing using gl.LINE_STRIP
    return new Float32Array(points);
}

export class Shape {
    id: VariableID;
    vertices: Float32Array;
    color: Color;

    constructor(color: Color) {
        this.id = uuidv4();
        this.color = color ?? randomColorRGB();
    }

    setVertices() {
        throw new Error("setVertices not implemented");
    }
}

export class Circle extends Shape {
    filled: boolean;
    x: number;
    y: number;
    r: number;

    constructor(x: number, y: number, r: number, color: Color = null, filled: boolean = false) {
        super(color);
        this.x = x;
        this.y = y;
        this.r = r;
        this.filled = filled;
        this.setVertices();
    }

    setVertices() {
        this.vertices = circleVertices(this.x, this.y, this.r);
    }
}

// happens once

// let pointsBuffer = gl.createBuffer();
// let pointsVao = gl.createVertexArray();
// gl.bindVertexArray(pointsVao);
// gl.enableVertexAttribArray(positionLoc);
// gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer)
// gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

// type Shape = { data: Float32Array, col: number[], filled: boolean }

// let shapes: Shape[] = [
//     {data: circleVertices(0, 0, 0.7), col: [0, 0.0, 0.8], filled: true},
//     {data: circleVertices(0.4, 0, 0.7), col: [0, 0.8, 0.0], filled: false},
// ]

// function circleVertices(x: number, y: number, r: number) {
//     let points = []
//     const N = 100
//     for (let i of Array(N).keys()) {
//         let t = i*2*Math.PI/N
//         points.push(x + r*Math.cos(t));
//         points.push(y + r*Math.sin(t))
//     }
//     return new Float32Array(points)
// }

// function drawShape(shape: Shape) {
//     let {data, col, filled} = shape
//     program.setUniformValue("u_col", col); program.bindAllUniforms()
//     let method = gl.LINE_LOOP as number
//     if (filled) {
//         data = new Float32Array([0, 0, ...data, data[0], data[1]])
//         method = gl.TRIANGLE_FAN;
//     }
//     gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
//     gl.drawArrays(gl.POINTS, 0, data.length/2);
// }

// function render() {
//     gl.viewport(0, 0, canvas.width, canvas.height)
//     gl.clearColor(0.42, 0.42, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT);
//     gl.useProgram(program.id);
//     program.setUniformValue("u_col", [1.0, 0.5, 0.5]);
//     program.bindAllUniforms();
//     gl.bindVertexArray(quadVao);
//     gl.drawArrays(gl.TRIANGLES, 0, 6);

//     gl.bindVertexArray(pointsVao);
//     for (let shape of shapes) {
//         drawShape(shape)
//     }
// }
