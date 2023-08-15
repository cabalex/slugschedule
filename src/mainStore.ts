import DB, { type Class, type ClassStatus } from "../.server/db/DB";
import { readable, writable, get } from 'svelte/store';

export let db = readable(null, (set) => {
    new Promise(async () => {
        let resp = await fetch('./db/db.yaucsccs');
        let arrayBuffer = await resp.arrayBuffer();
        set(DB.import(arrayBuffer));
    })

    return () => {}
})

export let focusedClass = writable<Class|"home"|null>(null);
export let home = writable<string|null>("Porter College");
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


interface SearchFilters {
    department: string[],
    instructionMode: string[],
    status: ClassStatus[],
    ges: string[],
    undergraduate: boolean|null
}

export let searchFilters = writable<SearchFilters>({
    department: [],
    instructionMode: [],
    status: [],
    ges: [],
    undergraduate: null
})