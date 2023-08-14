<script lang="ts">
    import { ClassStatus } from "../../.server/db/DB";
      import { searchFilters } from "../mainStore";
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
  
      let values = $searchFilters.undergraduate !== null ?
        $searchFilters.undergraduate ? ["Undergrad"] :
        ["Grad"] :
        [];
  
      const clearValues = () => {
          values = [];
      }
      $: {
          if ($searchFilters.undergraduate === null) {
              clearValues();
          }
      }
  
  
    </script>
    
    <DropdownChip multiple={false} label="Level" bind:value={values} options={opts} onChange={onChange} />