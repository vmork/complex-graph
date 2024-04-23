class glslShaderError extends Error {
    message: string; shaderType: number; fileName: string;
    constructor(message: string, shaderType: number, fileName: string) {
        super(message);
        this.name = "ShaderError";
        this.shaderType = shaderType;
        this.fileName = fileName;
    }
    toString() {
        let typeStr = this.shaderType == 35633 ? "vertex" : "fragment";
        return `glsl error in ${this.fileName} (${typeStr}):\n${this.message}`
    }
}

// https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth  = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // Check if the canvas is not the same size.
    const needResize = canvas.width  !== displayWidth ||
                       canvas.height !== displayHeight;

    if (needResize) {
        // Make the canvas the same size
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
    }
    return needResize;
}

function bufferFullscreenQuad(gl: WebGL2RenderingContext, attribLocation: number) {
    let buffer = gl.createBuffer();
    let vao = gl.createVertexArray();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(attribLocation);
    
    let data = [-1,-1,  1,-1,  -1,1,  -1,1,  1,-1,  1,1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

    gl.vertexAttribPointer(attribLocation, 2, gl.FLOAT, false, 0, 0);
    return vao;
}

async function getShaderText(url: string) {
    let response = await fetch(url);
    let text = await response.text();
    return text;
}

export { 
    glslShaderError as ShaderError,
    resizeCanvasToDisplaySize, 
    bufferFullscreenQuad,
    getShaderText, 
}
