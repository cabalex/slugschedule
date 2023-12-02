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
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<span class="number" class:copied={copied} on:click={copy}>
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
    .copied {
        position: relative;
        color: var(--success);
        animation: copy 1s ease-in-out;
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