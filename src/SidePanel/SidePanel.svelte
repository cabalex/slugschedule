<script lang="ts">
    import History from "svelte-material-icons/History.svelte";
    import Star from "svelte-material-icons/Star.svelte";
    import Magnify from "svelte-material-icons/Magnify.svelte";
    import { classHistory, db, focusedClass, listMode } from "../mainStore";

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
    <button class="logo" on:click={() => focusedClass.set(null)}>
        YA<br /><span style="color: var(--primary);">UCSC</span><br />CS
    </button>
    <button title="Starred classes" on:click={() => $listMode = "starred"} class="iconBtn" class:active={$listMode === "starred"}>
        <Star size="2em" />
    </button>
    <button title="Search classes" on:click={() => $listMode = "all"} class="iconBtn" class:active={$listMode === "all"}>
        <Magnify size="2em" />
    </button>
    <!-- Too distracting; disable for now
    <History />
    {#each $classHistory as classItem, i}
        {#key (classItem.number, i)}
            {#if i === 0 && classItem.number === $focusedClass?.number}
            <div class="indicator" />
            {/if}
            <button
                on:click={() => focusedClass.set(classItem)}
                class="classIcon"
                style="background-color: hsl({classItem.number % 360}, 30%, 30%)"
            >
                <span class="dept">{classItem.code.split(" ")[0]}</span>
                <span class="num">{classItem.code.split(" ")[1]}</span>
            </button>
        {/key}
    {/each}
    -->

    <span style="flex-grow: 1" />
    <span style="text-align: center">{term} ({$db.term})</span>
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
    .indicator {
        position: absolute;
        left: 0;
        top: 128px;
        width: 5px;
        height: 42px;
        border-radius: 0 5px 5px 0;
        background-color: var(--primary);
    }
    .classIcon {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-left: 5px;
        margin-bottom: 5px;
        width: 57px !important;
        height: 57px !important;
        outline: none;
    }
    .dept {
        font-weight: bold;
        line-height: 1em;
    }
    .num {
        font-weight: normal;
        font-size: 25px;
        display: block;
        line-height: 25px;
    }
</style>