<script lang="ts">
    export let number;
    export let of;
    export let color;
    export let label = "";
    export let type = "number";

    let circumference = 440;
    let to = circumference * (1 - Math.max(number, 0) / of);
</script>

<div class="donut" style="--circumference: {circumference}; --to: {to}">
    <h1 style={type === "percent" ? "font-size: 2.5em" : ""}>{number < 10 ? Math.max(number, 0).toFixed(1) : number}{type === "percent" ? "%" : ""}</h1>
    <h2>{label}</h2>
    <svg width="160" height="160" xmlns="http://www.w3.org/2000/svg">
     <g>
      <title>Layer 1</title>
      <circle class="circle_animation" r="69.85699" cy="81" cx="81" stroke-width="16" stroke-linecap="round" stroke={color} fill="none"/>
     </g>
    </svg>
</div>

<style>
.donut {
    position: relative;
    float: left;
}

.donut h1 {
    text-align:center;
    position: absolute;
    line-height: 125px;
    width: 100%;
    margin: 0;
    z-index: 2;
}
.donut h2 {
    text-align:center;
    position: absolute;
    font-size: 17px;
    top: 90px;
    line-height: 20px;
    margin: 0 10px;
    width: calc(100% - 20px);
}

svg {
   -webkit-transform: rotate(-90deg);
    transform: rotate(-90deg);
}

.circle_animation {
  stroke-dasharray: var(--circumference); /* this value is the pixel circumference of the circle */
  stroke-dashoffset: var(--circumference);
}

.donut .circle_animation {
    animation: css 0.5s ease-out forwards;
}

@keyframes css {
    from {
        stroke-dashoffset: var(--circumference);
    }
    to {
        stroke-dashoffset: var(--to);
    }
}
</style>