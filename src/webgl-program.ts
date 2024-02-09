import * as utils from "./webgl-utils";

type UniformType = "float" | "vec2" | "mat2" | "mat3" | "int" | "bool";
type UniformValue = number | number[];

class Uniform {
    name: string; 
    type: UniformType;
    value: any;
    loc: WebGLUniformLocation;

    constructor(name: string, type: UniformType, value: UniformValue=null, location: WebGLUniformLocation=null) {
        this.name = name; this.type = type; this.value = value; this.loc = location;
    }
}

// looks for #include directives and replaces them with content from file  
async function insertIncludes(src: string) {
    let lines = src.split("\n");
    let output = "";
    for (let line of lines) {
        output += line + "\n";
        if (line.trim().startsWith("//#include")) {
            let filename = line.split(" ")[1];
            let includedSrc = await utils.getShaderText(`shaders/${filename}`)
            output += includedSrc + "\n";
        }
    }
    return output;
}

function insert(src: string, keyword: string, replacement: string) {
    let re = new RegExp(`//#${keyword}`);
    return src.replace(re, `//#${keyword}\n${replacement}`);
}

function insertUserFunction(src: string, userFunction: string) {
    return insert(src, "UFUNC", userFunction);
}

function insertUniforms(src: string, uniforms: Iterable<Uniform>) {
    let uniformsStr = "";
    for (let u of uniforms) {
        uniformsStr += `uniform ${u.type} ${u.name};\n`;
    }
    return insert(src, "UNIFORMS", uniformsStr);
}

class ProgramManager {
    gl: WebGL2RenderingContext;
    vertShader: WebGLShader;
    fragShader: WebGLShader;
    vertSrcRaw: string; vertUrl: string;
    fragSrcRaw: string; fragUrl: string;
    uniforms: Map<string, Uniform>;
    id: WebGLProgram;
    isCompiled: boolean;

    constructor(gl: WebGL2RenderingContext, uniforms: Iterable<Uniform>) {
        this.gl = gl;
        this.id = gl.createProgram();
        this.uniforms = new Map();
        this.addUniforms(uniforms);
    }

    compileShader(type: number, source: string, url: string) {
        const gl = this.gl; 
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            let error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            this.isCompiled = false;
            throw new utils.ShaderError(error, type, url);
        }
        return shader;
    }    

    async compileFromUrls(vertUrl: string, fragUrl: string, userFunction: string) {
        this.vertUrl = vertUrl; this.fragUrl = fragUrl;
        let vertSrc = await utils.getShaderText(vertUrl);
        let fragSrc = await utils.getShaderText(fragUrl);  
        fragSrc = await insertIncludes(fragSrc)
        this.vertSrcRaw = vertSrc; this.fragSrcRaw = fragSrc;
        return this.compile(vertSrc, fragSrc, userFunction);
    }

    private compile(vertSrc: string, fragSrc: string, userFunction: string) {
        const gl = this.gl;

        fragSrc = insertUserFunction(fragSrc, userFunction);
        fragSrc = insertUniforms(fragSrc, this.uniforms.values());

        this.isCompiled = true;
        const vertShader = this.compileShader(gl.VERTEX_SHADER, vertSrc, this.vertUrl);
        const fragShader = this.compileShader(gl.FRAGMENT_SHADER, fragSrc, this.fragUrl);

        gl.attachShader(this.id, vertShader);
        gl.attachShader(this.id, fragShader);
        gl.linkProgram(this.id);
        if (!gl.getProgramParameter(this.id, gl.LINK_STATUS)) {
            console.error("Error in creating program: ", gl.getProgramInfoLog(this.id));
            gl.deleteProgram(this.id);
            return;
        }
        this.setUniformLocations();

        this.vertShader = vertShader; this.fragShader = fragShader;
        return this.id;
    }

    recompile(userFunction: string) {
        const gl = this.gl;
        if (this.isCompiled) {
            gl.detachShader(this.id, this.vertShader);  gl.deleteShader(this.vertShader);
            gl.detachShader(this.id, this.fragShader);  gl.deleteShader(this.fragShader);
        }
        this.compile(this.vertSrcRaw, this.fragSrcRaw, userFunction);
    }

    addUniforms(uniforms: Iterable<Uniform>) {
        for (let u of uniforms) {
            this.addUniform(u);
        }
    }
    addUniform(u: Uniform) {
        if (this.uniforms.has(u.name)) {
            console.error(`Uniform ${u.name} already exists in program`);
            return;
        }
        this.uniforms.set(u.name, u);
    }
    deleteUniform(name: string) {
        this.uniforms.delete(name);
    }
    setUniformValue(name: string, value: any) {
        this.uniforms.get(name).value = value;
    }
    getUniformValue(name: string) {
        return this.uniforms.get(name).value
    }
    logUniforms() {
        console.table(Array.from(this.uniforms.values()).map(u => [u.name, u.value]))
    }

    private setUniformLocations() {
        for (let u of this.uniforms.values()) {
            u.loc = this.gl.getUniformLocation(this.id, u.name);
        }
    }

    bindAllUniforms() {
        const gl = this.gl;
        for (let u of this.uniforms.values()) {
            if     (u.type === "float") gl.uniform1f(u.loc, u.value);
            else if (u.type === "vec2") gl.uniform2fv(u.loc, u.value);
            else if (u.type === "int")  gl.uniform1i(u.loc, u.value);
            else if (u.type === "mat2") gl.uniformMatrix2fv(u.loc, false, u.value);
            else if (u.type === "mat3") gl.uniformMatrix3fv(u.loc, false, u.value);
            else if (u.type === "bool") gl.uniform1i(u.loc, u.value); 
            else console.error("Unsupported uniform type: " + u.type);
        }
    }
}

export {
    ProgramManager, Uniform, type UniformType, type UniformValue
}