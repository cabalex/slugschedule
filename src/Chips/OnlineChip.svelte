<script lang="ts">
  import { searchFilters } from "../mainStore";
  import DropdownChip from "./DropdownChip.svelte";

    const opts = {
        "In Person": "In Person",
        "Hybrid": "Hybrid",
        "Asynchronous Online": "Asynchronous Online",
        "Synchronous Online": "Synchronous Online",
    }

    function onChange(value) {
        searchFilters.update((filters) => {
            filters.instructionMode = value;
            return filters;
        })
    }
</script>

<DropdownChip multiple={true} label="Mode" options={opts} bind:value={$searchFilters.instructionMode} />