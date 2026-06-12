export enum Day {
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday
}

export const DAY_NAMES = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday"
];

export interface RawMeetingInfo {
    dayAndTime?: string;
    location?: string;
    dates?: string;
}

export interface ParsedMeetingInfo {
    days: Day[];
    startTime: number;
    endTime: number;
    location: string;
    dates: string;
}

function parseTime(timeText: string) {
    return new Date("1/1/1970 " + timeText.replace("A", " A").replace("P", " P")).getTime();
}

export class MeetingInfos {
    infos: ParsedMeetingInfo[];

    constructor(infos: ParsedMeetingInfo[]) {
        this.infos = infos;
    }

    static parse(infos: RawMeetingInfo[] = []) {
        let outputInfos: ParsedMeetingInfo[] = [];

        for (let i = 0; i < infos.length; i++) {
            let [daysText, times] = (infos[i].dayAndTime || "").split(" ");
            if (!times) continue;

            let [startTime, endTime] = times.split("-").map(parseTime);
            let days: Day[] = [];

            if (daysText.includes("M")) days.push(Day.Monday);
            if (daysText.includes("Tu")) days.push(Day.Tuesday);
            if (daysText.includes("W")) days.push(Day.Wednesday);
            if (daysText.includes("Th")) days.push(Day.Thursday);
            if (daysText.includes("F")) days.push(Day.Friday);

            outputInfos.push({
                days,
                startTime,
                endTime,
                location: infos[i].location || "",
                dates: infos[i].dates || ""
            });
        }

        return new MeetingInfos(outputInfos);
    }

    checkOverlap(a: MeetingInfos) {
        for (let i = 0; i < this.infos.length; i++) {
            for (let j = 0; j < a.infos.length; j++) {
                if (this.infos[i].days.some(x => a.infos[j].days.includes(x))) {
                    if (this.infos[i].startTime < a.infos[j].endTime && this.infos[i].endTime > a.infos[j].startTime) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    checkVicinity(a: MeetingInfos, margin: number) {
        for (let i = 0; i < this.infos.length; i++) {
            for (let j = 0; j < a.infos.length; j++) {
                if (this.infos[i].days.some(x => a.infos[j].days.includes(x))) {
                    if (this.infos[i].startTime < a.infos[j].endTime + margin && this.infos[i].endTime > a.infos[j].startTime - margin) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
}

export function matchesMeetingFilters(
    meetingInfos: RawMeetingInfo[],
    filters: { days: string[]; startTime: number|null; endTime: number|null; }
) {
    let hasFilters = filters.days.length > 0 || filters.startTime !== null || filters.endTime !== null;
    if (!hasFilters) return true;

    let parsed = MeetingInfos.parse(meetingInfos);
    if (parsed.infos.length === 0) return false;

    let classDays = new Set(parsed.infos.flatMap(info => info.days.map(day => DAY_NAMES[day])));
    if (filters.days.length > 0 && !filters.days.every(day => classDays.has(day))) {
        return false;
    }

    return parsed.infos.every(info => {
        if (filters.startTime !== null && info.startTime < filters.startTime) {
            return false;
        }

        if (filters.endTime !== null && info.endTime > filters.endTime) {
            return false;
        }

        return true;
    });
}

export function formatFilterTime(time: number|null) {
    if (time === null) return "Any time";

    return new Date(time)
        .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        .replace(":00", "");
}
