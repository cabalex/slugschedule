<script lang="ts">
    import SlugSchedule from "../assets/slugschedule.svg";
    import Star from "svelte-material-icons/Star.svelte";
    import Magnify from "svelte-material-icons/Magnify.svelte";
    import Calendar from "svelte-material-icons/Calendar.svelte";
    import AutoFix from "svelte-material-icons/AutoFix.svelte";
    import { db, focusedClass, listMode } from "../mainStore";
    import TermMenu from "./TermMenu.svelte";

    let term = "Unknown"
    let termMenuOpen = false;

    $: {
        switch($db.term % 10) {
            case 0:
                term = "❄ 20" + $db.term.toString().slice(1, 3)
                break;
            case 2:
                term = "🌸 20" + $db.term.toString().slice(1, 3)
                break;
            case 4:
                term = "☀ 20" + $db.term.toString().slice(1, 3)
                break;
            case 8:
                term = "🍁 20" + $db.term.toString().slice(1, 3)
                break;
        }
    }
</script>
<aside>
    <span class="grower mobile" />
    <button class="logo" on:click={() => { $focusedClass = "home"; $listMode = "all"}}>
        <img src={SlugSchedule} width="50px" alt="Slug Schedule Logo. Yellow Slug in front of Calendar."/>
    </button>
    <button title="Search classes" on:click={() => $listMode = "all"} class="iconBtn" class:active={$listMode === "all"}>
        <Magnify size="2em" />
    </button>
    <button title="Starred classes" on:click={() => $listMode = "starred"} class="iconBtn" class:active={$listMode === "starred"}>
        <Star size="2em" />
    </button>
    <button title="Schedule classes" on:click={() => $listMode = "scheduler"} class="iconBtn" class:active={$listMode === "scheduler"}>
        <Calendar size="2em" />
    </button>
    <!--
    <button title="Smart class search" on:click={() => $listMode = "smart"} class="iconBtn smart" class:active={$listMode === "smart"}>
        <AutoFix size="2em" />
    </button>
    -->
    <span class="grower" />
    <button on:click={() => termMenuOpen = !termMenuOpen} class:active={termMenuOpen} class="term" style="text-align: center">{term} ({$db.term})</button>
    {#if termMenuOpen}
        <TermMenu bind:term={term} bind:termMenuOpen={termMenuOpen} />
    {/if}
</aside>

<style>
    aside {
        position: relative;
        flex-shrink: 0;
        width: 72px;
        background-color: #333;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 20px 0;
        align-items: center;
    }
    aside > *:not(.indicator):not(.term):not(span) {
        border-radius: 10px;
        width: 62px;
        height: 62px;
        overflow: hidden;
        background-color: #222;
        user-select: none;
        cursor: pointer;
    }
    .logo {
        line-height: 0;
        padding: 0;
        background-color: transparent !important;
        border-width: 0;
        transition: filter 0.1s ease-in-out, transform 0.1s ease-in-out;
        outline: none;
    }
    .logo:hover, .logo:focus-visible {
        filter: hue-rotate(-55deg);
        transform: scale(1.1);
    }
    .iconBtn {
        padding: 0;
        line-height: 0;
/*         outline: none;
 */    }
    .term {
        background-color: transparent;
        color: unset;
        border: none;
        outline: none;
        font-weight: unset;
        font-size: unset;
        padding: 0px;
    }
    .term:hover, .term.active, .term:focus-visible {
        color: darkblue;
        font-weight: 600;
        text-shadow:#444;
    }

    .iconBtn.active{
        color: var(--primary);
    }
    .grower:not(.mobile) {
        flex-grow: 1;
    }
    @media screen and (max-width: 1000px) {
        aside {
            position: fixed;
            bottom: 0;
            flex-direction: row;
            width: 100%;
            height: 50px;
            padding: 0;
            align-content: center;
            z-index: 10;
            border-top: 2px solid #444;
        }
        .logo > img {
            width: 40px;
        }
        aside > * {
            height: 40px !important;
        }
        .grower.mobile {
            flex-grow: 2;
        }
        .term {
            line-height: 40px;
            margin-right: 5px;
            flex-shrink: 10;
        }
    }
</style>