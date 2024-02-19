import * as ast from './ast-nodes'
import { DT as DT } from './types'
import { Token, TT } from './token'

function isNode(x: any) {
    return  (x !== null && typeof x === 'object' && 'nodeType' in x);
}
function expandTypes(x: any) {
    if (isNode(x)) {
        x.nodeType = ast.NT[x.nodeType]
        for (let [k, v] of Object.entries(x)) {
            let v2 = expandTypes(v);
            x[k] = v2;
            if (k === "dataType") x[k] = DT[v as number];
        }
        return x;
    }
    else if (x instanceof Array) return x.map(expandTypes)
    else if (x instanceof Token) return TT[x.type]
    else return x;
}
function treeAsJson(tree: ast.Node) {
    const copy = JSON.parse(JSON.stringify(tree));
    return JSON.stringify(expandTypes(copy), null, 4);
}

function allCombinations<T>(values: T[], n: number): T[][] {
    if (n === 0) return [[]];
    return values.flatMap(v => allCombinations(values, n-1).map(c => [v].concat(c)));
}

function arrayEqual<T>(a: T[], b: T[]) {
    if (a.length !== b.length) return false;
    return JSON.stringify(a) == JSON.stringify(b);
}

export { treeAsJson, allCombinations, arrayEqual }