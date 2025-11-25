<script lang="ts">
    import MapMarker from "svelte-material-icons/MapMarker.svelte";
    import Monitor from "svelte-material-icons/Monitor.svelte";
    import CalendarRange from "svelte-material-icons/CalendarRange.svelte";
    import ClipboardCheck from "svelte-material-icons/ClipboardCheck.svelte";
    import HandCoin from "svelte-material-icons/HandCoin.svelte";
    import School from "svelte-material-icons/School.svelte";
    import OpenInNew from "svelte-material-icons/OpenInNew.svelte";
    import ArrowLeft from "svelte-material-icons/ArrowLeft.svelte";
    import Star from "svelte-material-icons/Star.svelte";
    import StarOutline from "svelte-material-icons/StarOutline.svelte";
    import ShareVariant from "svelte-material-icons/ShareVariant.svelte";

    import { type Class, ClassStatus } from "../../../.server/db/DB";
    import { home, db, focusedClass, starredClasses, liveUpdates, detectTerm } from "../../mainStore";
    import ClassWidget from "../../assets/ClassWidget.svelte";
    import DonutChart from "../../assets/DonutChart.svelte";
    import { rmpScoreColor } from "../../ListPanel/ClassItem/ClassItem.svelte";
    import Review from "./Review/Review.svelte";
    import Enrollment from "./Enrollment/Enrollment.svelte";
    import AssociatedClass from "../../assets/AssociatedClass.svelte";
    import DateChecker from "../../assets/DateChecker.svelte";
    import CopyClassNumber from "../../assets/CopyClassNumber.svelte";
    import ShareModal from "../../assets/ShareModal.svelte";
    import ClassesByCode from "../../assets/ClassesByCode.svelte";
    import GradeDistribution from "./GradeDistribution/GradeDistribution.svelte";
    import RichText from "../../assets/RichText.svelte";
    import { onDestroy, onMount } from "svelte";

    export let item: Class;

    let lastUpdate = $db?.lastUpdate ? new Date($db.lastUpdate) : new Date();
    async function updateClass() {
        const endpoint = `https://my.ucsc.edu/PSIGW/RESTListeningConnector/PSFT_CSPRD/SCX_CLASS_DETAIL.v1/${$db.term}/${item.number}`
        const res = await fetch(endpoint);
        if (res.ok) {
            const data = await res.json();
            // Assign new data to item
            item.name = data.primary_section.title_long
            item.description = data.primary_section.description
            if (data.notes) {
                item.classNotes = data.notes.join("\n\n")
            }
            const status = data.primary_section.enrl_status === "Open" ? ClassStatus.Open :
                data.primary_section.enrl_status === "Wait List" ? ClassStatus.Waitlist :
                ClassStatus.Closed;
            item.enrollmentRequirements = data.primary_section.requirements
            item.availability = {
                status,
                capacity: parseInt(data.primary_section.capacity),
                enrolled: parseInt(data.primary_section.enrl_total),
                waitlist: parseInt(data.primary_section.waitlist_total),
                waitlistCapacity: parseInt(data.primary_section.waitlist_capacity)
            }
            if (data.secondary_sections) {
                for (let secondarySection of data.secondary_sections) {
                    const index = item.associatedClasses.findIndex(x => x.number === parseInt(secondarySection.class_nbr));
                    if (index !== -1) {
                        const sectionStatus = secondarySection.enrl_status === "Open" ? ClassStatus.Open :
                            secondarySection.enrl_status === "Wait List" ? ClassStatus.Waitlist :
                            ClassStatus.Closed;
                        item.associatedClasses[index].availability = {
                            status: sectionStatus,
                            capacity: parseInt(secondarySection.capacity),
                            enrolled: parseInt(secondarySection.enrl_total),
                            waitlist: parseInt(secondarySection.waitlist_total),
                            waitlistCapacity: parseInt(secondarySection.waitlist_capacity)
                        }
                    }
                }
            }
            lastUpdate = new Date();
            console.log("Class data updated");
        } else {
            console.error("Failed to update class data");
        }
    }

    function printTerm(termNum: number): string {
        const year = "20" + termNum.toString().slice(1, 3);
        const quarterCode = termNum % 10;
        const quarterMap: { [key: number]: string } = {
            0: "Winter",
            2: "Spring",
            4: "Summer",
            8: "Fall"
        };
        return ` (${quarterMap[quarterCode]} ${year})`;
    }

    let updateInterval;
    onMount(() => {
        if (!$liveUpdates || $db.term !== detectTerm()) return;
        updateClass();
        updateInterval = setInterval(updateClass, 60 * 1000); // every minute
    })
    onDestroy(() => {
        clearInterval(updateInterval);
    })

    let sharebutton;
    function openModal() {
        shareOpen = true;
    }
    function closeModal() {
        shareOpen = false;
        sharebutton.focus();
    }
    function toggleStar(e) {
        e.stopPropagation();
        if ($starredClasses.includes(item.number)) {
            $starredClasses = $starredClasses.filter(x => x !== item.number);
        } else {
            $starredClasses = [...$starredClasses, item.number];
        }
    }
    let shareOpen = false;
    let location = item.meetingInfos.length ? item.meetingInfos[0].location : null;
    $: place =
        location &&
        location !== "Online" &&
        location !== "N/A" &&
        location !== "Remote Instruction" &&
        !location.includes("TBD") ?
        encodeURIComponent("Santa Cruz " + location.split(" ").slice(0, -1).join(" ")) :
        null;
</script>

<div class="class">
    <div class="classInfo">
        <header class="title">
            <div class="actionColumn">
                <button class="roundBtn" title="Star this class for later" on:click={toggleStar}>
                        {#if $starredClasses.includes(item.number)}
                            <Star />
                        {:else}
                            <StarOutline />
                        {/if}
                </button>
                <button class="roundBtn" title="Share this class" on:click={() => shareOpen = true} bind:this={sharebutton}>
                    <ShareVariant />
                </button>
                {#if shareOpen}
                <ShareModal
                    url={`${document.location.origin}${document.location.pathname}?class=${item.number}&term=${$db.term}`}
                    classes={[item.number]}
                    headerText="Share this class"
                    onClose={closeModal}
                />
                {/if}
            </div>
            <div class="text">
                <h2>
                    {item.code}
                    {#if $db.term !== detectTerm()}
                        <span class="different-term">{printTerm($db.term)}</span>
                    {/if}
                    <CopyClassNumber number={item.number} />
                </h2>
                <h1>
                    {item.name}
                </h1>
            </div>
        </header>
        <RichText class="description" content={item.description} />
        {#if item.combinedSections.length}
        <h3>Combined sections with</h3>
        <div class="combinedSections">
            {#each item.combinedSections.filter(x => x !== item.number) as combinedSection}
                {#key combinedSection}
                    <ClassWidget number={combinedSection} />
                {/key}
            {/each}
        </div>
        {/if}
        {#if item.enrollmentRequirements}
        <h3>Prerequisites</h3>
        <RichText class="prerequisites" content={item.enrollmentRequirements} />
        {/if}
        {#if item.classNotes}
        <h3>Notes</h3>
        <RichText class="notes" content={item.classNotes} />
        {/if}
        <ClassesByCode code={item.code} number={item.number} />
        <h3>Enrollment {$db.term !== detectTerm() ? "over time" : ""}</h3>
        <Enrollment number={item.number} availability={item.availability} {lastUpdate} />
        {#if item.gradeDistributions.length}
            <h3>Grade distribution</h3>
            <GradeDistribution item={item} />
        {/if}
        {#if item.associatedClasses.length}
            <h3>Associated Classes</h3>
            <div class="associatedClasses">
                {#each item.associatedClasses as associatedClass}
                    <AssociatedClass item={associatedClass} />
                {/each}
            </div>
        {/if}
    </div>
    <aside>
        {#if place}
            {#if $home}
            <iframe
                title="Walking Directions"
                style="height:300px;width:100%;border:0;"
                frameborder="0"
                src={`https://www.google.com/maps/embed/v1/directions?origin=${$home.replace(" ", "+")},+Santa+Cruz,+CA,+USA&destination=${place}&mode=walking&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`}
            />
            {:else}
            <iframe
                title="Location"
                style="height:300px;width:100%;border:0;"
                frameborder="0"
                src={`https://www.google.com/maps/embed/v1/place?q=${place}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`}
            />
            {/if}
        {/if}
        <a
            class="addToCartBtn"
            target="_blank"
            rel="noopener noreferrer"
            style={!place ? "margin-top: 5px" : ""}
            href={"https://pisa.ucsc.edu/cs9/prd/sr9_2013/index.php?action=detail&class_data=" + btoa(`a:2:{s:5:":STRM";s:4:"${$db.term}";s:10:":CLASS_NBR";s:5:"${item.number}";}7`)}
        >
            View in Class Search
            <OpenInNew />
        </a>
        {#each item.meetingInfos as meetingInfo}
            <button
                class="fact"
                class:clickable={meetingInfo.location !== "Online" && meetingInfo.location !== "Remote Instruction" && location != meetingInfo.location}
                aria-disabled={meetingInfo.location !== "Online" && meetingInfo.location !== "Remote Instruction" && location != meetingInfo.location}
                on:click={() => meetingInfo.location === "Online" || meetingInfo.location === "Remote Instruction" ? {} : location = meetingInfo.location}
            >
                {#if meetingInfo.location === "Online" || meetingInfo.location === "Remote Instruction"}
                    <Monitor /> {item.details.instructionMode}
                {:else}
                    <MapMarker /> {meetingInfo.location}
                {/if}
            </button>
        {/each}
        {#if item.meetingInfos.some(x => x.dayAndTime)}
        <div class="fact">
            <DateChecker number={item.number} meetingInfos={item.meetingInfos} />
        </div>
        {/if}
        <div class="fact">
            <HandCoin />
            {item.details.credits} credits
        </div>
        {#if item.details.generalEducation[0]}
        <div class="fact" title="Fulfills GE requirements">
            <ClipboardCheck />
            {item.details.generalEducation.join(", ")}
        </div>
        {/if}
        <div class="fact">
            <School />
            {item.details.undergraduate ? "Undergraduate" : "Graduate"}
        </div>
        <div class="fact">
            <CalendarRange />
            {[...new Set(item.meetingInfos.map(x => x.dates))].join(", ")}
        </div>
    </aside>
</div>
<div class="instructor">
    <header>
        <div class="name">
            <h3>Instructor</h3>
            <h1>{item.instructor.name.replace(",", ", ") || "Unknown"}</h1>
            <span>
                {#if typeof item.instructor.numRatings !== "number"}
                    RateMyProfessors score not available
                {:else}
                    {item.instructor.numRatings} ratings
                {/if}
            </span>
        </div>
        {#if item.instructor.id && item.instructor.id !== "-1"}
        <div class="donuts">
            <DonutChart
                color={rmpScoreColor(item.instructor.avgRating)}
                number={item.instructor.avgRating}
                of={5}
                label="QUALITY"
            />
            <DonutChart
                color="white"
                number={item.instructor.avgDifficulty}
                of={5}
                label="DIFFICULTY"
            />
            <DonutChart
                color={rmpScoreColor(item.instructor.wouldTakeAgainPercent / 20)}
                number={item.instructor.wouldTakeAgainPercent}
                of={100}
                type="percent"
                label="WOULD TAKE AGAIN"
            />
        </div>
        {/if}
    </header>
    {#if item.instructor.reviews && item.instructor.reviews.length > 0}
        <h3>Here's what people are saying</h3>
        {#if item.instructor.reviews.filter(r => r.related).length}
            {#each item.instructor.reviews.filter(r => r.related) as review}
                <Review review={review} />
            {/each}
        {/if}
        {#if item.instructor.reviews.filter(r => !r.related).length}
            {#if item.instructor.reviews.filter(r => r.related).length}
                <h3>Other reviews</h3>
            {/if}
            {#each item.instructor.reviews.filter(r => !r.related) as review}
                <Review review={review} />
            {/each}
        {/if}
        <a href="https://www.ratemyprofessors.com/professor/{item.instructor.id}" target="_blank" rel="noopener noreferrer">
            See more on RateMyProfessors
        </a>
    {/if}
</div>
<header class="mobileHeader">
    <button class="roundBtn" on:click={() => $focusedClass = null}>
        <ArrowLeft />
    </button>
    <h2>{item.code}</h2>
</header>

<style>
    .class {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 10px;
    }
    .classInfo {
        flex-grow: 1;
    }
    header.title {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
    }
    .different-term {
        color: orange;
    }
    .actionColumn {
        display: flex;
        flex-direction: column;
    }
    .combinedSections, .associatedClasses {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 10px;
    }
    .instructor {
        margin-top: 10px;
    }
    .instructor header {
        display: flex;
        flex-direction: row;
        gap: 10px;
        background-color: #555;
        padding: 10px;
        border-radius: 10px;
    }
    .donuts {
        display: flex;
        flex-direction: row;
        gap: 20px;
    }
    .instructor header .name {
        flex-grow: 1;
    }
    aside {
        position: sticky;
        top: 10px;
        width: 300px;
        flex-shrink: 0;
        border-radius: 10px;
        overflow: hidden;
        background-color: #555;
    }
    .addToCartBtn {
        width: calc(100% - 20px);
        transform: translateY(-5px); /* remove space above */
        border-radius: 0;
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: center;
    }
    .clickable {
        cursor: pointer;
    }
    a {
        width: 100%;
        background-color: #111;
        padding: 10px;
        border-radius: 10px;
        color: white;
        transition: background-color 0.2s ease-in-out;
    }
    a:hover {
        background-color: #222;
    }
    .fact {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
        padding: 10px;
    }
    button.fact {
        background-color: unset;
        font-weight: unset;
        color: unset;
        border: none;
    }
    button.fact:focus:not(:focus-visible) {
        outline: none;
    }
    :global(.fact svg) {
        font-size: 24px;
    }
    h1, h2 {
        margin: 0;
    }
    h3 {
        margin-bottom: 5px;
    }
    p {
        margin-top: 5px;
        line-height: 2em;
        white-space: pre-line;
    }
    h1 {
        font-size: 2.5em;
        margin-bottom: 5px;
    }
    @media screen and (max-width: 1400px) {
        .class {
            flex-direction: column;
        }
        .classInfo {
            width: 100%;
        }
        aside {
            width: 100%;
        }
        .fact {
            display: inline-flex;
        }
        .instructor header .name {
            text-align: center !important;
            margin-bottom: 10px;
        }
        .name h3 {
            margin: 0;
        }
        .instructor header {
            flex-direction: column;
        }
        .donuts {
            flex-wrap: wrap;
            justify-content: center;
        }
    }
    @media screen and (max-width: 1000px) {
        .associatedClasses {
            overflow: auto;
            flex-wrap: nowrap;
            width: calc(100% + 40px);
            transform: translateX(-20px);
        }
        :global(.associatedClasses > *) {
            flex-shrink: 0;
        }
        :global(.associatedClasses > *:first-child) {
            margin-left: 20px;
        }
        :global(.associatedClasses > *:last-child) {
            margin-right: 20px;
        }
    }
</style>