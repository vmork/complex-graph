<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import { onFocusOut } from "../utils";

    type DropdownItem = { name: string; onClick: () => void };
    export let items: DropdownItem[] = [];
    let open = false;
</script>

<div on:focusout={(e) => onFocusOut(e, () => (open = false))} class="dropdown-container">
    <button on:click={() => (open = !open)}>
        <slot name="trigger" />
    </button>
    {#if open}
        <div class="dropdown-inner" transition:fade={{ duration: 100 }}>
            {#each items as item}
                <button class="dropdown-item" on:click={item.onClick} on:click={() => (open = false)}
                    >{item.name}</button
                >
            {/each}
        </div>
    {/if}
</div>

<style lang="scss">
    .dropdown-container {
        position: relative;
    }
    .dropdown-inner {
        min-width: 100px;
        position: absolute;
        top: 100%;
        left: 0;
        background-color: var(--c-dark);
        border: 1px solid black;
        border-radius: 5px;
        padding: 5px;
        z-index: 100;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .dropdown-item {
        padding: 5px;
        color: white;
        border: none;
        cursor: pointer;
        &:hover {
            background-color: var(--c-dark-grey);
        }
        font-size: 14px;
    }
    button {
        all: unset;
        cursor: pointer;
    }
</style>
