<script lang="ts">
    import { shaderError } from "../stores";
    import type { Canvas } from "../canvas";

    export let canvas: Canvas;  
    export let text = "";

    let preElem: HTMLPreElement;

    function handleInput(e) {
        text = (e.target as HTMLPreElement).innerText;
        canvas.updateUserFunction(text);
        if ($shaderError) {
            console.error($shaderError.message)
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Tab") {
            e.preventDefault();
            // let start = preElem.selectionStart;
            // let end = preElem.selectionEnd;
            // text = text.substring(0, start) + "    " + text.substring(end);
            // preElem.selectionStart = preElem.selectionEnd = start + 4;
        }
    }
</script>

<pre class:error={$shaderError} 
    id="editor" contenteditable="true" 
    bind:this={preElem}
    on:input={handleInput} on:keydown={handleKeyDown}>{text}
</pre>

{#if $shaderError}
    <div id="error-div">
        <p>{$shaderError.message}</p>
    </div>
{/if}

<style lang="scss">
    :root { --c-red: rgb(121, 53, 53); }
    #editor {
        font-size: 1.2em;
        width: 100%;
        color: var(--c-white);
        background-color: var(--c-dark-grey);
        max-height: 200px;
        border: 1px solid var(--c-light-grey);
        padding: 10px;
        outline: none;
        margin: 5px 0 10px 0;
        overflow-y: scroll;
        white-space: pre;
        display: inline-block;
        &::-webkit-scrollbar {
            display: none;
        }
        &:focus {
            border: 1px solid var(--c-primary);
        }
        &.error {
            border: 1px solid var(--c-red);
        }
    }
    #error-div {
        width: 100%;
        background-color: var(--c-red);
        color: var(--c-white);
        padding: 5px;
        display: inline-block;
        margin-bottom: 10px;
        translate: 0 -10px;
        border: 1px solid var(--c-red);
        p {
            margin: 0;
        }
    }
</style>