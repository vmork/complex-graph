<script lang="ts">
  import type { Canvas } from "../canvas";
  import type { UserPoint, Point } from "../types";
  import { uvars } from "../stores";
  import { roundToDigits } from "../utils";

  export let canvas: Canvas;
  export let data: UserPoint;

  let pointSizePx = 20;
  let dragging = false;
  let canvasPos = canvas.camera.worldToScreen(data.x, data.y);
  canvasPos = {
    x: canvasPos.x - pointSizePx / 2,
    y: canvasPos.y - pointSizePx / 2,
  };

  function onDrag(e) {
    if (!dragging) return;
    const rect = canvas.c.getBoundingClientRect();
    let [x, y] = [e.clientX - rect.left, e.clientY - rect.top];
    canvasPos = { x: x - pointSizePx / 2, y: y - pointSizePx / 2 };

    let worldPos = canvas.camera.screenToWorld(x, y);
    data.x = worldPos.x;
    data.y = worldPos.y;
    $uvars = $uvars;

    if (data.name.trim()) {
      canvas.setUniformValue(data.name, [data.x, data.y]);
      canvas.render();
    }
  }

  canvas.c.addEventListener("mouseup", (e) => {
    dragging = false;
  });
  canvas.c.addEventListener("mousemove", onDrag);
</script>

<div id="container" style="left: {canvasPos.x}px; top: {canvasPos.y}px;">
  <div
    id="point"
    style="width: {pointSizePx}px; height: {pointSizePx}px; background-color: {data.color};"
    class:dragging
    on:mousedown={() => (dragging = true)}
    on:mouseup={() => {
      dragging = false;
    }}
    on:mousemove|stopPropagation={onDrag}
  ></div>
</div>

<style lang="scss">
  #container {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    gap: 5px;
    user-select: none;
  }
  #point {
    border: 2px solid var(--c-white);
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.1s;
  }
  #point:hover,
  #point.dragging {
    transform: scale(1.2);
  }
  #name-div {
    background-color: green;
    color: var(--c-white);
    padding: 5px;
    height: 30px;
    border-radius: 5px;
  }
</style>
