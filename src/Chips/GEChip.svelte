<script lang="ts" context="module">
    // Export to be used in other files
    export const opts = {
        "AnyGE": "Any GE",
        "NoPrereq": "No Prerequisites",
        "C": "C Composition",
        "CC": "CC Cross-Cultural Analysis",
        "ER": "ER Ethnicity and Race",
        "IM": "IM Interpreting Arts and Media",
        "MF": "MF Mathematical and Formal Reasoning",
        "PE-E": "PE-E Perspectives (Environmental Awareness)",
        "PE-H": "PE-H Perspectives (Human Behavior)",
        "PE-T": "PE-T Perspectives (Technology and Society)",
        "PR-C": "PR-C Practice (Collaborative Endeavor)",
        "PR-E": "PR-E Practice (Creative Process)",
        "PR-S": "PR-S Practice (Service Learning)",
        "SI": "SI Scientific Inquiry",
        "SR": "SR Statistical Reasoning",
        "TA": "TA Textual Analysis"
    }
</script>
<script lang="ts">
    import DropdownChip from "./DropdownChip.svelte";
    import { searchFilters, listMode } from "../mainStore";

</script>

<DropdownChip multiple={true} label="GEs" options={opts} bind:value={$searchFilters[$listMode].ges} />