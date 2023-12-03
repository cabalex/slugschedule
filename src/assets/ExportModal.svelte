<script lang="ts">
    import QrCode from "svelte-qrcode"
    import { fade } from "svelte/transition";

    //import * as ics from 'ics'
    import { createEvent,  type DateArray, type DurationObject, type EventAttributes} from "ics"


    import Close from "svelte-material-icons/Close.svelte";
    import ContentCopy from "svelte-material-icons/ContentCopy.svelte";
    import TrayArrowUp from "svelte-material-icons/TrayArrowUp.svelte";

    import { db, scheduledClasses } from "../mainStore";
    import { onDestroy, onMount } from "svelte";

    export let url = "https://example.com";
    export let headerText = "Share this URL";
    export let onClose = () => {};

    let d_url: string;
    export const filename = 'schedule.ics';
    let URLfromFile = (value: File) => { d_url = URL.createObjectURL(value); return d_url };

    function copy(e) {
        navigator.clipboard.writeText(url);
        
        e.target.style.outline = "1px solid var(--success)";
        setTimeout(() => {
            e.target.style.outline = "";
        }, 1000);
    }
    let startTime: DateArray = [2023, 12, 2, 8, 30]
    let duration: DurationObject = {hours: 1}
    let event: EventAttributes = {
        start: startTime,
        title: 'Test Event',
        description: 'testing of eventstuff',
        duration: duration
    }
        const d_file: Promise<File> = new Promise((resolve, reject) => {
            createEvent(event, (error, value) => {
                if (error) {
                    reject(error);
                }
                resolve(new File([value], filename, {type: 'text/calendar'}));
            });
        });

    onDestroy(() => URL.revokeObjectURL(d_url))
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->

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
                {#await d_file}
                    Loading
                {:then value}
                    <a href={URLfromFile(value)} download={filename}>
                    Schedule ics File  
                    </a>
                {/await}        
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