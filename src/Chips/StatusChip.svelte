<script lang="ts">
    import { ClassStatus } from "../../.server/db/DB";
    import { searchFilters, listMode } from "../mainStore";
    import DropdownChip from "./DropdownChip.svelte";
  
    const opts = {
        "Open": "Open",
        "Closed": "Closed",
        "Waitlist": "Waitlist"
    }

    function onChange(value) {
        searchFilters.update((filters) => {
            filters[$listMode].status = value.map(
                x => x === "Closed" ? ClassStatus.Closed :
                x === "Open" ? ClassStatus.Open :
                ClassStatus.Waitlist
            );
            return filters;
        })
    }

    let values = $searchFilters[$listMode].status.map(
        x => x === ClassStatus.Closed ? "Closed" :
        x === ClassStatus.Open ? "Open" :
        "Waitlist"
    );

    const clearValues = () => {
        values = [];
    }
    $: {
        if ($searchFilters[$listMode].status.length === 0) {
            clearValues();
        }
    }


  </script>
  
  <DropdownChip multiple={true} label="Status" bind:value={values} options={opts} onChange={onChange} />