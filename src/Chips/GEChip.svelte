<script lang="ts">
    import DropdownChip from "./DropdownChip.svelte";
    import { searchFilters, listMode } from "../mainStore";
    
    const opts = {
        "AnyGE": "Any GE",
        "A": "A",
        "C": "C",
        "C1": "C1",
        "C2": "C2",
        "CC": "CC",
        "E": "E",
        "ER": "ER",
        "IH": "IH",
        "IM": "IM",
        "IN": "IN",
        "IS": "IS",
        "MF": "MF",
        "PE-E": "PE-E",
        "PE-H": "PE-H",
        "PE-T": "PE-T",
        "PR-C": "PR-C",
        "PR-E": "PR-E",
        "PR-S": "PR-S",
        "Q": "Q",
        "SI": "SI",
        "SR": "SR",
        "TA": "TA",
        "TH": "TH",
        "TN": "TN",
        "TS": "TS",
        "W": "W"
    }
</script>

<DropdownChip multiple={true} label="GEs" options={opts} bind:value={$searchFilters[$listMode].ges} />