var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as utils from "./webgl-utils";
class Uniform {
    constructor(name, type, value = null, location = null) {
        this.name = name;
        this.type = type;
        this.value = value;
        this.loc = location;
    }
}
// looks for #include directives and replaces them with content from file  
function insertIncludes(src) {
    return __awaiter(this, void 0, void 0, function* () {
        let lines = src.split("\n");
        let output = "";
        for (let line of lines) {
            output += line + "\n";
            if (line.trim().startsWith("//#include")) {
                let filename = line.split(" ")[1];
                let includedSrc = yield utils.getShaderText(`shaders/${filename}`);
                output += includedSrc + "\n";
            }
        }
        return output;
    });
}
function insert(src, keyword, replacement) {
    let re = new RegExp(`//#${keyword}`);
    return src.replace(re, `//#${keyword}\n${replacement}`);
}
function insertUserFunction(src, userFunction) {
    return insert(src, "UFUNC", userFunction);
}
function insertUniforms(src, uniforms) {
    let uniformsStr = "";
    for (let u of uniforms) {
        uniformsStr += `uniform ${u.type} ${u.name};\n`;
    }
    return insert(src, "UNIFORMS", uniformsStr);
}
class ProgramManager {
    constructor(gl, uniforms) {
        this.gl = gl;
        this.id = gl.createProgram();
        this.uniforms = new Map();
        this.addUniforms(uniforms);
    }
    compileShader(type, source, url) {
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
    compileFromUrls(vertUrl, fragUrl, userFunction) {
        return __awaiter(this, void 0, void 0, function* () {
            this.vertUrl = vertUrl;
            this.fragUrl = fragUrl;
            let vertSrc = yield utils.getShaderText(vertUrl);
            let fragSrc = yield utils.getShaderText(fragUrl);
            fragSrc = yield insertIncludes(fragSrc);
            this.vertSrcRaw = vertSrc;
            this.fragSrcRaw = fragSrc;
            return this.compile(vertSrc, fragSrc, userFunction);
        });
    }
    compile(vertSrc, fragSrc, userFunction) {
        const gl = this.gl;
        fragSrc = insertUserFunction(fragSrc, userFunction);
        fragSrc = insertUniforms(fragSrc, this.uniforms.values());
        // console.log(addLineNums(fragSrc));
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
        this.vertShader = vertShader;
        this.fragShader = fragShader;
        return this.id;
    }
    recompile(userFunction) {
        const gl = this.gl;
        if (this.isCompiled) {
            gl.detachShader(this.id, this.vertShader);
            gl.deleteShader(this.vertShader);
            gl.detachShader(this.id, this.fragShader);
            gl.deleteShader(this.fragShader);
        }
        this.compile(this.vertSrcRaw, this.fragSrcRaw, userFunction);
    }
    addUniforms(uniforms) {
        for (let u of uniforms) {
            this.addUniform(u);
        }
    }
    addUniform(u) {
        if (this.uniforms.has(u.name)) {
            console.error(`Uniform ${u.name} already exists in program`);
            return;
        }
        this.uniforms.set(u.name, u);
    }
    deleteUniform(name) {
        this.uniforms.delete(name);
    }
    setUniformValue(name, value) {
        this.uniforms.get(name).value = value;
    }
    getUniformValue(name) {
        return this.uniforms.get(name).value;
    }
    logUniforms() {
        console.table(Array.from(this.uniforms.values()).map(u => [u.name, u.value]));
    }
    setUniformLocations() {
        for (let u of this.uniforms.values()) {
            u.loc = this.gl.getUniformLocation(this.id, u.name);
        }
    }
    bindAllUniforms() {
        const gl = this.gl;
        for (let u of this.uniforms.values()) {
            if (u.type === "float")
                gl.uniform1f(u.loc, u.value);
            else if (u.type === "vec2")
                gl.uniform2fv(u.loc, u.value);
            else if (u.type === "int")
                gl.uniform1i(u.loc, u.value);
            else if (u.type === "mat2")
                gl.uniformMatrix2fv(u.loc, false, u.value);
            else if (u.type === "mat3")
                gl.uniformMatrix3fv(u.loc, false, u.value);
            else if (u.type === "bool")
                gl.uniform1i(u.loc, u.value);
            else
                console.error("Unsupported uniform type: " + u.type);
        }
    }
}
export { ProgramManager, Uniform };
