export type Point = { x: number, y: number };

export type VariableID = string;

export type VariableType = "float" | "vec2";

export type Color = string;

export type UserSlider = {
    id: VariableID,
    type: "float",
    name: string,
    value: number,
    min: number,
    max: number,
    step: number
}

export type UserPoint = {
    id: VariableID,
    type: "vec2",
    name: string,
    x: number,
    y: number,
    color: Color
}

export type UserVariable = UserSlider | UserPoint;