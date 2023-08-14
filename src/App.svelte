<script lang="ts">
  import ListPanel from "./ListPanel/ListPanel.svelte";
  import Loading from "./Loading/Loading.svelte";
  import MainPanel from "./MainPanel/MainPanel.svelte";
  import SidePanel from "./SidePanel/SidePanel.svelte";
  import { db } from "./mainStore";

</script>
{#if !$db}
<Loading />
{:else}
<div>
  <SidePanel />
  <ListPanel />
  <MainPanel />
</div>
{/if}

<style>
  div {
    display: flex;
    flex-direction: row;
    width: 100%;
  }
</style>