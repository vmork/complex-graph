export function makeAbsolute(e) {
    e.target.style.position = "absolute";
    e.target.style.width = "100%";
}
export function roundToDigits(x, digits) {
    const m = Math.pow(10, digits);
    return Math.round(x * m) / m;
}
export function randomColorRGB() {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}
export function addLineNums(src) {
    return src.split("\n").map((l, i) => `${i + 1}: ${l}`).join("\n");
}
