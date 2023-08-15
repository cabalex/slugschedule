<script lang="ts">
    import History from "svelte-material-icons/History.svelte";
    import Star from "svelte-material-icons/Star.svelte";
    import Magnify from "svelte-material-icons/Magnify.svelte";
    import Calendar from "svelte-material-icons/Calendar.svelte";
    import { db, focusedClass, listMode } from "../mainStore";

    const terms = {
        "2228": "Fall 2022",
        "2230": "Winter 2022",
        "2232": "Spring 2023",
        "2234": "Summer 2023",
        "2238": "Fall 2023",
    }

    let term = "Unknown"
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
</script>
<aside>
    <span class="grower mobile" />
    <button class="logo" on:click={() => $focusedClass = "home"}>
        YA<span style="color: var(--primary); display: block">UCSC</span>CS
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
    <span class="grower" />
    <span class="term" style="text-align: center">{term} ({$db.term})</span>
</aside>

<style>
    aside {
        flex-shrink: 0;
        width: 72px;
        background-color: #333;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 20px 0;
        align-items: center;
    }
    aside > *:not(.indicator):not(span) {
        border-radius: 10px;
        width: 62px;
        height: 62px;
        overflow: hidden;
        background-color: #222;
        user-select: none;
        cursor: pointer;
    }
    .logo {
        padding: unset;
        line-height: calc(62px / 3);
        text-align: center;
        font-size: 20px;
        font-weight: bold;
        word-wrap: break-word;
        outline: none;
    }
    .iconBtn {
        padding: 0;
        line-height: 0;
        outline: none;
    }
    .iconBtn.active {
        color: var(--primary);
    }
    .grower:not(.mobile) {
        flex-grow: 1;
    }
    @media screen and (max-width: 700px) {
        aside {
            position: fixed;
            bottom: 0;
            flex-direction: row;
            width: 100%;
            height: 50px;
            padding: 0;
            align-content: center;
        }
        .logo {
            width: 120px !important;
            background-color: transparent !important;
        }
        .logo span {
            display: inline-block !important;
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
        }
    }
</style>