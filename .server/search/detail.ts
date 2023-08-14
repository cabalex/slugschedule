import axios from "axios";
import * as cheerio from 'cheerio';
import searchRMP from "../ratemyprofessor/search";
import { AssociatedClass, Class, ClassStatus, InstructionMode, Instructor } from "../db/DB";



export default async function getClassDetails(classUrl: string, existingRMPInfo?: any): Promise<Class> {
    let resp = await axios.get(classUrl);

    if (resp.status !== 200) {
        throw new Error("Could not get class details");
    }

    let $ = cheerio.load(resp.data);

    let [code, name] = $('.col-xs-12 > h2').text()
            .split(/\u00A0\u00A0 /g)
            .map(s => s.trim())
    

    // class details
    let [career, grading, number, type, instructionMode, credits, generalEducation]
        = $('.panel.panel-default.row:nth-child(1) > .panel-body > .row > div:nth-child(1) dd')
        .map((i, el) => $(el).text().trim())
    
    let [status, available, capacity, enrolled, waitlistCapacity, waitlist]
        = $(`.panel.panel-default.row:nth-child(1) > .panel-body > .row > div:nth-child(2) dd`)
        .map((i, el) => {
            if (i === 0) return $(el).find('img').attr('title');
            return parseInt($(el).text().trim())
        });
    
    // combined sections
    let i = 2;
    let combinedSections: number[] = [];
    if ($(`.panel.panel-default.row:nth-child(2)`).text().includes("Combined Sections")) {
        combinedSections = $('.panel.panel-default.row:nth-child(2) > .panel-body a')
            .map((i, el) => parseInt($(el).text()))
            .toArray();
        
        // if this class is combined, then the available seats stat counts for both???
        // so we need to recheck it here
        let index = combinedSections.findIndex(n => n === parseInt(number));
        if (index !== -1) {
            let [classText, titleText, statusDC, capacityText, enrolledText, waitlistText] = $(`.panel.panel-default.row:nth-child(2) > .panel-body tr:nth-child(${index + 2}) td`)
                .map((i, el) => $(el).text().trim())
                .toArray();
            capacity = parseInt(capacityText);
            enrolled = parseInt(enrolledText);
            waitlist = parseInt(waitlistText);
            status = statusDC;
        }
        i++;
    }

    // description
    let description = $(`.panel.panel-default.row:nth-child(${i}) > .panel-body`).text().trim();
    i++;
    
    // enrollment requirements
    let enrollmentRequirements = "";
    if ($(`.panel.panel-default.row:nth-child(${i})`).text().includes("Enrollment Requirements")) {
        enrollmentRequirements = $(`.panel.panel-default.row:nth-child(${i}) > .panel-body`).text().trim();
        i++;
    }
    
    // class notes
    let classNotes = "";
    if ($(`.panel.panel-default.row:nth-child(${i})`).text().includes("Class Notes")) {
        classNotes = $(`.panel.panel-default.row:nth-child(${i}) > .panel-body`).text().trim();
        i++;
    }
    
    // meeting info
    let dayAndTime = "", location = "", instructor = "", dates = "", start = "", end = "";
    if ($(`.panel.panel-default.row:nth-child(${i})`).text().includes("Meeting Information")) {
        [dayAndTime, location, instructor, dates] = $(`.panel.panel-default.row:nth-child(${i}) td`)
            .map((i, el) => $(el).text().trim());
        i++;
    }

    // associated discussion sections or labs
    let associatedClasses: AssociatedClass[] = [];
    if ($(`.panel.panel-default.row:nth-child(${i})`).text().includes("Associated Discussion Sections or Labs")) {
        associatedClasses = $(`.panel.panel-default.row:nth-child(${i}) > .panel-body > .row`)
            .map((i, el) => {
                let [numberAndCode, dayAndTime, instructor, locationText, enrolledText, waitText, discardedStatus] = $(el).find('div')
                    .map((i, el) => $(el).text().trim());
                let [match1, numberText, code] = /#([0-9]+) (.+)/g.exec(numberAndCode) || ["-1", "Error"];
                let location = locationText.split(":")[1].trim();
                let [match2, enrolled, capacity] = /Enrl\: ([0-9]+) \/ ([0-9]+)/g.exec(enrolledText) || ["-1", "-1"];
                let [match3, waitlist, waitlistCapacity] = /Wait\: ([0-9]+) \/ ([0-9]+)/g.exec(waitText) || ["-1", "-1"];
                let status = $(el).find('img').attr('title') || "";

                return {
                    number: parseInt(numberText),
                    code,
                    availability: {
                        status: status === "Open" ? ClassStatus.Open : status === "Closed with Wait List" ? ClassStatus.Waitlist : ClassStatus.Closed,
                        enrolled: parseInt(enrolled),
                        capacity: parseInt(capacity),
                        waitlist: parseInt(waitlist),
                        waitlistCapacity: parseInt(waitlistCapacity)
                    },
                    meetingInfo: {
                        dayAndTime,
                        instructor,
                        location
                    }
                }
            })
            .toArray()
    }
    
    let rateMyProfessor = existingRMPInfo; 
    if (instructor && instructor !== "Staff" && !existingRMPInfo)
        rateMyProfessor = await searchRMP(instructor, code) as any;

    return {
        code,
        name,
        number: parseInt(number),
        details: {
            undergraduate: career === "Undergraduate",
            grading: grading as any,
            type,
            instructionMode: instructionMode as InstructionMode,
            credits: parseInt(credits.replace(" Credits", "")),
            generalEducation: generalEducation.split(" ")
        },
        availability: {
            status: status === "Open" ? ClassStatus.Open : status === "Closed with Wait List" ? ClassStatus.Waitlist : ClassStatus.Closed,
            enrolled: enrolled as number,
            capacity: capacity as number,
            waitlist: waitlist as number,
            waitlistCapacity: waitlistCapacity as number
        },
        meetingInfo: {
            dayAndTime,
            location,
            dates
        },
        combinedSections,
        instructor: {
            ...rateMyProfessor as any,
            name: instructor
        },
        description,
        enrollmentRequirements,
        classNotes,
        associatedClasses
    }
}