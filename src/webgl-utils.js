var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class ShaderError extends Error {
    constructor(message, shaderType, fileName) {
        super(message);
        this.name = "ShaderError";
        this.shaderType = shaderType;
        this.fileName = fileName;
    }
}
// https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
function resizeCanvasToDisplaySize(canvas) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    // Check if the canvas is not the same size.
    const needResize = canvas.width !== displayWidth ||
        canvas.height !== displayHeight;
    if (needResize) {
        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
    return needResize;
}
function bufferFullscreenQuad(gl, attribLocation) {
    let buffer = gl.createBuffer();
    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(attribLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    let data = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attribLocation, 2, gl.FLOAT, false, 0, 0);
}
function getShaderText(url) {
    return __awaiter(this, void 0, void 0, function* () {
        let response = yield fetch(url);
        let text = yield response.text();
        return text;
    });
}
export { ShaderError, resizeCanvasToDisplaySize, bufferFullscreenQuad, getShaderText, };
