<script lang="ts">
    import type { Point } from "../types";

    export let mouse: Point;
    export let fval: Point;

    function formatPoint(p: Point): string {
        if (p.y < 0) return `${formatNum(p.x)} - ${formatNum(-p.y)}i`;
        else         return `${formatNum(p.x)} + ${formatNum(p.y)}i`;
    }

    function formatNum(x: number): string {
        if (Math.abs(x) < 0.001 || Math.abs(x) >= 1000)  return x.toExponential(3);
        else return x.toFixed(3);
    }
</script>

<div id="coordinate-box">
    <p> &nbsp&nbsp z = {formatPoint(mouse)} </p>
    <p> f(z) = {formatPoint(fval)} </p>
</div>

<style lang="scss">
    #coordinate-box {
        position: absolute;
        bottom: 0;
        left: 0;
        padding: 10px;
        background-color: var(--c-dark-grey);
        color: var(--c-light-grey);
        border-radius: 5px;
        box-shadow: 0 0 2px var(--c-dark-grey);

        p {
            margin: 0;
        }
    }
</style>