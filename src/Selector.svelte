<script>
export let label;
export let options;
export let current;
export let onChange;

</script>

<style>
select {
    background-color: transparent;
    color: white;
    border: 1px solid darkgray;
    display: block;
}

.selector {
    display:grid;
    grid-template-columns: 100px 150px 100px;
    grid-column-gap: 20px;
}

</style>

<div class=selector>
<div>
{label}
</div>
    <select bind:value={current} on:change={() => onChange(current)}>
        {#each options as option}
            <option value={option}>
                {option}
            </option>
        {/each}
    </select>

    {current}

</div>