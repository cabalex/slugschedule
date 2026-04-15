<script lang="ts">
    import { searchFilters, listMode } from "../mainStore";
    import DropdownChip from "./DropdownChip.svelte";

    const opts = {
        "Monday": "Mon",
        "Tuesday": "Tue",
        "Wednesday": "Wed",
        "Thursday": "Thu",
        "Friday": "Fri"
    };

    function formatDayValue(values, label, options) {
        if (values.length === 0) return label;
        if (values.length === 1) return options[values[0]] || values[0];
        return `${values.length} days`;
    }
</script>

<DropdownChip
    multiple={true}
    label="Days"
    options={opts}
    displayValue={formatDayValue}
    bind:value={$searchFilters[$listMode].days}
/>
