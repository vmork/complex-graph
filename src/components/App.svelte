<script lang="ts">
	import { onMount } from "svelte";
	import { Canvas } from "../canvas";
	import type { Point } from "../types";
    import CoordinateBox from "./CoordinateBox.svelte";
    import Sidebar from "./Sidebar.svelte";
	import { getShaderText } from "../webgl-utils";

	import Split from "split.js";

	let canvas: Canvas;
	let canvasIsReady: boolean = false;
	let mousePos: Point = {x: 0, y: 0};

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
			gutterSize: 0,
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

		canvasElem.addEventListener("mousemove", (e) => {
			let [x, y] = canvas.camera.screenToWorld(e.offsetX, e.offsetY);
			mousePos = {x, y};
		})
		document.addEventListener("keydown", (e) => {
			if (e.key == "h") {
				canvas.camera.reset();
				canvas.render();
			}
		})
	})

</script>

<main>
	<div id="sidebar-div" 
		bind:this={sidebarDiv} 
		style:display={sidebarCollapsed ? "none": "block"}>
		
		{#if canvasIsReady}
			<Sidebar canvas={canvas} bind:collapsed={sidebarCollapsed}/>
		{/if}
	</div>
	{#if sidebarCollapsed}
		<button id="expand-btn" on:click={() => sidebarCollapsed = false}>
			<i class="bi bi-chevron-double-right"></i>
		</button>
	{/if}

	<div id="canvas-div" bind:this={canvasDiv}>
		<canvas bind:this={canvasElem} width=1 height=1></canvas>
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
	}
	#sidebar-div {
		height: 100%;
		background-color: rgb(43, 43, 91);
	}
	#canvas-div {
		flex-grow: 1;
		height: 100%;
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
		background-color: transparent;
		&:hover {
			cursor: col-resize;
		}
		&::after {
			content: " ";
			height: 100%;
			position: absolute;
			width: 5px;
			background-color: var(--c-dark-grey);
			box-shadow: 3px 0 10px rgb(0,0,0,0.2);
		}
	}
</style>
