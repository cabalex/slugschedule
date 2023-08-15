<script lang="ts">
    import { searchFilters, listMode } from "../mainStore";
    import DropdownChip from "./DropdownChip.svelte";

    const opts = {
        "Grad": "Graduate",
        "Undergrad": "Undergraduate",
    }

    function onChange(value) {
        searchFilters.update((filters) => {
            filters.undergraduate = value.includes("Undergrad");
            return filters;
        })
    }

    let values = $searchFilters[$listMode].undergraduate !== null ?
        $searchFilters[$listMode].undergraduate ? ["Undergrad"] :
        ["Grad"] :
        [];

    const clearValues = () => {
        values = [];
    }
    $: {
        if ($searchFilters[$listMode].undergraduate === null) {
            clearValues();
        }
    }


</script>
    
    <DropdownChip multiple={false} label="Level" bind:value={values} options={opts} onChange={onChange} />