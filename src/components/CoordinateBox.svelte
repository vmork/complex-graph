<script lang="ts">
    import type { Point } from "../types";

    export let mouse: Point;
    export let fval: Point;

    function formatPoint(p: Point): string {
        if (p.y < 0) return `${formatNum(p.x)} - ${formatNum(-p.y)}i`;
        else         return `${formatNum(p.x)} + ${formatNum(p.y)}i`;
    }

    function formatNum(x: number): string {
        if (Math.abs(x) < 0.001 || Math.abs(x) >= 1000) {
            return x.toExponential(3);
        } else {
            return x.toFixed(3);
        }
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
        right: 0;
        padding: 10px;
        background-color: rgba(255, 255, 255, 0.852);
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);

        p {
            margin: 0;
        }
    }
</style>