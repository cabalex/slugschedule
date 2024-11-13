<script lang="ts">
    import ArrowLeft from "svelte-material-icons/ArrowLeft.svelte";
    import LoadingIcon from "svelte-material-icons/Loading.svelte";
    import { db, focusedClass, home, listMode, setDB, decompressZSTD } from "../mainStore";
    import Class from "./Class/Class.svelte";
    import Scheduler from "./Scheduler/Scheduler.svelte";
    import { openDB } from "idb";
    import DB from "../../.server/db/DB";

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
</script>

<main bind:this={mainElem} class:focused={$focusedClass} class:scheduler={$listMode === "scheduler"}>
    {#if $listMode === "scheduler" || $listMode === "smart"}
        <Scheduler />
    {:else if $focusedClass && $focusedClass !== "home"}
        {#key $focusedClass.number}
            <Class item={$focusedClass} />
        {/key}
    {:else}
        <h1>SlugSchedule</h1>
        Select a class to see more details about it. You can also search or use the dropdowns to filter your results.<br />
        Need more help? <a href="https://github.com/cabalex/slugschedule/wiki/Usage-Guide" target="_blank" rel="noopener noreferrer">See the Usage Guide</a>.<br />

        <h2>Home</h2>
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

        <h2>Quick Links</h2>
        <a href="https://my.ucsc.edu" target="_blank">MyUCSC</a> <br />
        <a href="https://ucsc.instructure.com" target="_blank">Canvas</a> <br />
        <a href="https://advising.ucsc.edu/gettingstartedinthemajor/frosh/index.html" target="_blank">Getting Started In Your Major</a> <br />
        <a href="https://registrar.ucsc.edu/enrollment/general-education-requirements.html" target="_blank">General Education Requirements</a> <br />
        <a href="https://registrar.ucsc.edu/soc/final-examinations.html" target="_blank">Final Examinations Times</a>

        <p>Created with 💛 by <a href="https://cabalex.github.io" target="_blank">@cabalex</a> with contributions from <a href="https://github.com/darthnithin" target="_blank">@darthnithin</a>. <a href="https://github.com/cabalex/slugschedule" target="_blank" rel="noopener noreferrer">View source here</a>.</p>
        <p>Thanks to <a href="https://slugtistics.com/about" target="_blank">Jack LeValley</a> for grade distributions data.</p>
        <p>Data should update every hour. Last updated: {new Date($db.lastUpdate).toLocaleString()}</p>
        <button on:click={attemptLoad}>
            {#if loading}
                <span class="loading">
                    <LoadingIcon size="2em" />
                </span>
            {:else}
                Update now
            {/if}
        </button>
        
        <header class="mobileHeader">
            <button class="roundBtn" on:click={() => $focusedClass = null}>
                <ArrowLeft />
            </button>
            <h2 style="margin: 0">Home</h2>
        </header>
    
    {/if}
</main>

<style>
    main {
        flex-grow: 1;
        width: calc(100% - 60px);
        height: calc(100% - 50px);
        margin: 10px 10px 0 0;
        padding: 20px;
        border-radius: 10px 10px 0 0;
        background-color: #333;
        overflow: auto;
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
            width: calc(100% - 40px);
            height: 100%;
            margin: 0;
            border-radius: 0;
            transition: left 0.1s ease-out;
            z-index: 2;
        }
        .scheduler {
            width: 100%;
            padding: 0;
        }
        main.focused {
            left: 0;
        }
    }
</style>
