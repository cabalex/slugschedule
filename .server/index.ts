import getCurrentTerm from "./search/currentTerm";
import search from "./search/search";
import searchRMP from "./ratemyprofessor/search";
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "fs";
import DB, { type Class, ClassStatus } from "./db/DB";
import axios from "axios";
import https from "https";



async function backoffRetryer<T>(fn: () => Promise<T>, index?: number): Promise<T> {
    return new Promise((resolve) => {
        let intervals = [2, 5, 5, 10, 15, 15, 30, 30, 60];
        let nextIndex = Math.min(index || 0, intervals.length - 1);
        fn()
            .then(resolve)
            .catch(e => {
                if (e.message.includes("Could not")) {
                    console.log(`retrying in ${intervals[nextIndex]} seconds...`);
                    setTimeout(() => {
                        backoffRetryer(fn, nextIndex + 1);
                    }, intervals[nextIndex] * 1000);
                } else {
                    throw e;
                    //console.log("could not fetch class, skipping...");
                    //resolve(null);
                }
            })
    })
    
}

async function main() {
    // Fix axios instances
    axios.defaults.timeout = 15000;
    axios.defaults.httpsAgent = new https.Agent({ keepAlive: true });


    let term = await getCurrentTerm();
    console.log(`Reaching out to full catalog for term ${term}...`)
    let classes = (await search({term, results: 2000}));

    if (existsSync(`../public/db/${term}.yaucsccs`)) {
        // update database
        console.log("updating the database...");
        let tempDB = new DB(term);
        let db = DB.import(readFileSync(__dirname + `/../public/db/${term}.yaucsccs`).buffer);
        let changed = false;
        
        for (let i = 0; i < classes.length; i++) {
            let comparingClass = classes[i];
            let dbClassIndex = db.classes.findIndex(c => c.number == comparingClass.number);
            let dbClass = db.classes[dbClassIndex]

            if (dbClass && comparingClass.availability.enrolled !== dbClass.availability.enrolled) {
                // don't need to fetch for this, but it's still a change
                changed = true;
                db.classes[dbClassIndex].availability.enrolled = comparingClass.availability.enrolled;
            } else if (dbClass) {

            }

            let subscribed = [true];
            if (dbClass) {
                subscribed = [
                    // if capacity changes...
                    comparingClass.availability.capacity !== dbClass?.availability.capacity,
                    // or the class is no longer open (something might happen with waitlist) ...
                    comparingClass.availability.status === ClassStatus.Waitlist,
                    // or the class has associated classes (something might update in one of them)
                    dbClass?.associatedClasses.length > 0,
                    // or the class has changed ...
                    comparingClass.availability.status !== dbClass.availability.status,
                    // or the staff changes
                    comparingClass.instructor.name !== dbClass.instructor.name
                ]
            }

            if (!dbClass || subscribed.some(s => s)) {
                // update the class
                changed = true;
                if (subscribed.every((s, i) => i === 1 ? true : !s)) {
                    console.log(`[${i + 1}/${classes.length}] Updating ${comparingClass.code} (waitlisting)`);
                } else if (dbClass && dbClass.associatedClasses.length > 0) {
                    console.log(`[${i + 1}/${classes.length}] Updating ${comparingClass.code} (associated classes)`);
                } else {
                    console.log(`[${i + 1}/${classes.length}] Updating ${comparingClass.code} (something's changed)`);
                }
                if (!dbClass || comparingClass.instructor.name !== dbClass.instructor.name) {
                    db.classes[dbClassIndex] = await backoffRetryer(comparingClass.load);
                }  else {
                    db.classes[dbClassIndex] = await backoffRetryer(comparingClass.load.bind(null, dbClass.instructor));
                }
            }

            /*if (i % 50 === 0) {
                console.log("checking export...");
                tempDB.classes = db.classes;
                tempDB.history.clear();
                if (existsSync("../public/db/tmpdb.yaucsccs")) {
                    unlinkSync("../public/db/tmpdb.yaucsccs");
                }
                writeFileSync(__dirname + "/../public/db/tmpdb.yaucsccs", Buffer.from(tempDB.export()));
            }*/
        }

        if (changed) {
            console.log("writing changes to database...");
            writeFileSync(__dirname + `/../public/db/${term}.yaucsccs`, Buffer.from(db.export()));
        } else {
            console.log("no changes detected");
        }
    } else {
        // create database from scratch
        console.log("no database found, creating it...");
        let tempDB = new DB(term);

        let detailedClasses: Class[] = [];
        for (let i = 0; i < classes.length; i++) {
            console.log(`[${i + 1}/${classes.length}] Getting details for ${classes[i].code}`)
            detailedClasses.push(await backoffRetryer(classes[i].load));
            if (i % 10 === 0) {
                console.log("checking export...");
                tempDB.classes = detailedClasses;
                tempDB.history.clear();
                if (existsSync("../public/db/tmpdb.yaucsccs")) {
                    unlinkSync("../public/db/tmpdb.yaucsccs");
                }
                writeFileSync(__dirname + "/../public/db/tmpdb.yaucsccs", Buffer.from(tempDB.export()));
            }
        }
        
        let db = new DB(term);
        db.classes = detailedClasses;

        writeFileSync(__dirname + `/../public/db/${term}.yaucsccs`, Buffer.from(db.export()));
    }
}

main()