<script lang="ts">
    import { db } from "../mainStore";

    export let value;

    let classNames = new Map<string, number[]>();
    $: {
        classNames = new Map();

        for (let i = 0; i < $db.classes.length; i++) {
            let c = $db.classes[i];
            let name = c.code.split(" - ")[0]; // remove section number

            if (classNames.has(name)) {
                classNames.set(name, [...classNames.get(name), i]);
            } else {
                classNames.set(name, [i]);
            }
        }
    }
</script>

<select bind:value={value}>
    {#each classNames as pair}
        <option value={pair[1].join(",")}>{pair[0]}</option>
    {/each}
</select>