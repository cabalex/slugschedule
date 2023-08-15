import axios from "axios";
import * as cheerio from 'cheerio';
import getClassDetails from "./detail";
import { Class, ClassStatus, InstructionMode, Instructor } from "../db/DB";

const ENDPOINT = "https://pisa.ucsc.edu/cs9/prd/sr9_2013/index.php";
const CURRENT_TERM = 2238;

type Subject =
    "ANTH" |
    "APLX" |
    "AM" |
    "ARBC" |
    "ART" |
    "ARTG" |
    "ASTR" |
    "BIOC" |
    "BIOL" |
    "BIOE" |
    "BME" |
    "CRSN" |
    "CHEM" |
    "CHIN" |
    "CSP" |
    "CLNI" |
    "CMMU" |
    "CMPM" |
    "CSE" |
    "COWL" |
    "CRES" |
    "CRWN" |
    "DANM" |
    "EART" |
    "ECON" |
    "EDUC" |
    "ECE" |
    "ESCI" |
    "ENVS" |
    "FMST" |
    "FILM" |
    "FREN" |
    "GAME" |
    "GERM" |
    "GCH" |
    "GRAD" |
    "GREE" |
    "HEBR" |
    "HIS" |
    "HAVC" |
    "HISC" |
    "HCI" |
    "HUMN" |
    "ITAL" |
    "JAPN" |
    "JRLC" |
    "KRSG" |
    "LAAD" |
    "LATN" |
    "LALS" |
    "LGST" |
    "LING" |
    "LIT" |
    "MATH" |
    "MERR" |
    "METX" |
    "MUSC" |
    "NLP" |
    "OAKS" |
    "OCEA" |
    "PERS" |
    "PHIL" |
    "PBS" |
    "PHYE" |
    "PHYS" |
    "POLI" |
    "PRTR" |
    "PORT" |
    "PSYC" |
    "SCIC" |
    "SOCD" |
    "SOCY" |
    "SPAN" |
    "SPHS" |
    "STAT" |
    "STEV" |
    "TIM" |
    "THEA" |
    "UCDC" |
    "VAST" |
    "WRIT"


type GE = 
    "A" |
    "C" |
    "C1" |
    "C2" |
    "CC" |
    "E" |
    "ER" |
    "IH" |
    "IM" |
    "IN" |
    "IS" |
    "MF" |
    "PE-E" |
    "PE-H" |
    "PE-T" |
    "PR-C" |
    "PR-E" |
    "PR-S" |
    "Q" |
    "SI" |
    "SR" |
    "TA" |
    "TH" |
    "TN" |
    "TS" |
    "W" |
    "AnyGE"

enum MeetingTimes {
    "Morning" = "Morning",
    "Afternoon" = "Afternoon",
    "Evening" = "Evening",
    "08:00AM09:05AM" = "08:00AM09:05AM",
    "08:00AM09:35AM" = "08:00AM09:35AM",
    "09:20AM10:25AM" = "09:20AM10:25AM",
    "09:50AM11:25AM" = "09:50AM11:25AM",
    "10:40AM11:45AM" = "10:40AM11:45AM",
    "11:40AM01:15PM" = "11:40AM01:15PM",
    "12:00PM01:05PM" = "12:00PM01:05PM",
    "01:20PM02:25PM" = "01:20PM02:25PM",
    "01:30PM03:05PM" = "01:30PM03:05PM",
    "02:40PM03:45PM" = "02:40PM03:45PM",
    "03:20PM04:55PM" = "03:20PM04:55PM",
    "04:00PM05:05PM" = "04:00PM05:05PM",
    "05:20PM06:55PM" = "05:20PM06:55PM",
    "07:10PM08:45PM" = "07:10PM08:45PM",
    "08:00PM09:45PM" = "08:00PM09:45PM"
}
// meeting days is array
type MeetingDays = Array<"M"|"T"|"W"|"R"|"F"|"S"|"U">;

interface SearchOpts {
    term?: number,
    status?: "all"|"O"|"C",
    subject?: Subject,
    catalogNumber?: {
        operation: "="|"contains"|"<="|"=>",
        number: number,
    },
    title?: string,
    instructor?: {
        operation: "="|"contains"|"begins",
        name: string,
    },
    ge?: GE,
    courseUnits?: {
        operation: "="|"between",
        from?: number,
        to?: number,
        exact?: number,
    },
    days?: MeetingDays,
    times?: MeetingTimes,
    courseCareer?: "UGRAD"|"GRAD",
    classTypes?: {
        asyncOnline?: boolean,
        hybrid?: boolean,
        syncOnline?: boolean,
        inPerson?: boolean
    },
    resultsStart?: number,
    results?: number,
}



export interface PartialClass {
    code: string;
    name: string;
    number: number;
    details: {
        instructionMode: InstructionMode;
    }
    availability: {
        status: ClassStatus;
        enrolled: number;
        capacity: number;
    }
    meetingInfo: {
        location: string;
        dayAndTime: string;
    }
    instructor: {
        name: string;
    }
    load: (instructorInfo?: Instructor) => Promise<Class>;
}

export default async function search(
    opts: SearchOpts
): Promise<PartialClass[]> {
    // compile request
    let formData = {
        "action": "results",
        "binds[:term]": opts.term || CURRENT_TERM,
        "binds[:reg_status]": opts.status || "all",
        "binds[:subject]": opts.subject || "",
        "binds[:catalog_nbr_op]": opts.catalogNumber?.operation || "=",
        "binds[:catalog_nbr]": opts.catalogNumber?.number !== undefined ? opts.catalogNumber?.number : "",
        "binds[:title]": opts.title || "",
        "binds[:instr_name_op]": opts.instructor?.operation || "=",
        "binds[:instructor]": opts.instructor?.name || "",
        "binds[:ge]": opts.ge || "",
        "binds[:crse_units_op]": opts.courseUnits?.operation || "=",
        "binds[:crse_units_from]": opts.courseUnits?.from !== undefined ? opts.courseUnits?.from : "",
        "binds[:crse_units_to]": opts.courseUnits?.to !== undefined ? opts.courseUnits?.to : "",
        "binds[:crse_units_exact]": opts.courseUnits?.exact !== undefined ? opts.courseUnits?.exact : "",
        "binds[:days]": (opts.days || []).join(""),
        "binds[:times]": opts.times || "",
        "binds[:acad_career]": opts.courseCareer || "",
    }

    if (opts.classTypes?.asyncOnline) {
        formData["binds[:asynch]"] = "A";
    }
    if (opts.classTypes?.hybrid) {
        formData["binds[:hybrid]"] = "H";
    }
    if (opts.classTypes?.syncOnline) {
        formData["binds[:synch]"] = "S";
    }
    if (opts.classTypes?.inPerson) {
        formData["binds[:person]"] = "P";
    }
    if (opts.resultsStart !== undefined) {
        formData["rec_start"] = opts.resultsStart;
    }
    if (opts.results !== undefined) {
        formData["rec_dur"] = opts.results;
    }

    let resp = await axios.post(ENDPOINT, formData, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    })

    if (resp.status !== 200) {
        throw new Error("Request failed");
    }

    let $ = cheerio.load(resp.data);

    function scrapeClass(i, el): PartialClass {
        let find = (selector) => $(el).find(selector);

        let [code, name] = find('h2 a').text()
            .split(/\u00A0\u00A0\u00A0/g)
            .map(s => s.trim())

        let location = find('.panel-body .row > div:nth-child(3) > div:nth-child(1)').text()
            .replace("Location:", "")
            .trim()

        let dayAndTime = find('.panel-body .row > div:nth-child(3) > div:nth-child(2)').text()
            .replace("Day and Time:", "")
            .trim()
        
        let [enrolled, capacity] = find('.panel-body .row > div:nth-child(4)').text()
            .replace(" Enrolled", "")
            .split(" of ")
            .map(s => parseInt(s.trim()))
        
        let classDetailUrl = find('h2 a').attr("href");
        let load = () => { throw new Error("No details to show") };
        if (classDetailUrl) {
            load = getClassDetails.bind(null, ENDPOINT.replace("index.php", "") + classDetailUrl);
        }

        let status = ClassStatus.Closed;
        switch(find('h2 img').attr("title")) {
            case "Open":
                status = ClassStatus.Open;
                break;
            case "Closed with Wait List":
                status = ClassStatus.Waitlist;
                break;
        }

        return {
            code,
            name,
            number: parseInt(find('.panel-body .row > div:nth-child(1) a').text().trim()),
            details: {
                instructionMode: $(el).find('.hide-print b').text().trim() as InstructionMode,
            },
            availability: {
                status,
                enrolled,
                capacity
            },
            meetingInfo: {
                location,
                dayAndTime
            },
            instructor: {
                name: find('.panel-body .row > div:nth-child(2)').text().split(":")[1].trim()
            },
            load
        }
    }

    let classes = $(".panel.panel-default.row").map(scrapeClass).toArray();

    return classes;
}