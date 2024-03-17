<script lang="ts">
    import ContentCopy from "svelte-material-icons/ContentCopy.svelte"
    import Check from "svelte-material-icons/Check.svelte"
    export let number;
    let copied = false;

    function copy() {
        navigator.clipboard.writeText(number);
        copied = true;
        setTimeout(() => copied = false, 1000);
    }
</script>
<span
    class="number"
    class:copied={copied}
    on:click={copy}
    on:keydown={(e) => { if (e.key !== "Tab") copy() }}
    role="button"
    tabindex="0"
    title="click to copy class number"
    aria-label="click or select to copy class numbe "
>
    #{number}
    {#if copied}
        <Check />
    {:else}
        <ContentCopy />
    {/if}
</span>

<style>
    .number {
        display: inline-flex;
        gap: 10px;
        align-items: center;
        user-select: none;
        cursor: pointer;
    }
    .number:focus {
        outline: none;
    }
    .copied {
        position: relative;
        color: var(--success);
        animation: copy 1s ease-in-out;
        outline: none;
    }

    @keyframes copy {
        50% {
            color: var(--success);
        }
        100% {
            color: #999;
        }
    }
</style>