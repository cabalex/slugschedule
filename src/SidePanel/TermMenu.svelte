<script lang="ts">
    import LoadingIcon from "svelte-material-icons/Loading.svelte";
    import { db, decompressZSTD, detectTerm, focusedClass, setDB, term as termStore } from "../mainStore";
    import { openDB } from "idb";
    import DB from "../../.server/db/DB";
    import { slide } from "svelte/transition";

    export let term = "Unknown";
    export let termMenuOpen = true;
    let termLoadError = null;
    let loading = false;
    let termQuarter = ($db.term % 10).toString();
    let termYear = parseInt("20" + $db.term.toString().slice(1, 3));

    function setToday() {
        let term = detectTerm();

        termQuarter = (term % 10).toString();
        termYear = parseInt("20" + term.toString().slice(1, 3));
    }

    async function attemptLoad() {
        loading = true;
        let TERM = parseInt("2" + termYear.toString().slice(2, 4) + termQuarter);
        let db = await openDB("yaucsccs", 1, {
            upgrade(db) {
              db.createObjectStore('db');
            },
        });

        let cachedArrayBuffer = await db.get("db", TERM);

        if (cachedArrayBuffer) {
            console.log("Using cached database...");
            let cachedDB = DB.import(cachedArrayBuffer);
            setDB(cachedDB);
            $focusedClass = "home";

            loading = false;

            if (Date.now() - cachedDB.lastUpdate < 1000 * 60 * 60 || TERM !== detectTerm()) {
                // Database is younger than an hour, so don't bother updating
                // Or, the database is old and won't be updated
                console.log("Ignoring update")
                $termStore = TERM;
                termMenuOpen = false;
                return;
            }
        }

        let resp = await fetch(`./db/${TERM}.yaucsccs.zstd`);

        if (!resp.ok) {
            termLoadError = `Couldn't load term ${TERM} (it may not exist yet).`;
            loading = false;
            return;
        }

        let arrayBuffer = await decompressZSTD(await resp.arrayBuffer());
        
        // save to db
        await db.put("db", arrayBuffer, TERM)
        
        console.log("Updated to newest version!");
        let newDB = DB.import(arrayBuffer);
        setDB(newDB);
        $termStore = TERM;
        $focusedClass = "home";
        loading = false;
        termMenuOpen = false;
    }

    function clickOut(e?) {
        if (e && (e.target.closest(`.termMenu`) || e.target.closest(`.term`))) return;
        termMenuOpen = false;
    }
</script>

<div class="termMenu" transition:slide={{duration: 100, axis: window.innerWidth < 1000 ? 'y' : 'x'}}>
    View schedule for:
    <span class="termSelector">
        <select bind:value={termQuarter}>
            <option value="8">Fall</option>
            <option value="0">Winter</option>
            <option value="2">Spring</option>
            <option value="4">Summer</option>
        </select>
        <input type="number" min="2000" max="2099" bind:value={termYear} />
    </span>
    {#if termLoadError}
        <span style="color: orange; text-align: center">{termLoadError}</span>
    {/if}
    <div class="btnrow">
        <button class="todayBtn" disabled={loading || ((detectTerm() % 10).toString() === termQuarter && parseInt("20" + detectTerm().toString().slice(1, 3)) === termYear)} on:click={setToday}>
            Today
        </button>
        <button class="primaryBtn" disabled={loading} on:click={attemptLoad}>
            {#if !loading}
            Select
            {:else}
            <div class="loading">
                <LoadingIcon size="2em" />
            </div>
            {/if}
        </button>
    </div>
</div>

<svelte:body on:click={clickOut} />

<style>
    .termMenu {
        position: absolute;
        z-index: 50;
        left: 100%;
        background-color: #444 !important;
        bottom: 0;
        border-radius: 0 10px 10px 0;
        padding: 10px;
        width: unset !important;
        height: unset !important;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        cursor: default !important;
        box-shadow: 5px 0 5px rgba(0, 0, 0, 0.5);
    }
    .termSelector {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .termSelector > * {
        font-size: unset !important;
    }
    .termSelector input {
        width: 8ch;
    }
    .todayBtn {
        background-color: transparent;
        border-width: none;
        outline: none;
    }
    .todayBtn:disabled {
        opacity: 0.5;
    }
    .todayBtn:hover {
        background-color: rgba(0, 0, 0, 0.2);
    }
    .loading {
        height: 1em;
        width: 43px;
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
        .termMenu {
            bottom: 100% !important;
            right: 0;
            left: unset !important;
            box-shadow: -5px 0 5px rgba(0, 0, 0, 0.5);
            border-radius: 10px 10px 0 0;
            align-items: flex-end;
        }
    }
</style>