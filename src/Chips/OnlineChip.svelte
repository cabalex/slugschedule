<script lang="ts">
  import { searchFilters, listMode } from "../mainStore";
  import DropdownChip from "./DropdownChip.svelte";

    const opts = {
        "In Person": "In Person",
        "Hybrid": "Hybrid",
        "Asynchronous Online": "Asynchronous Online",
        "Synchronous Online": "Synchronous Online",
    }
</script>

<DropdownChip multiple={true} label="Mode" options={opts} bind:value={$searchFilters[$listMode].instructionMode} />