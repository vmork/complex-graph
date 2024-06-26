export function makeAbsolute(e) {
    e.target.style.position = "absolute";
    e.target.style.width = "100%";
}

export function onFocusOut({ currentTarget, relatedTarget }: FocusEvent, callback: () => void) {
    if (
        relatedTarget instanceof HTMLElement &&
        currentTarget instanceof HTMLElement &&
        currentTarget.contains(relatedTarget)
    )
        return;
    callback();
}

export function roundToDigits(x: number, digits: number) {
    const m = Math.pow(10, digits);
    return Math.round(x * m) / m;
}

export function rectToPolar(x: number, y: number) {
    return { r: Math.sqrt(x * x + y * y), theta: Math.atan2(y, x) };
}

export function randomColorRGB() {
    return `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padEnd(6, "0")}`;
}

export function RGBStringToVec3(s: string) {
    return s
        .substring(1)
        .match(/.{2}/g)
        .map((x) => parseInt(x, 16) / 255);
}

export function addLineNums(src: string) {
    return src
        .split("\n")
        .map((l, i) => `${i + 1}: ${l}`)
        .join("\n");
}

export function cloneMap<T, S>(m: Map<T, S>): Map<T, S> {
    return new Map(JSON.parse(JSON.stringify(Object.entries(Object.fromEntries(m.entries())))));
}
