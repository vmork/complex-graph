<script context="module" lang="ts">
    export type Tab = { name: string, id: number }
</script>

<script lang="ts">
    export let tabs: Tab[];
    export let activeTab: Tab;
</script>

<div id="navbar">
    {#each tabs as tab}
        <button 
            class="tab" class:active={tab.id == activeTab.id}
            on:click={() => activeTab = tab}>
            {tab.name}
        </button>
    {/each}
</div>

<style lang="scss">
    #navbar {
        overflow: hidden;
        height: 45px;
        display: flex;
        justify-content: space-around;
        margin-right: 45px;
    }
    .tab {
        flex-basis: 100%;
        border-radius: 1px;
        border-bottom: 3px solid var(--c-dark-grey);
        transition: border-bottom 0.3s;
        transition: background-color 0.3s;
    }
    .active {
        background-color: var(--c-dark-grey);
        border-bottom: 3px solid var(--c-primary);
    }
</style>