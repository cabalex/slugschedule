import DB, { type Class, type ClassStatus } from "../.server/db/DB";
import { readable, writable, get } from 'svelte/store';
import { openDB } from "idb";

export function detectTerm() {
    // ABCD - A = first digit of year, BC = last two digits of year,
    // D: 8 = fall, 0 = winter, 2 = spring, 4 = summer 
    // 2238 - 2023 Fall
    // 2234 - 2023 Summer
    // 2232 - 2023 Spring
    // 2230 - 2023 Winter

    let date = new Date();
    let year = date.getFullYear();
    let termYear = year.toString()[0] + year.toString().slice(2, 4);
    let month = date.getMonth();

    if (month >= 11 || month <= 1) {
        // November-Jan; winter
        return `${termYear}0`;
    } else if (month >= 2 && month <= 4) {
        // Feb-Apr; spring
        return `${termYear}2`;
    } else if (month >= 5 && month <= 7) {
        // May-Jul; summer
        return `${termYear}4`;
    } else {
        // Aug-Oct; fall
        return `${termYear}8`;
    }
}


const TERM = detectTerm();

export let db = readable(null, (set) => {

    // check 
    new Promise(async () => {
        let db = await openDB("yaucsccs", 1, {
            upgrade(db) {
              db.createObjectStore('db');
            },
        });

        let cachedArrayBuffer = await db.get("db", TERM);

        if (cachedArrayBuffer) {
            console.log("Using cached database...");
            let cachedDB = DB.import(cachedArrayBuffer);
            set(cachedDB);

            if (cachedDB.lastUpdate - Date.now() < 1000 * 60 * 60) {
                // Database is younger than an hour, so don't bother updating
                return;
            }
        }

        let resp = await fetch(`./db/${TERM}.yaucsccs`);
        let arrayBuffer = await resp.arrayBuffer();
        
        // save to db
        await db.put("db", arrayBuffer, TERM)
        
        console.log("Updated to newest version!");
        set(DB.import(arrayBuffer));
    })

    return () => {}
})

export let focusedClass = writable<Class|"home"|null>(null);
export let home = writable<string|null>(localStorage.getItem("home") === null ? "Porter College" : localStorage.getItem("home"));
export let starredClasses = writable<number[]>(localStorage.getItem("starredClasses") ? JSON.parse(localStorage.getItem("starredClasses")) : []);
export let scheduledClasses = writable<number[]>(localStorage.getItem("scheduledClasses") ? JSON.parse(localStorage.getItem("scheduledClasses")) : []);
export let listMode = writable<"scheduler"|"starred"|"all">(
    get(scheduledClasses).length ? "scheduler" :
    get(starredClasses).length ? "starred" : "all"
);

starredClasses.subscribe((value) => {
    localStorage.setItem("starredClasses", JSON.stringify(value));
})

scheduledClasses.subscribe((value) => {
    localStorage.setItem("scheduledClasses", JSON.stringify(value));
})

home.subscribe((value) => {
    localStorage.setItem("home", value);
})

interface SearchFilters {
    department: string[],
    instructionMode: string[],
    status: ClassStatus[],
    ges: string[],
    undergraduate: boolean|null,
    searchResults: {query: string, results: any[]}|null;
}

export let searchFilters = writable<{[key: string]: SearchFilters}>(
    {
        "all": {
            department: [],
            instructionMode: [],
            status: [],
            ges: [],
            undergraduate: null,
            searchResults: null
        },
        "starred": {
            department: [],
            instructionMode: [],
            status: [],
            ges: [],
            undergraduate: null,
            searchResults: null
        },
        "scheduler": {
            department: [],
            instructionMode: [],
            status: [],
            ges: [],
            undergraduate: null,
            searchResults: null
        }
    }
)