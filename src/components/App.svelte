<script lang="ts">
	import { onMount } from "svelte";
	import { Canvas } from "../canvas";
	import type { Point } from "../types";
    import CoordinateBox from "./CoordinateBox.svelte";
    import Sidebar from "./Sidebar.svelte";
	import { getShaderText } from "../webgl-utils";
	import { uvars } from "../stores";
	import { resizeCanvasToDisplaySize } from "../webgl-utils";

	import Split from "split.js";
    import DraggablePoint from "./DraggablePoint.svelte";

	let canvas: Canvas;
	let canvasIsReady: boolean = false;
	let mousePos: Point = {x: 0, y: 0};
	let cameraChange = false;
	let pointChange = false;
	let draggingCanvas = false;
	let sidebarCollapsed: boolean = false;
	let sidebarDiv: HTMLDivElement;
	let canvasDiv: HTMLDivElement;
	let canvasElem: HTMLCanvasElement;
	let gutterElem: HTMLDivElement;
	let split: Split.Instance;
	let lastSplitSizes: number[] = [40, 60];

	$: if (split) {
		if (sidebarCollapsed) gutterElem.style.display = "none";
		else gutterElem.style.display = "block";
	}

	onMount(async () => {
		console.log("App.svelte ran");

		split = Split(["#sidebar-div", "#canvas-div"], {
			sizes: lastSplitSizes,
			minSize: [250, 250],
			gutterSize: 5,
			gutterAlign: "start",
			onDragEnd: () => {
				lastSplitSizes = split.getSizes();
			}
		});
		gutterElem = document.querySelector(".gutter");

		let defaultUserFunction = await getShaderText("shaders/default-func.glsl");	
		console.log(defaultUserFunction)

		canvas = new Canvas(canvasElem, defaultUserFunction);
		await canvas.init((s) => console.error(s));
		canvasIsReady = true;

		canvasElem.addEventListener("mousedown", (e) => draggingCanvas = true)
		canvasElem.addEventListener("mouseup", (e) => draggingCanvas = false)
		canvasElem.addEventListener("mouseleave", (e) => draggingCanvas = false) // prevent jank when dragging onto point

		canvasElem.addEventListener("mousemove", (e) => {
			if (draggingCanvas) canvas.camera.move(e.movementX, e.movementY);
			mousePos = canvas.camera.screenToWorld(e.offsetX, e.offsetY);
			canvas.mousePos = mousePos;
		})
		canvasDiv.addEventListener('wheel', (e) => {
			e.preventDefault();
			const rect = canvasElem.getBoundingClientRect();
			const [x, y] = [e.clientX - rect.left, e.clientY - rect.top];
			canvas.camera.scaleAt(x, y, Math.pow(1.001, e.deltaY));
		}); 
		canvasElem.addEventListener("camera", (e) => {
			cameraChange = !cameraChange; // trigger reactivity
			canvas.render();
		})
		document.addEventListener("keydown", (e) => {
			if (e.key == "h") {
				canvas.camera.reset();
				canvas.render();
			}
		})        
		let resizeObserver = new ResizeObserver(() => {
			resizeCanvasToDisplaySize(canvasElem);
			canvas.camera.scale.x = canvas.camera.scale.y * canvas.camera.aspect();
			cameraChange = !cameraChange;
			canvas.render();
		})
		resizeObserver.observe(canvasElem);
	})

</script>

<main>
	<div id="sidebar-div" 
		bind:this={sidebarDiv} 
		style:display={sidebarCollapsed ? "none": "block"}>
		
		{#if canvasIsReady}
			<Sidebar canvas={canvas} bind:collapsed={sidebarCollapsed}
			on:variableChange={(e) => {if (e.detail.type === "point") pointChange = !pointChange}}/>
		{/if}
	</div>

	
	<div id="canvas-div" bind:this={canvasDiv}>
		{#if sidebarCollapsed}
			<button id="expand-btn" on:click={() => sidebarCollapsed = false}>
				<i class="bi bi-chevron-double-right"></i>
			</button>
		{/if}

		<canvas bind:this={canvasElem}></canvas>

		{#if canvasIsReady}
		{#key [cameraChange, pointChange]}
		{#each $uvars as v (v.id)}
			{#if v.type === "point"}
				<DraggablePoint canvas={canvas} data={v}/>
			{/if}
		{/each}
		{/key}
		{/if}
	</div>

	{#if canvasIsReady}
		<CoordinateBox mouse={mousePos} fval={canvas.computeFval(mousePos)}/>
	{/if}
</main>

<style lang="scss">
	main {
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: row;
		overflow: hidden;
		position: relative;
	}
	#sidebar-div {
		height: 100%;
		background-color: rgb(43, 43, 91);
	}
	#canvas-div {
		flex-grow: 1;
		height: 100%;
		position: relative;
		overflow: hidden;
	}
	canvas {
		box-sizing: border-box;
		height: 100%;
		width: 100%;
		display: block;
	}
	:global(button) {
        border: none;
        background-color: transparent;
        transition: background-color 0.3s, color 0.3s;
        border-radius: 5px;
        &:hover {
            color: var(--c-white);
            cursor: pointer;
            background-color: var(--c-dark-grey);
        }
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 8px;
        color: inherit;
    }
	#expand-btn {
		color: var(--c-light-grey);
		position: absolute;
		top: 5px;
		left: 5px;
	}
	i {
        font-size: 1.5em;
        color: inherit;
    }
	:global(.gutter) {
		background-color: var(--c-dark-grey);
		box-shadow: 3px 0 10px rgb(0,0,0,0.2);
		&:hover {
			cursor: col-resize;
		}
	}
</style>
