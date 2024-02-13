enum Test {
    A, B, C
}

let node = {
    type: Test.A
}
let notNode = {
    type: "A"
}

for (let v of Object.values(Test).filter(x => typeof x === "string")) {
    // console.log(v, typeof v, typeof notNode.type, notNode.type === v)
    console.log(v === notNode.type)
}