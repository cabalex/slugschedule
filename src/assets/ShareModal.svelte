<script lang="ts">
    import QrCode from "svelte-qrcode"
    import { fade } from "svelte/transition";

    import Close from "svelte-material-icons/Close.svelte";
    import ContentCopy from "svelte-material-icons/ContentCopy.svelte";
    import TrayArrowUp from "svelte-material-icons/TrayArrowUp.svelte";

    export let url = "https://example.com";
    export let headerText = "Share this URL";
    export let onClose = () => {};

    function copy(e) {
        navigator.clipboard.writeText(url);
        
        e.target.style.outline = "1px solid var(--success)";

        setTimeout(() => {
            e.target.style.outline = "";
        }, 1000);
    }
</script>


<div class="modal" transition:fade={{duration: 100}} on:click={onClose}>
    <div class="modalInner" on:click={(e) => e.stopPropagation()}>
        <h2>{headerText}</h2>
        <button class="roundBtn closeBtn" on:click={onClose}>
            <Close size="1em" />
        </button>
        <div class="body">
            <div class="qrContainer">
                <QrCode value={url} />
            </div>
            <div class="text">
                <button on:click={copy}>
                    <ContentCopy size="1.25em" />
                    Copy link
                </button>
                <button on:click={() => navigator.share({url})}>
                    <TrayArrowUp size="1.25em" />
                    Share via...
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;

        display: flex;
        justify-content: center;
        align-items: center;

        background-color: rgba(0, 0, 0, 0.5);
        z-index: 100;
    }
    .modalInner {
        max-width: 800px;
        max-height: 90%;
        overflow: auto;

        background-color: #333;
        border-radius: 10px;
        padding: 10px;
        position: relative;
    }
    .closeBtn {
        position: absolute;
        top: 10px;
        right: 10px;
    }
    .body {
        display: flex;
        justify-content: stretch;
        align-items: stretch;
        gap: 10px;
    }
    h2 {
        text-align: center;
    }
    .qrContainer {
        border-radius: 10px;
        padding: 10px;
        overflow: hidden;
        background-color: white;

        display: flex;
        justify-content: center;
        align-items: center;
    }
    .text {
        aspect-ratio: 1 / 1;
        width: 196px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 10px;
        border-radius: 10px;
        gap: 10px;
        border: 2px solid #555;
    }
    button {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: 10px;
    }
    @media screen and (max-width: 500px) {
        .body {
            flex-direction: column;
        }
        .closeBtn {
            display: none;
        }
    }
</style>