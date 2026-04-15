<script lang="ts">
    import MenuDown from "svelte-material-icons/MenuDown.svelte";
    import { listMode, searchFilters } from "../mainStore";
    import { formatFilterTime } from "../meetingInfo";

    let open = false;

    const timeOptions = [
        { label: "Any time", value: null },
        ...Array.from({ length: 31 }, (_, index) => {
            let hours = 7 + Math.floor(index / 2);
            let minutes = index % 2 === 0 ? 0 : 30;
            let time = new Date(1970, 0, 1, hours, minutes).getTime();

            return {
                label: formatFilterTime(time),
                value: time
            };
        })
    ];

    $: startTime = $searchFilters[$listMode].startTime;
    $: endTime = $searchFilters[$listMode].endTime;
    $: label = startTime !== null && endTime !== null ?
        `${formatFilterTime(startTime)}-${formatFilterTime(endTime)}` :
        startTime !== null ?
        `After ${formatFilterTime(startTime)}` :
        endTime !== null ?
        `Before ${formatFilterTime(endTime)}` :
        "Time";

    function updateTimeFilter(key: "startTime"|"endTime", value: string) {
        let parsedValue = value === "" ? null : parseInt(value);

        searchFilters.update((filters) => {
            filters[$listMode][key] = parsedValue;

            if (
                filters[$listMode].startTime !== null &&
                filters[$listMode].endTime !== null &&
                filters[$listMode].startTime > filters[$listMode].endTime
            ) {
                if (key === "startTime") {
                    filters[$listMode].endTime = parsedValue;
                } else {
                    filters[$listMode].startTime = parsedValue;
                }
            }

            return filters;
        });
    }

    function clickOut(e?) {
        if (e && e.target.closest(".chip.timeFilter")) return;
        open = false;
    }
</script>

<div
    class="chip timeFilter"
    class:active={startTime !== null || endTime !== null}
>
    <button
        type="button"
        class="chipTrigger"
        aria-expanded={open}
        on:click={() => open = !open}
    >
        {label}
        <span style={open ? "transform: rotate(180deg)" : ""}>
            <MenuDown />
        </span>
    </button>

    {#if open}
        <div class="options">
            <label>
                Starts after
                <select value={startTime === null ? "" : startTime} on:change={(e) => updateTimeFilter("startTime", e.currentTarget.value)}>
                    <option value="">Any time</option>
                    {#each timeOptions.slice(1) as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </label>

            <label>
                Ends before
                <select value={endTime === null ? "" : endTime} on:change={(e) => updateTimeFilter("endTime", e.currentTarget.value)}>
                    <option value="">Any time</option>
                    {#each timeOptions.slice(1) as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </label>
        </div>
    {/if}
</div>

<svelte:body on:click={clickOut} />

<style>
    .chip {
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }
    .chipTrigger {
        background: transparent;
        border: none;
        color: inherit;
        font: inherit;
        display: flex;
        align-items: center;
        gap: 2px;
        border-radius: inherit;
        padding: 5px;
        text-align: left;
    }
    .chipTrigger > span {
        display: inline-block;
        line-height: 0;
    }
    .chipTrigger:hover {
        border-color: transparent;
        background: transparent;
    }
    .chipTrigger:focus,
    .chipTrigger:focus-visible {
        outline: none;
    }
    .options {
        position: absolute;
        z-index: 10;
        background-color: #222;
        width: 220px;
        top: calc(100% + 2px);
        left: 0;
        padding: 12px;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);

        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    label {
        display: flex;
        flex-direction: column;
        gap: 5px;
        font-size: 0.95em;
    }
    select {
        background-color: #111;
        color: white;
        border: 1px solid #555;
        border-radius: 6px;
        padding: 8px;
        font: inherit;
    }
    @media screen and (max-width: 1000px) {
        .options {
            position: fixed;
            left: 0;
            top: unset;
            transform: translateY(10px);
            width: calc(100% - 24px);
        }
    }
</style>
