<script lang="ts">
    import { createEvents, type EventAttributes} from "ics";
    import QrCode from "svelte-qrcode"
    import { fade, slide } from "svelte/transition";
    
    import Close from "svelte-material-icons/Close.svelte";
    import ContentCopy from "svelte-material-icons/ContentCopy.svelte";
    import TrayArrowUp from "svelte-material-icons/TrayArrowUp.svelte";
    import CalendarExport from "svelte-material-icons/CalendarExport.svelte";

    import { db } from "../mainStore";
    import { MeetingInfos } from "./DateChecker.svelte";

    export let url = "";
    export let headerText = "Share this URL";
    export let onClose = () => {};
    export let classes: number[] = [];

    // For calendar export
    export const filename = 'schedule.ics';

    let calendarDownloaded = false;

    function copy(e) {
        navigator.clipboard.writeText(url);
        
        e.target.style.outline = "1px solid var(--success)";
        setTimeout(() => {
            e.target.style.outline = "";
        }, 1000);
    }

    function createCalendar() {
        const events = [];

        for (let scheduledClassNumber of classes) {
            let scheduledClass = $db.getClassByNumber(scheduledClassNumber);
            let meetingInfos = MeetingInfos.parse(scheduledClass.meetingInfos || [scheduledClass.meetingInfo]);
            for (let i = 0; i < meetingInfos.infos.length; i++) {
                let info = meetingInfos.infos[i];

                let dates = info.dates;

                if (dates === undefined) {
                    // get dates of root class
                    dates = scheduledClass.rootClass.meetingInfos[0].dates;
                }

                // Ignore unset dates
                if (dates === "N/A") continue;

                // new Date() supports "MM/DD/YYYY", so we are fine
                const [TermStart, TermEnd] = dates.split(" - ").map(x => new Date(x));

                // Since many calendars exclude the last day, we need to have a "last day plus 1".
                TermEnd.setDate(TermEnd.getDate() + 1);

                for (let day of info.days) {
                    // returns the day that the first session of each section is
                    // days is 0-4 (mon-fri) while .getDate and stuff is 0-6 (Sun-Sat)
                    let weekDay = day + 1;
                    let classDate = new Date(TermStart);

                    if (weekDay >= TermStart.getDay()) {
                        classDate.setDate(TermStart.getDate() + (weekDay - TermStart.getDay()));
                    } else {
                        // In case this is a class that would have begun before the first class
                        // e.g. class starts on Wednesday, but this is a Monday section
                        classDate.setDate(TermStart.getDate() + (weekDay - TermStart.getDay()) + 7);
                    }

                    let sTime = new Date(info.startTime);
                    let eTime = new Date(info.endTime);

                    let event: EventAttributes = {
                        start: [
                            classDate.getFullYear(),
                            classDate.getMonth()+1,
                            classDate.getDate(),
                            sTime.getHours(),
                            sTime.getMinutes()
                        ],
                        end: [
                            classDate.getFullYear(),
                            classDate.getMonth()+1,
                            classDate.getDate(),
                            eTime.getHours(),
                            eTime.getMinutes()
                        ],
                        // specify local to ensure "floating" time (not fixed utc time)
                        // we want this so that we arent "compensating" for DST
                        startInputType: 'local',
                        startOutputType: 'local',
                        title: scheduledClass.rootClass ?
                            `${scheduledClass.code}: ${scheduledClass.rootClass.code} — ${scheduledClass.rootClass.name}` :
                            `${scheduledClass.code} — ${scheduledClass.name}`,
                        description: scheduledClass.rootClass ?
                            scheduledClass.rootClass.description :
                            scheduledClass.description,
                        location: meetingInfos.infos[0].location,
                        categories: [scheduledClass.code],
                        recurrenceRule: `FREQ=WEEKLY;INTERVAL=1;UNTIL=${TermEnd.getFullYear()}${String(TermEnd.getMonth()+1).padStart(2,"0")}${String(TermEnd.getDate()).padStart(2,"0")}`
                    }

                    events.push(event);
                }
            }
        }

        return events;
    }

    async function downloadICS() {
        let events = createCalendar();
        
        let file: File = await new Promise((resolve, reject) => {
            createEvents(events, (error, value) => {
                if (error) reject(error);
                resolve(new File([value], filename, {type: 'text/calendar'}));
            });
        });

        let url = URL.createObjectURL(file);

        let a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);

        calendarDownloaded = true;
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- needs to ignore because ... -->
<!-- switch to native html dialog/modal element ?  -->
<div class="modal" transition:fade={{duration: 100}} on:click={onClose}>
    <div class="modalInner" on:click={(e) => e.stopPropagation()}>
        <h2>{headerText}</h2>
        <button class="roundBtn closeBtn" on:click={onClose} aria-label="Close Modal">
            <Close size="1em" />
        </button>
        <div class="body">
            <div class="qrContainer">
                <QrCode value={url} />
            </div>
            <div class="text">
                <button on:click={copy}>
                    <ContentCopy size="1.25em" />
                    Copy link
                </button>
                <button on:click={() => navigator.share({url})}>
                    <TrayArrowUp size="1.25em" />
                    Share via...
                </button>
                <button on:click={downloadICS}>
                    <CalendarExport size="1.25em" />
                    Add to calendar
                </button>
            </div>
        </div>
        {#if calendarDownloaded}
        <div class="calendarInstructions" transition:slide={{duration: 100}}>
            <p style="text-align: center">.ICS downloaded! Here's how to add it to your calendar:</p>
            <ul>
                <li><b>Google Calendar:</b> <a target="_blank" rel="noopener noreferrer" href="https://calendar.google.com/calendar/u/0/r/settings/export">Click here,</a> then upload the ICS file. You may want to create a new calendar inside the app to import your ICS into.</li>
                <li><b>Outlook:</b> <a target="_blank" rel="noopener noreferrer" href="https://outlook.live.com/calendar/0/addcalendar">Click here</a>, select the "Upload from file" tab, and upload the ICS file.</li>
                <li><b>Other calendars:</b> Find the "Add a calendar" option to upload your ICS file. It may be under "Import" or "from a file".</li>
            </ul>
        </div>
        {/if}
    </div>
</div>

<style>
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;

        display: flex;
        justify-content: center;
        align-items: center;

        background-color: rgba(0, 0, 0, 0.5);
        z-index: 100;
    }
    .modalInner {
        max-width: 800px;
        max-height: 90%;
        overflow: auto;

        background-color: #333;
        border-radius: 10px;
        padding: 10px;
        position: relative;
    }
    .closeBtn {
        position: absolute;
        top: 10px;
        right: 10px;
    }
    .body {
        display: flex;
        justify-content: stretch;
        align-items: stretch;
        gap: 10px;
    }
    h2 {
        text-align: center;
    }
    .qrContainer {
        border-radius: 10px;
        padding: 10px;
        overflow: hidden;
        background-color: white;

        display: flex;
        justify-content: center;
        align-items: center;
    }
    .text {
        aspect-ratio: 1 / 1;
        width: 196px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 10px;
        border-radius: 10px;
        gap: 10px;
        border: 2px solid #555;
    }
    button {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: 10px;
    }
    .calendarInstructions {
        width: 450px;
        flex-shrink: 1;
    }
    @media screen and (max-width: 500px) {
        .body {
            flex-direction: column;
        }
        .closeBtn {
            display: none;
        }
        .calendarInstructions {
            width: 200px;
        }
    }
</style>