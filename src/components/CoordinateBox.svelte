<script lang="ts">
  import { Canvas } from "../canvas";
  import type { Point } from "../types";
  import { rectToPolar } from "../utils";

  export let mouse: Point;
  export let fval: Point;
  export let canvas: Canvas;

  function formatPoint(p: Point): string {
    if (canvas.getSetting("polarCoords")) {
      let { r, theta } = rectToPolar(p.x, p.y);
      return `${formatNum(r)} ∠ ${formatNum(theta / Math.PI)} π`;
    } else {
      if (p.y < 0) return `${formatNum(p.x)} - ${formatNum(-p.y)}i`;
      else return `${formatNum(p.x)} + ${formatNum(p.y)}i`;
    }
  }

  function formatNum(x: number): string {
    if (Math.abs(x) < 0.001 || Math.abs(x) >= 1000) return x.toExponential(3);
    else return x.toFixed(3);
  }
</script>

<div id="coordinate-box">
  <p>&nbsp&nbsp z = {formatPoint(mouse)}</p>
  <p>f(z) = {formatPoint(fval)}</p>
</div>

<style lang="scss">
  #coordinate-box {
    border: 1px solid var(--c-light-grey);
    border-left: none;
    border-bottom: none;
    position: absolute;
    bottom: 0;
    left: 0;
    padding: 10px;
    background-color: var(--c-dark-grey);
    color: var(--c-light-grey);
    box-shadow: 0 10px 10px var(--c-dark-grey);
    font-size: 14px;

    p {
      margin: 0;
    }
  }
</style>
