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
    import PinOutline from "svelte-material-icons/PinOutline.svelte"
    import ClipboardEditOutline from 'svelte-material-icons/ClipboardEditOutline.svelte';
    import ClipboardAccountOutline from 'svelte-material-icons/ClipboardAccountOutline.svelte'
    import TrendingUp from "svelte-material-icons/TrendingUp.svelte";
    import TrendingDown from "svelte-material-icons/TrendingDown.svelte";
    import ChartBox from "svelte-material-icons/ChartBox.svelte";
    import Information from 'svelte-material-icons/Information.svelte'
    import VectorCombine from 'svelte-material-icons/VectorCombine.svelte'

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
    import Prerequisites from "./Prerequisites/Prerequisites.svelte";
    import ClassStatusIcon from "../../assets/ClassStatusIcon.svelte";
    import RollingNumber from "../../assets/RollingNumber.svelte";

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
            item.enrollmentRequirements = data.primary_section.requirements
            // If combined section, primary_section will have the wrong numbers, so
            // find the correct section from combined_sections
            const enrollmentSection = 'combined_sections' in data ? data.combined_sections.find(x => x.class_nbr === item.number.toString()) : data.primary_section;
            const status = enrollmentSection.enrl_status === "Open" ? ClassStatus.Open :
                enrollmentSection.enrl_status === "Wait List" ? ClassStatus.Waitlist :
                ClassStatus.Closed;
            item.availability = {
                status,
                capacity: parseInt(enrollmentSection.capacity),
                enrolled: parseInt(enrollmentSection.enrl_total),
                waitlist: parseInt(enrollmentSection.waitlist_total),
                waitlistCapacity: parseInt(enrollmentSection.waitlist_capacity)
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

    let enrolledInLastDay = 0;

    let openSeatsOnWaitlisted =  $db.term === detectTerm() && item.availability.status === ClassStatus.Waitlist && item.availability.capacity > item.availability.enrolled;
</script>

<div class="class">
    <div class="classInfo">
        <header class="title" style="{openSeatsOnWaitlisted ? "border-bottom-left-radius: 4px; border-bottom-right-radius: 4px;" : ""}">
            <div class="actionRow">
                <button class="backBtn" on:click={() => $focusedClass = null}>
                    <ArrowLeft />
                </button>
                <h2 class="text">
                    {item.code}
                    {#if $db.term !== detectTerm()}
                        <span class="different-term">{printTerm($db.term)}</span>
                    {/if}
                    <CopyClassNumber number={item.number} />
                </h2>
                <button class="starBtn" title="Star this class for later" on:click={toggleStar}>
                        {#if $starredClasses.includes(item.number)}
                            <Star />
                        {:else}
                            <StarOutline />
                        {/if}
                </button>
                <button class="shareBtn" title="Share this class" on:click={() => shareOpen = true} bind:this={sharebutton}>
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
            <div class="text titleRow">
                <h1>
                    {item.name}
                </h1>
            </div>
            <div class="infoRow">
                <div class="enrollmentRow">
                    <ClassStatusIcon status={item.availability.status} />
                    <div class="status">
                        <div class="spots">
                            {#if item.availability.status === ClassStatus.Closed}
                                Closed
                            {:else if item.availability.capacity <= item.availability.enrolled || item.availability.status === ClassStatus.Waitlist}
                                Full
                            {:else if item.availability.capacity - item.availability.enrolled === 1}
                                One spot remaining!
                            {:else}
                                <span><RollingNumber number={item.availability.capacity - item.availability.enrolled} /> spots remaining</span>
                            {/if}

                            {#if item.availability.status === ClassStatus.Waitlist}
                                <span>(<RollingNumber number={item.availability.waitlist} /> on waitlist)</span>
                            {/if}
                        </div>
                        {#if enrolledInLastDay !== 0}
                            <h2 class="trend">
                                {#if enrolledInLastDay > 0}
                                    <TrendingUp size="2em" />
                                {:else}
                                    <TrendingDown size="2em" />
                                {/if}
                                <div>
                                    <span><RollingNumber number={Math.abs(enrolledInLastDay)} /> {enrolledInLastDay < 0 ? "dropped" : "enrolled"} last day</span>
                                    <span>({Math.round(Math.abs(enrolledInLastDay) / item.availability.capacity * 100)}%)</span>
                                </div>
                            </h2>        
                        {:else} 
                            <div class="trend" style="margin: 3px 0px 4px 0px;">Updated {lastUpdate.toLocaleTimeString(navigator.language, {
                                hour: 'numeric',
                                minute: '2-digit'
                            })}</div>
                        {/if}
                    </div>
                </div>
                <div class="instructorRow">
                    <div class="instructorLeft">
                        <div class="icon">
                            <School></School>
                        </div>
                        <div class="instructor">
                            <div class="name">
                                {item.instructor.name.replace(",", ", ") || "Unknown"}
                            </div>
                            <div class="ratingInfo">
                                {#if typeof item.instructor.numRatings !== "number"}
                                    RMP score not available
                                {:else}
                                    {item.instructor.numRatings} ratings
                                {/if}
                            </div>
                        </div>
                    </div>
                    {#if item.instructor.id && item.instructor.id !== "-1"}
                        {@const avgRating = item.instructor.avgRating}
                        {@const avgDifficulty = item.instructor.avgDifficulty}

                        <div class="ratings">
                            <div style="background-color: {rmpScoreColor(avgRating)};" class="ratingSection">
                                <div class="ratingLabel">Quality</div>
                                <div class="ratingValue">{avgRating < 10 ? Math.max(avgRating, 0).toFixed(1) : avgRating}</div>
                            </div>
                            <div style="background-color: #aaaaaa;" class="ratingSection">
                                <div class="ratingLabel">Difficulty</div>
                                <div class="ratingValue">{avgDifficulty < 10 ? Math.max(avgDifficulty, 0).toFixed(1) : avgDifficulty}</div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </header>

        {#if openSeatsOnWaitlisted}
            <!-- waitlists can have empty spots even though you can't enroll in them. -->
            <div class="note">
                <Information size="24px" />
                <div style="flex-grow: 1">
                    <h2>This class is still full, even though there's {item.availability.capacity -item. availability.enrolled} open {item.availability.capacity - item.availability.enrolled === 1 ? "seat" : "seats"}</h2>
                    <p>You can't enroll directly into a waitlisted class, even if it has empty seats. These seats will automatically be filled by the waitlist at <b>9:00 AM</b> each day. Use the waitlist to enroll.</p>
                </div>
            </div>
        {/if}

        <div class="sectionTitle">
            <div class="icon">
                <PinOutline></PinOutline>
            </div>
            <p class="text">About</p>
        </div>
        <div class="section top quickAbout">
            <div class="aboutFact">
                <HandCoin />
                {item.details.credits} credits
            </div>
            {#if item.details.generalEducation[0]}
                <div class="aboutFact" title="Fulfills GE requirements">
                    <ClipboardCheck />
                    {item.details.generalEducation.join(", ")}
                </div>
            {/if}
            <div class="aboutFact">
                <School />
                {item.details.undergraduate ? "Undergraduate" : "Graduate"}
            </div>
            <div class="aboutFact">
                <ClipboardAccountOutline />
                {item.details.grading}
            </div>
        </div>
        <div class="section bottom">
            <RichText class="description" content={item.description} />
        </div>
        <ClassesByCode code={item.code} number={item.number} />
        {#if item.combinedSections.length}
        <div class="sectionTitle">
            <div class="icon">
                <VectorCombine></VectorCombine>
            </div>
            <p class="text">Combined sections with</p>
        </div>
        <div class="combinedSections">
            {#each item.combinedSections.filter(x => x !== item.number) as combinedSection}
                {#key combinedSection}
                    <ClassWidget number={combinedSection} />
                {/key}
            {/each}
        </div>
        {/if}
        {#if item.enrollmentRequirements}
            <Prerequisites content={item.enrollmentRequirements} />
        {/if}
        {#if item.classNotes}
            <div class="sectionTitle">
                <div class="icon">
                    <ClipboardEditOutline></ClipboardEditOutline>
                </div>
                <p class="text">Notes</p>
            </div>
            <div class="section">
                <RichText class="notes" content={item.classNotes} />
            </div>
        {/if}
        {#if item.associatedClasses.length}
            <div class="sectionTitle">
                <div class="icon">
                    <VectorCombine></VectorCombine>
                </div>
                <p class="text">Associated Classes</p>
            </div>
            <div class="associatedClasses">
                {#each item.associatedClasses as associatedClass}
                    <AssociatedClass item={associatedClass} />
                {/each}
            </div>
        {/if}
        <div class="sectionTitle">
            <div class="icon">
                <ChartBox></ChartBox>
            </div>
             <p class="text">Enrollment {$db.term !== detectTerm() ? "over time" : ""}</p>
        </div>
        <Enrollment bind:enrolledInLastDay number={item.number} availability={item.availability} {lastUpdate} />
        {#if item.gradeDistributions.length}
            <h3>Grade distribution</h3>
            <GradeDistribution item={item} />
        {/if}
    </div>
    <div class="divider"></div>
    <aside>
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
        <DateChecker compressed={false} number={item.number} meetingInfos={item.meetingInfos} />
        {/if}
        <div class="fact bottom">
            <CalendarRange />
            {[...new Set(item.meetingInfos.map(x => x.dates))].join(", ")}
        </div>

        <ClassesByCode reduced={true} code={item.code} number={item.number} />
    </aside>
</div>
<div class="">
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

<style>
    .class {
        display: flex;
        flex-direction: row;
        gap: 7px;
        overflow: hidden;
        position: relative;
    }
    .classInfo {
        width: 100%;
        overflow: hidden;
    }
    header.title {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 3px;
        background-color: #2c2c2c;
        border-radius: 8px;
        container-type: inline-size;
        container-name: header;
    }
    .actionRow {
        display: flex;
        gap: 3px;
    }
    .actionRow .text {
        padding: 14px 20px 10px 0px;
        font-size: 20px;
        width: 100%;
        line-height: 20px;
    }
    .actionRow button {
        padding: 10px 20px 10px 20px;
        background-color: #2c2c2c;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .actionRow .backBtn {
        border-radius: 8px 4px 4px 4px;
    }
    .actionRow .starBtn {
        border: 4px;
    }
    .actionRow .shareBtn {
        border-radius: 4px 8px 4px 4px;
    }
    .titleRow {
        padding: 8px 20px 5px 20px;
    }
    .infoRow {
        display: flex;
        gap: 10px;
        align-items: stretch;
        position: relative;
        overflow: hidden;
        padding: 12px 20px 12px 20px;
    }
    .enrollmentRow {
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 24px;
    }
    .enrollmentRow .status {
        display: flex;
        flex-direction: column;
        gap: 0px;
    }
    .enrollmentRow .spots {
        font-size: 18px;
        font-weight: 700;
        white-space: nowrap;
    }
    .enrollmentRow .trend {
        display: inline-flex;
        font-size: 14px;
        align-items: center;
        font-weight: 300;
        gap: 3px;
        white-space: nowrap;
    }
    .instructorRow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        overflow: hidden;
        min-width: 45%;
        margin-left: auto;
    }
    .instructorLeft {
        display: flex;
        align-items: center;
        gap: 15px;
        overflow: hidden;
    }
    .instructorRow .icon {
        font-size: 30px;
    }
    .instructorRow .instructor {
        display: flex;
        flex-direction: column;
        gap: 3px;
        padding-right: 2px;
        overflow: hidden;
    }
    .instructorRow .instructor .name {
        font-size: 18px;
        font-weight: 700;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }
    .instructorRow .instructor .ratingInfo {
        font-size: 14px;
        font-weight: 300;
        padding-bottom: 4px;
        white-space: nowrap;
        width: fit-content;
    }
    .note {
        display: flex;
        gap: 16px;
        padding: 12px 20px 12px 20px;
        justify-content: center;
        align-items: center;
        background-color: var(--waitlist-dark);
        border-radius: 4px 4px 8px 8px;
        margin-top: 3px;
    }
    .note h2, .note p {
        margin: 0;
    }
    .note h2 {
        font-size: 20px;
        line-height: 24px;
        margin-top: 4px;
        margin-bottom: 4px;
    }
    .note p {
        line-height: 24px;
        margin-bottom: 4px;
    }
    .sectionTitle {
        display: flex; 
        align-items: center;
        gap: 4px;
        margin-top: 16px;
        margin-bottom: 4px;
    }
    .sectionTitle .icon {
        display: flex;
        align-items: center;
        font-size: 18px
    }
    .sectionTitle .text {
        margin: 0px;
        font-size: 16px;
        font-weight: 600;
    }
    .section {
        background-color: #0000002d;
        padding: 16px 20px 16px 20px;
        border-radius: 8px;
    }
    .different-term {
        color: orange;
    }
    .combinedSections, .associatedClasses {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 10px;
    }
    .ratings {
        display: flex;
        flex-direction: row;
        gap: 3px;
    }

    .ratings .ratingSection {
        border-radius: 4px;
        color: black;
        padding: 2.5px 8px 2.5px 8px;
        width: 67px;
    }
    .ratings .ratingSection .ratingLabel {
        white-space: nowrap;
        font-size: 12px;
        font-weight: 700;
    }
    .ratings .ratingSection .ratingValue {
        font-size: 24px;
        font-weight: 900;
        margin: -6px 0px -4px 0px;
    }

    .combinedSections {
        overflow: hidden;
        border-radius: 8px;
        display: grid;
        grid-template-columns: repeat(2, 1fr);;
        gap: 3px;
    }

    .combinedSections > :global(*:last-child:nth-child(odd)) {
        grid-column: span 2;
    }

    .associatedClasses {
        border-radius: 8px;
        overflow: hidden;
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: stretch;
        gap: 3px;
    }

    aside {
        position: sticky;
        top: 0px;
        width: 300px;
        flex-shrink: 0;
        overflow: hidden;
        height: fit-content;
        padding-bottom: 100px;
    }

    aside iframe {
        border-radius: 4px;
    }
    .divider {
        background-color: #6a6969;
        min-width: 2px;
        border-radius: 10px;
        margin: 0px 8px 0px 8px;
    }
    .addToCartBtn {
        width: calc(100% - 20px);
        border-radius: 8px 8px 4px 4px;
        margin-bottom: 3px;
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: center;
        background-color: #2c2c2c;
        height: 30px;
    }
    .clickable {
        cursor: pointer;
    }
    .top {
        border-bottom-right-radius: 4px;
        border-bottom-left-radius: 4px;
    }

    .bottom {
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        border-bottom-right-radius: 8px !important;
        border-bottom-left-radius: 8px !important;
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
        gap: 15px;
        padding: 10px;
        background-color: #0000002d;
        border-radius: 4px;
        margin-bottom: 3px;
    }
    .quickAbout {
        margin-bottom: 3px;
        padding-top: 18px;
        padding-bottom: 18px;
        display: flex;
        gap: 20px;
    }
    .aboutFact {
        flex-direction: row;
        align-items: center;
        gap: 4px;
        display: flex;
    }
    :global(.aboutFact svg) {
        font-size: 24px;
    }
    button.fact {
        background-color: unset;
        font-weight: unset;
        color: unset;
        border: none;
        background-color: #0000002d;
        border-radius: 4px;
        width: 100%;
        margin-bottom: 3px;
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
    }

    @media screen and (max-width: 500px) {
        .associatedClasses {
            grid-template-columns: 1fr;
        }
    }

    @media screen and (min-width: 1001px) {
        .actionRow .backBtn {
            display: none;
        }
        .actionRow .text {
            padding: 14px 20px 10px 20px;
        }
    }
    
    @container header (width < 700px) {
        .infoRow {
            flex-direction: column;
            gap: 10px;
        }

        .instructorRow {
            min-width: 45%;
            margin-left: 0px;
        }
    }
</style>