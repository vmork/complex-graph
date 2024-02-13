export type Point = { x: number, y: number };

export type VariableID = string;

export type VariableType = "slider" | "point";

export type Color = string;

export type UserSlider = {
    id: VariableID,
    type: "slider",
    name: string,
    value: number,
    min: number,
    max: number,
    step: number
}

export type UserPoint = {
    id: VariableID,
    type: "point",
    name: string,
    x: number,
    y: number,
    color: Color
}

export type UserVariable = UserSlider | UserPoint;