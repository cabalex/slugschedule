<script lang="ts">

</script>

<h2>Scheduler</h2>
<div class="times">
    <div class="main">8 am</div>
    <div class="main">9 am</div>
    <div class="main">10 am</div>
    <div class="main">11 am</div>
    <div class="main">12 pm</div>
    <div class="main">1 pm</div>
    <div class="main">2 am</div>
    <div class="main">3 am</div>
    <div class="main">4 am</div>
    <div class="main">5 am</div>
    <div class="main">6 am</div>
    <div class="main">7 am</div>
    <div class="main">8 am</div>
    <div class="main">9 am</div>
    <div class="main">10 am</div>
</div>
<table>
    <tr>
        <th>Monday</th>
        <th>Tuesday</th>
        <th>Wednesday</th>
        <th>Thursday</th>
        <th>Friday</th>
    </tr>
    <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
    </tr>
</table>

<style>
    .times {
        position: absolute;
        height: calc(100% - 160px);
        transform: translateY(30px);
        background-color: #111;

        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    table {
        width: calc(100% - 20px);
        height: calc(100% - 80px);
        margin-left: 20px;
    }
    th {
        height: 1em;
    }
    td {
        width: 20%;
        border: 2px solid #ccc;
    }
</style>