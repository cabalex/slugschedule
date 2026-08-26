<script lang="ts">
    import AlertCircleOutline from "svelte-material-icons/AlertCircleOutline.svelte";
    import AsteriskCircleOutline from "svelte-material-icons/AsteriskCircleOutline.svelte";

    import RichText from "../../../assets/RichText.svelte";
    import PrereqNode from "./PrereqNode.svelte";
    import { parsePrerequisites } from "./prerequisites";
    import { onMount } from "svelte";

    export let content = "";

    let showOriginal: boolean = false;
    let init: boolean = false;

    $: init && localStorage.setItem("show-original-prereqs", showOriginal ? "true" : "false");

    onMount(() => {
        showOriginal = localStorage.getItem("show-original-prereqs") == "true";
        init = true;
    });

    $: parsedContent = parsePrerequisites(content);
</script>

<div class="prerequisites">
    <div class="switcher">
        <button disabled={showOriginal} on:click={() => { showOriginal = !showOriginal; }} class="left">
            Original
        </button>
        <button disabled={!showOriginal} on:click={() => { showOriginal = !showOriginal; }} class="right">
            Expanded
        </button>
    </div>

    {#if showOriginal}
        <div class="sectionTitle">
            <div class="icon">
                <AsteriskCircleOutline></AsteriskCircleOutline>
            </div>
            <p class="text">Prerequisites</p>
        </div>

         <div class="section sectionRichText">
            <RichText content={content} />
        </div>
    {/if}

    {#if parsedContent.prerequisites != null && showOriginal == false}
        <div class="sectionTitle">
            <div class="icon">
                <AsteriskCircleOutline></AsteriskCircleOutline>
            </div>
            <p class="text">Prerequisites</p>
        </div>

        <PrereqNode node={parsedContent.prerequisites}></PrereqNode>
    {/if}

    {#if parsedContent.restrictions.length != 0 && showOriginal == false}
        <div class="sectionTitle">
            <div class="icon">
                <AlertCircleOutline></AlertCircleOutline>
            </div>
            <p class="text">Restrictions</p>
        </div>
        
        <div class="section sectionRichText">
            <RichText content={parsedContent.restrictions.join("\n\n")} />
        </div>
    {/if}
</div>

<style>
    .prerequisites {
        position: relative;
    }

    .prerequisites .switcher {
        position: absolute;
        top: 0;
        right: 0;
        font-size: 10px;
    }

    .switcher .left {
        border-radius: 8px 4px 4px 8px;
    }

    .switcher .right {
        border-radius: 4px 8px 8px 4px;
    }

    .switcher button:enabled {
        background-color: transparent;
        border-color: #6a6969;
        border-width: 1px;
    }

    .switcher button:disabled {
        background-color: #2c2c2c;
    }

    p {
        margin-top: 5px;
        line-height: 1.75em;
        white-space: pre-line;
    }

    .sectionTitle {
        display: flex; 
        align-items: center;
        gap: 4px;
        margin-top: 16px;
        margin-bottom: 4px;
    }
    .sectionTitle .icon {
        display: flex;
        align-items: center;
        font-size: 18px
    }
    .sectionTitle .text {
        margin: 0px;
        font-size: 16px;
        font-weight: 600;
    }
    .section {
        background-color: #0000002d;
        padding: 16px 20px 16px 20px;
        border-radius: 8px;
    }
</style>