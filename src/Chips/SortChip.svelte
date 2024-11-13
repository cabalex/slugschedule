<script lang="ts">
  import { calculateAverageGPA } from "../MainPanel/Class/GradeDistribution/GradeDistribution.svelte";
    import { searchFilters, listMode } from "../mainStore";
    import DropdownChip from "./DropdownChip.svelte";
  
    const opts = {
        "Largest": "Class size (large to small)",
        "Smallest": "Class size (small to large)",
        "Best rated": "Best rating",
        "Highest GPA": "Highest GPA average",
        "Most reviews": "Most reviews",
        "Availability": "Most open seats",
    }

    function onChange(values) {
        let value = values[0]
        searchFilters.update((filters) => {
            switch(value) {
                case "Largest":
                    filters[$listMode].sortMode = {value, fn: (a, b) => b.availability.capacity - a.availability.capacity };
                    break;
                case "Smallest":
                    filters[$listMode].sortMode = {value, fn: (a, b) => a.availability.capacity - b.availability.capacity };
                    break;
                case "Best rated":
                    filters[$listMode].sortMode = {value, fn: (a, b) => (b.instructor.avgRating || 0) - (a.instructor.avgRating || 0) };
                    break;
                case "Highest GPA":
                    filters[$listMode].sortMode = {value, fn: (a, b) => (calculateAverageGPA(b.gradeDistributions) || 0) - (calculateAverageGPA(a.gradeDistributions) || 0) };
                    break;
                case "Most reviews":
                    filters[$listMode].sortMode = {value, fn: (a, b) => b.instructor.numRatings - a.instructor.numRatings };
                    break;
                case "Availability":
                    filters[$listMode].sortMode = {value, fn: (a, b) => (b.availability.capacity - b.availability.enrolled) - (a.availability.capacity - a.availability.enrolled) };
                    break;
            }
            return filters;
        })
    }

    $: values = $searchFilters[$listMode].sortMode ? [$searchFilters[$listMode].sortMode.value] : []

  </script>
  
  <DropdownChip multiple={false} label="Sort" bind:value={values} options={opts} onChange={onChange} />