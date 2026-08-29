<script lang="ts">
    import ArrowLeft from "svelte-material-icons/ArrowLeft.svelte";
    import LoadingIcon from "svelte-material-icons/Loading.svelte";
    import { db, focusedClass, home, listMode, liveUpdates, setDB, decompressZSTD, shouldAnimate } from "../mainStore";
    import Class from "./Class/Class.svelte";
    import Scheduler from "./Scheduler/Scheduler.svelte";
    import { openDB } from "idb";
    import DB from "../../.server/db/DB";
  import { fade, fly } from "svelte/transition";

    let mainElem;

    // scroll to top once new class is clicked
    $: if (mainElem && $focusedClass && $listMode !== "scheduler") {
        mainElem.scrollTop = 0;
    }

    let loading = false;
    async function attemptLoad() {
        loading = true;
        let TERM = $db?.term;

        let resp = await fetch(`./db/${TERM}.yaucsccs.zstd`);

        if (!resp.ok) {
            loading = false;
            return;
        }

        let localDB = await openDB("yaucsccs", 1, {
            upgrade(db) {
              db.createObjectStore('db');
            },
        });

        let arrayBuffer = await decompressZSTD(await resp.arrayBuffer());
        
        // save to db
        await localDB.put("db", arrayBuffer, TERM)
        
        console.log("Updated to newest version!");
        let newDB = DB.import(arrayBuffer);
        setDB(newDB);
        $focusedClass = "home";
        loading = false;
    }

    function setLiveUpdates(event) {
        let checked = (event.target as HTMLInputElement).checked;
        liveUpdates.set(checked);
    }
</script>

<main bind:this={mainElem} class:focused={$focusedClass} class:scheduler={$listMode === "scheduler"}>
    {#if $listMode === "scheduler" || $listMode === "smart"}
        <div class="mainInner">
            <Scheduler />
        </div>
    {:else if $focusedClass && $focusedClass !== "home"}
        {#key $focusedClass.number}
            <div class="mainInner" in:fly|global={{ duration: $shouldAnimate ? 200 : 0, x: -50 }}>
                <Class item={$focusedClass} />
            </div>
        {/key}
    {:else}
        <div class="mainInner initial" in:fade={{ duration: 200 }}>
            <h1>SlugSchedule</h1>
            Select a class to see more details about it. You can also search or use the dropdowns to filter your results.<br />
            Need more help? <a href="https://github.com/cabalex/slugschedule/wiki/Usage-Guide" target="_blank" rel="noopener noreferrer">See the Usage Guide</a>.<br />

            <h2>Settings</h2>
            <p>
                <label for="autoCheckForUpdates">Enable live updates (pulls from UCSC servers):</label>
                <input type="checkbox" id="autoCheckForUpdates" on:change={setLiveUpdates} checked={$liveUpdates} />
            </p>
            
            For accurate walking estimates, I live at <select aria-label="Home location" bind:value={$home}>
                <option value="">Off campus</option>
                <option>Cowell College</option>
                <option>Stevenson College</option>
                <option>Crown College</option>
                <option>Merrill College</option>
                <option>Porter College</option>
                <option>Kresge College</option>
                <option>Oakes College</option>
                <option>Rachel Carson College</option>
                <option>College Nine</option>
                <option>John R. Lewis College</option>
                <option>The Village</option>
                <option value="Redwood Grove Apartments">Redwood Grove</option>
                <option>Graduate Student Housing</option>
                <option>Family Student Housing</option>
                <option value="UCSC Trailer Park">Camper Park</option>
            </select>

            <p>DB data should update every hour. Last updated: {new Date($db.lastUpdate).toLocaleString()}</p>
            <button on:click={attemptLoad}>
                {#if loading}
                    <span class="loading">
                        <LoadingIcon size="2em" />
                    </span>
                {:else}
                    Update now
                {/if}
            </button>

            <h2>Quick Links</h2>
            <a href="https://my.ucsc.edu" target="_blank">MyUCSC</a> <br />
            <a href="https://ucsc.instructure.com" target="_blank">Canvas</a> <br />
            <a href="https://advising.ucsc.edu/plan-your-academics/" target="_blank">Undergraduate Advising / Academic Planning</a> <br />
            <a href="https://registrar.ucsc.edu/requirements-planning/undergraduate-degree-requirements/" target="_blank">General Education Requirements</a> <br />
            <a href="https://registrar.ucsc.edu/calendars-resources/academic-calendar/final-exam-calendar/" target="_blank">Final Exam Calendar</a>

            <p>Created with 💛 by <a href="https://cabalex.github.io" target="_blank">@cabalex</a> with contributions from <a href="https://github.com/darthnithin" target="_blank">@darthnithin</a>. <a href="https://github.com/cabalex/slugschedule" target="_blank" rel="noopener noreferrer">View source here</a>.</p>
            <p>Thanks to <a href="https://slugtistics.com/about" target="_blank">Jack LeValley</a> for grade distributions data.</p>

            
            <header class="mobileHeader">
                <button class="roundBtn" on:click={() => $focusedClass = null}>
                    <ArrowLeft />
                </button>
                <h2 style="margin: 0">Home</h2>
            </header>
        </div>
    {/if}
</main>

<style>
    main {
        flex-grow: 1;
        overflow: hidden;
    }
    .mainInner {
        box-sizing: border-box;
        width: calc(100% - 10px);
        height: calc(100% - 10px);
        margin: 10px 10px 0 0;
        padding: 15px;
        border-radius: 16px 16px 0 0;
        border-bottom: 0;
        border: 1px solid #6a6969;
        background-color: #494949;
        overflow: auto;
    }
    .mainInner.initial {
        background-color: transparent;
        border: none;
        max-width: 800px;
        margin: 0 auto;
    }
    input[type="checkbox"] {
        transform: scale(1.2);
        margin-left: 10px;
        vertical-align: middle;
    }
    h1 {
        font-size: 2em;
    }
    a {
        line-height: 2em;
    }
    .loading {
        height: 1.25em;
        width: 5.5em;
        display: block;
        transform: rotate(0deg);
        animation: rotate 1s linear infinite;
    }
    @keyframes loading {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
    @media screen and (max-width: 1000px) {
        main {
            position: fixed;
            left: 100%;
            top: 0;
            margin: 0;
            width: 100%;
            height: 100%;
            transition: left 0.2s cubic-bezier(0.075, 0.82, 0.165, 1);
            z-index: 2;
        }
        .mainInner { 
            margin: 0;
            width: 100%;
            height: 100%;
            border-radius: 0;
            border: none;
            padding: 10px;
        }
        .mainInner.initial {
            max-width: unset;
            background-color: #333;
        }
        .scheduler .mainInner {
            width: 100%;
            padding: 0;
        }
        main.focused {
            left: 0;
        }
    }
</style>
