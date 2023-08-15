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
export let classHistory = writable<Class[]>([]);
export let listMode = writable<"starred"|"all">(get(starredClasses).length ? "starred" : "all");

focusedClass.subscribe((value) => {
    if (value && value !== "home") {
        classHistory.update(h => [
            value, ...h.filter(id => id.number !== value.number)
        ].slice(0, 10))
    }
})

starredClasses.subscribe((value) => {
    localStorage.setItem("starredClasses", JSON.stringify(value));
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