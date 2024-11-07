import DB, { type Class, type ClassStatus } from "../.server/db/DB";
import { readable, writable, get } from 'svelte/store';
import { ZstdInit } from '@oneidentity/zstd-js';
import { openDB } from "idb";

export function detectTerm(ignoreUrlParams=true) {
    // ABCD - A = first digit of year, BC = last two digits of year,
    // D: 8 = fall, 0 = winter, 2 = spring, 4 = summer 
    // 2238 - 2023 Fall
    // 2234 - 2023 Summer
    // 2232 - 2023 Spring
    // 2230 - 2023 Winter

    if (document.location.search.includes("term=") && !ignoreUrlParams) {
        let term = document.location.search.split("term=")[1].split("&")[0];
        if (term.length === 4) {
            console.log("Using term from URL...");
            return parseInt(term);
        }
    }

    let date = new Date();
    let year = date.getFullYear();
    let termYear = year.toString()[0] + year.toString().slice(2, 4);
    let month = date.getMonth() + 1; // month is ZERO INDEXED!!!

    if (month >= 11) {
        // November-Jan; winter
        return parseInt(`${parseInt(termYear) + 1}0`);
    } else if (month === 1) {
        // November-Jan; winter
        return parseInt(`${termYear}0`);
    } else if (month >= 2 && month < 4) {
        // Feb-Apr; spring
        return parseInt(`${termYear}2`);
    } else if (month == 4 && date.getDate() < 10) {
        // April-May; summer
        return parseInt(`${termYear}4`);
    } else {
        // May-Oct; fall
        return parseInt(`${termYear}8`);
    }
}

export async function decompressZSTD(buffer: ArrayBufferLike): Promise<ArrayBuffer> {
    const zstdInit = await ZstdInit();
    return zstdInit.ZstdSimple.decompress(new Uint8Array(buffer)).buffer;
}

async function fetchDBByYear(year: number) {
    let db = await openDB("yaucsccs", 1, {
        upgrade(db) {
          db.createObjectStore('db');
        },
    });

    let cachedArrayBuffer = await db.get("db", year);

    if (cachedArrayBuffer) {
        console.log("Using cached database...");

        return {arrayBuffer: cachedArrayBuffer, cached: true};
    }

    let resp = await fetch(`./db/${year}.yaucsccs.zstd`);
    if (resp.ok) {
        term.set(year);
        return {arrayBuffer: await decompressZSTD(await resp.arrayBuffer()), cached: false};
    } else {
        return {arrayBuffer: null, cached: false};
    }
}


export let term = writable(detectTerm(false));
export let setDB = (value: any) => {}

let dbPromise = null;
export let db = readable(null, (set) => {
    setDB = set;

    if (dbPromise) return;

    // check only once
    dbPromise = new Promise(async () => {
        let TERM = detectTerm(false);

        let fetchedArrayBuffer = null;
        let cached = false;
        while(true) {
            let result = await fetchDBByYear(TERM);
            fetchedArrayBuffer = result.arrayBuffer;
            cached = result.cached;
            if (fetchedArrayBuffer && fetchedArrayBuffer.byteLength) break;

            TERM -= 2;
        }

        let fetchedDB = DB.import(fetchedArrayBuffer);
        evaluateURLParams(fetchedDB);
        set(fetchedDB);

        let db = await openDB("yaucsccs", 1, {
            upgrade(db) {
              db.createObjectStore('db');
            },
        });

        if (cached) {
            if (Date.now() - fetchedDB.lastUpdate < 1000 * 60 * 60) {
                // Database is younger than an hour, so don't bother updating
                console.log("Ignoring update; database is fresh")
                return;
            }
            if (get(term) !== TERM) {
                // Older terms will get no updates, so ignore
                console.log("Ignoring update; database is from an older year")
                return;
            }

            console.log("Updating cached database...");

            let arrayBuffer;
            let resp = await fetch(`./db/${TERM}.yaucsccs.zstd`);
            if (resp.ok) {
                arrayBuffer = await decompressZSTD(await resp.arrayBuffer());
            }

            // save to db and update UI
            await db.put("db", arrayBuffer, TERM)
            
            console.log("Updated to newest version!");
            let newDB = DB.import(arrayBuffer);
            evaluateURLParams(newDB);
            set(newDB);
        } else {
            // save to cache
            await db.put("db", fetchedArrayBuffer, TERM)
        }
    })

    return () => {}
})

// get schedule from URL using database before it's actually loaded
function evaluateURLParams(db: any) {
    // must run first since it checks and changes the default view
    if (document.location.search.includes("class=") && get(focusedClass) === null) {
        let classNumber = parseInt(
            document.location.search
            .split("class=")[1]
            .split("&")[0]
            );
        
        if (classNumber && db.getClassByNumber(classNumber)) {
            listMode.set("all");
            focusedClass.set(db.getClassByNumber(classNumber));
        }
    }
    
    if (document.location.search.includes("scheduler=")) {
        let classes = document.location.search
            .split("scheduler=")[1]
            .split("&")[0]
            .split(",")
            .map(x => parseInt(x))
            .filter(x => x && db.getClassByNumber(x))
        
        if (classes.length > 0) {
            listMode.set("scheduler");
            scheduledClasses.set(classes);
            // Add to starred classes if not already there
            starredClasses.update((value) => [...value, ...classes].filter((v, i, a) => a.indexOf(v) === i));
            localStorage.setItem("scheduledClasses", JSON.stringify(classes));
        }
    }
}

export let focusedClass = writable<Class|"home"|null>(null);
export let home = writable<string|null>(localStorage.getItem("home") === null ? "Porter College" : localStorage.getItem("home"));
export let starredClasses = writable<number[]>(
    localStorage.getItem(`starredClasses-${get(db)?.term || get(term)}`) ?
    JSON.parse(localStorage.getItem(`starredClasses-${get(db)?.term || get(term)}`)) :
    []
);
export let scheduledClasses = writable<number[]>(
    localStorage.getItem(`scheduledClasses-${get(db)?.term || get(term)}`) ?
    JSON.parse(localStorage.getItem(`scheduledClasses-${get(db)?.term || get(term)}`)) :
    []
);
export let smartClasses = writable<number[]>([]); // do not cache this
export let listMode = writable<"scheduler"|"starred"|"all"|"smart">(
    get(scheduledClasses).length ? "scheduler" :
    get(starredClasses).length ? "starred" : "all"
);

function pushState() {
    if (get(db) === null) return;

    let url = "./"

    let focusedClassValue = get(focusedClass);
    let listModeValue = get(listMode);

    if ((listModeValue === "all" || listModeValue === "starred") && focusedClassValue !== null && typeof focusedClassValue !== "string") {
        url = `./?class=${focusedClassValue.number}&term=${get(db).term}`;
    }

    if (url.slice(2) === document.location.search) {
        // no update needed
        return;
    }

    window.history.pushState({
        class: focusedClassValue,
        listMode: listModeValue,
        term: get(db).term
    }, "", url);
}

focusedClass.subscribe(pushState);
listMode.subscribe(pushState);

window.addEventListener("popstate", (state) => {
    const poppedState = state.state;

    if (poppedState) {
        listMode.set(poppedState.listMode);
        focusedClass.set(poppedState.class);

        if (poppedState.term !== get(term)) {
            fetchDBByYear(poppedState.term).then((result) => {
                let fetchedDB = DB.import(result.arrayBuffer);
                setDB(fetchedDB);
            })
        }
    } else {
        let urlParams = new URLSearchParams(document.location.search);
        if (urlParams.has("class")) {
            let classNumber = parseInt(urlParams.get("class"));
            if (classNumber) {
                focusedClass.set(get(db).getClassByNumber(classNumber));
            }
        } else {
            focusedClass.set(null);
        }

        if (urlParams.has("term")) {
            fetchDBByYear(poppedState.term).then((result) => {
                let fetchedDB = DB.import(result.arrayBuffer);
                setDB(fetchedDB);
            })
        }
    }

    
})

starredClasses.subscribe((value) => {
    localStorage.setItem(`starredClasses-${get(db)?.term || get(term)}`, JSON.stringify(value));
    //@ts-ignore
    window.starredClasses = value;
})

scheduledClasses.subscribe((value) => {
    localStorage.setItem(`scheduledClasses-${get(db)?.term || get(term)}`, JSON.stringify(value));
    //@ts-ignore
    window.scheduledClasses = value;
})

home.subscribe((value) => {
    localStorage.setItem("home", value);
})

db.subscribe((value) => {
    // @ts-ignore
    window.db = value;

    starredClasses.set(
        localStorage.getItem(`starredClasses-${value?.term || get(term)}`) ?
        JSON.parse(localStorage.getItem(`starredClasses-${value?.term || get(term)}`)) :
        []
    )

    scheduledClasses.set(
        localStorage.getItem(`scheduledClasses-${value?.term || get(term)}`) ?
        JSON.parse(localStorage.getItem(`scheduledClasses-${value?.term || get(term)}`)) :
        []
    )
})

interface SearchFilters {
    department: string[],
    instructionMode: string[],
    status: ClassStatus[],
    ges: string[],
    undergraduate: boolean|null,
    searchResults: {query: string, results: any[]}|null;
    sortMode: {value: string, fn: Function}|null;
}

export let searchFilters = writable<{[key: string]: SearchFilters}>(
    {
        "all": {
            department: [],
            instructionMode: [],
            status: [],
            ges: [],
            undergraduate: null,
            searchResults: null,
            sortMode: null
        },
        "starred": {
            department: [],
            instructionMode: [],
            status: [],
            ges: [],
            undergraduate: null,
            searchResults: null,
            sortMode: null
        },
        "scheduler": {
            department: [],
            instructionMode: [],
            status: [],
            ges: [],
            undergraduate: null,
            searchResults: null,
            sortMode: null
        }
    }
)