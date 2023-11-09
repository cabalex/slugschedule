export type InstructionMode = "In Person"|"Synchronous Online"|"Asynchronous Online"|"Hybrid"
export enum ClassStatus {
    "Open",
    "Waitlist",
    "Closed"
}

export interface Class {
    code: string;
    name: string;
    number: number;
    details: {
        undergraduate: boolean;
        grading: string;
        type: string;
        instructionMode: InstructionMode;
        credits: number;
        generalEducation: Array<string>;
    }
    availability: {
        status: ClassStatus;
        enrolled: number;
        capacity: number;
        waitlist: number;
        waitlistCapacity: number;
    }
    combinedSections: Array<number>;
    meetingInfos: Array<{
        dayAndTime: string;
        location: string;
        dates: string;
    }>
    instructor: Instructor,
    description: string;
    enrollmentRequirements: string;
    classNotes: string;
    associatedClasses: Array<AssociatedClass>
}

export interface Instructor {
    id: string;
    name: string;
    avgDifficulty?: number;
    avgRating?: number;
    ratings?: [number, number, number, number, number];
    numRatings?: number;
    wouldTakeAgainPercent?: number;
    reviews?: TeacherRating[];
}

export interface TeacherRating {
    class: string;
    postedAt: number;
    difficultyRating: number;
    rating: number;
    likes: number;
    dislikes: number;
    wouldTakeAgain: boolean;
    credit: boolean;
    online: boolean;
    attendance: boolean;
    comment: string,
    tags: string;
    related: boolean;
}

export interface AssociatedClass {
    code: string;
    number: number;
    availability: {
        status: ClassStatus;
        enrolled: number;
        capacity: number;
        waitlist: number;
        waitlistCapacity: number;
    }
    meetingInfo: {
        dayAndTime: string;
        location: string;
        instructor: string;
    }
}

interface HistoryRecord {
    classNumber: number;
    status: ClassStatus;
    enrolled: number;
    capacity: number;
    waitlist: number;
    waitlistCapacity: number;
}

function concat(...bufs: ArrayBuffer[]) {
    let len = 0;
    for (let b of bufs) len += b.byteLength;
    let buf = new Uint8Array(len);
    let offset = 0;
    for (let b of bufs) {
        buf.set(new Uint8Array(b), offset);
        offset += b.byteLength;
    }
    return buf.buffer;
}

// This is a really quick and dirty way to compress things into a
// custom byte format. This class is used in both the backend and frontend
// so that both sides can unpack/repack it.

const VERSION = 3;

export default class DB {
    version = VERSION;
    term: number;
    classes: Class[] = [];
    // each snapshot has its own time and array of records
    history: Map<number, HistoryRecord[]> = new Map();

    constructor(term: number) {
        this.term = term;
    }

    get lastUpdate() {
        return [...this.history.keys()].sort((a, b) => b - a)[0];
    }

    getClassByNumber(num: number) {
        for (let i = 0; i < this.classes.length; i++) {
            if (this.classes[i].number === num) return this.classes[i];
            if (this.classes[i].associatedClasses) {
                for (let j = 0; j < this.classes[i].associatedClasses.length; j++) {
                    if (this.classes[i].associatedClasses[j].number === num)
                        return {
                            ...this.classes[i].associatedClasses[j],
                            rootClass: this.classes[i]
                        }
                }
            }
        }
    }

    takeSnapshot() {
        let time = Date.now();
        let records: HistoryRecord[] = [];
        let newSaves = 0;
        
        // We only want to store changes to the class's state.
        // Thus, we check the previous records and ensure they are different before adding them.
        let reverseChronologicalRecords = [...this.history.keys()].sort((a, b) => b - a);
        let lastStoredRecords: Map<number, HistoryRecord> = new Map();
        for (let i = 0; i < reverseChronologicalRecords.length; i++) {
            let t = reverseChronologicalRecords[i];
            let r = this.history.get(t) || [];
            for (let rec of r) {
                if (!lastStoredRecords.has(rec.classNumber)) {
                    lastStoredRecords.set(rec.classNumber, rec);
                }
            }
            if (lastStoredRecords.size === this.classes.length) break;
        }
        for (let c of this.classes) {
            let record = {
                classNumber: c.number,
                status: c.availability.status,
                enrolled: c.availability.enrolled,
                capacity: c.availability.capacity,
                waitlist: c.availability.waitlist,
                waitlistCapacity: c.availability.waitlistCapacity
            };
            
            let lastStoredRecord = lastStoredRecords.get(c.number);
            if (!lastStoredRecord ||
                record.status !== lastStoredRecord.status ||
                record.enrolled !== lastStoredRecord.enrolled ||
                record.capacity !== lastStoredRecord.capacity ||
                record.waitlist !== lastStoredRecord.waitlist ||
                record.waitlistCapacity !== lastStoredRecord.waitlistCapacity) {
                records.push(record);
                newSaves++;
            }

            for (let ac of c.associatedClasses) {
                record = {
                    classNumber: ac.number,
                    status: ac.availability.status,
                    enrolled: ac.availability.enrolled,
                    capacity: ac.availability.capacity,
                    waitlist: ac.availability.waitlist,
                    waitlistCapacity: ac.availability.waitlistCapacity
                };
                let lastStoredRecord = lastStoredRecords.get(ac.number);
                if (!lastStoredRecord ||
                    record.status !== lastStoredRecord.status ||
                    record.enrolled !== lastStoredRecord.enrolled ||
                    record.capacity !== lastStoredRecord.capacity ||
                    record.waitlist !== lastStoredRecord.waitlist ||
                    record.waitlistCapacity !== lastStoredRecord.waitlistCapacity) {
                    records.push(record);
                    newSaves++;
                }
            }
        }
        this.history.set(time, records);
        console.log(`Took snapshot at ${time} with ${newSaves} new saves`);
    }

    export() {
        // will repack as new version
        this.version = VERSION;
        console.log("Taking class snapshot...")
        this.takeSnapshot();
        console.log("Exporting file...")
        let encoder = new TextEncoder();
        function packValue(v: any, force32Bit=false) {
            if (v === undefined || v === null || (typeof v !== "string" && isNaN(v))) throw new Error(`Cannot pack undefined/null object ${v.toString()}`);
            switch(typeof v) {
                case "string":
                    let encoding = encoder.encode(v);
                    return concat(Uint16Array.from([encoding.byteLength]).buffer, encoding.buffer);
                case "number":
                    return force32Bit ? Int32Array.from([Math.round(v)]).buffer : Int16Array.from([Math.round(v)]).buffer;
                case "boolean":
                    return Uint8Array.from([v ? 1 : 0]).buffer;
                default:
                    throw new Error("Cannot pack unknown type");
            }
        }
    
        let bufs: ArrayBuffer[] = [
            encoder.encode("UCSC"),
            packValue(this.version),
            packValue(this.term),
            packValue(this.classes.length)
        ];
        for (let c of this.classes) {
            let buf = new ArrayBuffer(0);
            buf = concat(buf, packValue(c.code));
            buf = concat(buf, packValue(c.name));
            buf = concat(buf, packValue(c.number, true));
            buf = concat(buf, packValue(c.details.undergraduate));
            buf = concat(buf, packValue(c.details.grading));
            buf = concat(buf, packValue(c.details.type));
            buf = concat(buf, packValue(c.details.instructionMode));
            buf = concat(buf, packValue(c.details.credits));
            buf = concat(buf, packValue(c.details.generalEducation.join(" ")));
            buf = concat(buf, packValue(c.availability.status));
            buf = concat(buf, packValue(c.availability.enrolled));
            buf = concat(buf, packValue(c.availability.capacity));
            buf = concat(buf, packValue(c.availability.waitlist));
            buf = concat(buf, packValue(c.availability.waitlistCapacity));

            // Meeting info
            buf = concat(buf, packValue(c.meetingInfos.length));
            for (let m of c.meetingInfos) {
                buf = concat(buf, packValue(m.dayAndTime));
                buf = concat(buf, packValue(m.location));
                buf = concat(buf, packValue(m.dates));
            }

            buf = concat(buf, packValue(c.description));
            buf = concat(buf, packValue(c.enrollmentRequirements));
            buf = concat(buf, packValue(c.classNotes));

            // Instructors
            buf = concat(buf, packValue(c.instructor.name));
            buf = concat(buf, packValue(c.instructor.id?.toString() || "-1"));
            // If RMP supported
            if (c.instructor.id && c.instructor.id !== "-1") {
                buf = concat(buf, packValue((c.instructor?.avgDifficulty || 0) * 10));
                buf = concat(buf, packValue((c.instructor?.avgRating || 0) * 10));
                buf = concat(buf, Uint8Array.from(c.instructor.ratings || []).buffer);
                buf = concat(buf, packValue(c.instructor.numRatings));
                buf = concat(buf, packValue(c.instructor.wouldTakeAgainPercent));
                
                buf = concat(buf, packValue(c.instructor.reviews?.length));
                for (let review of c.instructor?.reviews || []) {
                    buf = concat(buf, packValue(review.class));
                    buf = concat(buf, Uint32Array.from([review.postedAt / 1000]).buffer);
                    buf = concat(buf, packValue(review.difficultyRating));
                    buf = concat(buf, packValue(review.rating));
                    buf = concat(buf, packValue(review.likes));
                    buf = concat(buf, packValue(review.dislikes));
                    buf = concat(buf, packValue(review.wouldTakeAgain));
                    buf = concat(buf, packValue(review.credit));
                    buf = concat(buf, packValue(review.online));
                    buf = concat(buf, packValue(review.attendance));
                    buf = concat(buf, packValue(review.comment));
                    buf = concat(buf, packValue(review.tags));
                    buf = concat(buf, packValue(review.related));
                }
            }

            // Combined Sections
            buf = concat(buf, packValue(c.combinedSections.length));
            for (let cs of c.combinedSections) {
                buf = concat(buf, packValue(cs));
            }
            
            // associated classes
            buf = concat(buf, packValue(c.associatedClasses.length));
            for (let associatedClass of c.associatedClasses) {
                buf = concat(buf, packValue(associatedClass.code));
                buf = concat(buf, packValue(associatedClass.number, true));
                buf = concat(buf, packValue(associatedClass.availability.status));
                buf = concat(buf, packValue(associatedClass.availability.enrolled));
                buf = concat(buf, packValue(associatedClass.availability.capacity));
                buf = concat(buf, packValue(associatedClass.availability.waitlist));
                buf = concat(buf, packValue(associatedClass.availability.waitlistCapacity));
                buf = concat(buf, packValue(associatedClass.meetingInfo.dayAndTime));
                buf = concat(buf, packValue(associatedClass.meetingInfo.location));
                buf = concat(buf, packValue(associatedClass.meetingInfo.instructor));
            }
            bufs.push(buf);
        }

        // history records
        let historyKeys = [...this.history.keys()].sort((a, b) => a - b);

        bufs.push(packValue(historyKeys.length)); // length
        historyKeys.forEach((key) => {
            let value = this.history.get(key) || [];
            let buf = Uint32Array.from([key / 1000]).buffer;
            buf = concat(buf, packValue(value.length)); // records in this snapshot
            for (let record of value) {
                buf = concat(buf, packValue(record.classNumber, true));
                buf = concat(buf, packValue(record.status));
                buf = concat(buf, packValue(record.enrolled));
                buf = concat(buf, packValue(record.capacity));
                buf = concat(buf, packValue(record.waitlist));
                buf = concat(buf, packValue(record.waitlistCapacity));
            }
            bufs.push(buf);
        })
    
        console.log("Success!")
        return concat(...bufs);
    }

    static import(arrayBuffer: ArrayBuffer) {
        console.log(`Reading database, ${arrayBuffer.byteLength} bytes...`)
        let dataView = new DataView(arrayBuffer);
        let decoder = new TextDecoder();
        let offset = 4;
        
        function unpackValue(mode: "string") : string
        function unpackValue(mode: "number") : number
        function unpackValue(mode: "uint32") : number
        function unpackValue(mode: "boolean") : boolean
        function unpackValue(mode: "string" | "uint32" | "number" | "boolean") : string | number | boolean {
            switch(mode) {
                case "string":
                    let length = dataView.getUint16(offset, true);
                    let text = decoder.decode(new Uint8Array(arrayBuffer, offset + 2, length));
                    offset += 2 + length;
                    return text;
                case "number":
                    let number = dataView.getInt16(offset, true);
                    offset += 2;
                    return number;
                case "uint32":
                    // Technically dates should be Uint64, due to the 2038 problem...
                    // But whatever, I'm probably not going to be at this school in 2038
                    let uint32 = dataView.getUint32(offset, true);
                    offset += 4;
                    return uint32;
                case "boolean":
                    let bool = dataView.getUint8(offset) === 1;
                    offset += 1;
                    return bool;
                default:
                    throw new Error("Cannot pack unknown type");
            }
        }

        let version = unpackValue("number");
        let term = unpackValue("number");
        let classCount = unpackValue("number");
        console.log(`Version ${version}, term ${term}, ${classCount} classes`)

        let classes: Class[] = [];
        for (let i = 0; i < classCount; i++) {
            let c: Class = {
                code: unpackValue("string"),
                name: unpackValue("string"),
                number: version >= 3 ? unpackValue("uint32") : unpackValue("number"),
                details: {
                    undergraduate: unpackValue("boolean"),
                    grading: unpackValue("string"),
                    type: unpackValue("string"),
                    instructionMode: unpackValue("string") as InstructionMode,
                    credits: unpackValue("number"),
                    generalEducation: unpackValue("string").split(" ")
                },
                availability: {
                    status: unpackValue("number") as ClassStatus,
                    enrolled: unpackValue("number"),
                    capacity: unpackValue("number"),
                    waitlist: unpackValue("number"),
                    waitlistCapacity: unpackValue("number")
                },
                // Meeting info turned into an array in v2
                meetingInfos: version === 1 ?
                        [{
                            dayAndTime: unpackValue("string"),
                            location: unpackValue("string"),
                            dates: unpackValue("string")
                        }] :
                        new Array(unpackValue("number")).fill(null).map(x => {
                            return {
                                dayAndTime: unpackValue("string"),
                                location: unpackValue("string"),
                                dates: unpackValue("string")
                            }
                        }),
                description: unpackValue("string"),
                enrollmentRequirements: unpackValue("string"),
                classNotes: unpackValue("string"),
                combinedSections: [],
                instructor: {
                    name: unpackValue("string"),
                    id: unpackValue("string")
                },
                associatedClasses: []
            }

            if (parseInt(c.instructor.id) !== -1) {
                // rate my professor score exists
                c.instructor.avgDifficulty = unpackValue("number") / 10;
                c.instructor.avgRating = unpackValue("number") / 10;
                c.instructor.ratings = Array.from(new Uint8Array(arrayBuffer, offset, 5)) as any;
                offset += 5;
                c.instructor.numRatings = unpackValue("number");
                c.instructor.wouldTakeAgainPercent = unpackValue("number");
                let reviewCount = unpackValue("number");
                c.instructor.reviews = [];
                for (let j = 0; j < reviewCount; j++) {
                    c.instructor.reviews.push({
                        class: unpackValue("string"),
                        postedAt: unpackValue("uint32") * 1000,
                        difficultyRating: unpackValue("number"),
                        rating: unpackValue("number"),
                        likes: unpackValue("number"),
                        dislikes: unpackValue("number"),
                        wouldTakeAgain: unpackValue("boolean"),
                        credit: unpackValue("boolean"),
                        online: unpackValue("boolean"),
                        attendance: unpackValue("boolean"),
                        comment: unpackValue("string"),
                        tags: unpackValue("string"),
                        related: unpackValue("boolean")
                    });
                }
            }

            // combined sections
            let combinedSectionCount = unpackValue("number");
            for (let j = 0; j < combinedSectionCount; j++) {
                c.combinedSections.push(unpackValue("number"))
            }

            // associated classes
            let associatedClassCount = unpackValue("number");
            for (let j = 0; j < associatedClassCount; j++) {
                c.associatedClasses.push({
                    code: unpackValue("string"),
                    number: version >= 3 ? unpackValue("uint32") : unpackValue("number"),
                    availability: {
                        status: unpackValue("number") as ClassStatus,
                        enrolled: unpackValue("number"),
                        capacity: unpackValue("number"),
                        waitlist: unpackValue("number"),
                        waitlistCapacity: unpackValue("number")
                    },
                    meetingInfo: {
                        dayAndTime: unpackValue("string"),
                        location: unpackValue("string"),
                        instructor: unpackValue("string")
                    }
                });
            }

            classes.push(c);
        }

        let db = new DB(term);
        db.version = 2;
        db.classes = classes;

        // history
        let snapshotCount = unpackValue("number");
        for (let i = 0; i < snapshotCount; i++) {
            let time = unpackValue("uint32");
            let recordCount = unpackValue("number");

            let history: HistoryRecord[] = [];
            for (let j = 0; j < recordCount; j++) {
                history.push({
                    classNumber: version >= 3 ? unpackValue("uint32") : unpackValue("number"),
                    status: unpackValue("number") as ClassStatus,
                    enrolled: unpackValue("number"),
                    capacity: unpackValue("number"),
                    waitlist: unpackValue("number"),
                    waitlistCapacity: unpackValue("number")
                });
            }

            db.history.set(time * 1000, history);
        }

        
        return db;
    }
}