<script>
import { setContext } from 'svelte';
import STORE, { connect, addRandomNumber, randomizeNumber, deleteRandomNumber} from './store'
import RandomNumber from './RandomNumber.svelte'

// let us set the context for the children. Take a look at how RandomNumber
// consumes the context here to get the connected actions.
setContext('randomizeNumber', connect(randomizeNumber));
setContext('deleteRandomNumber', connect(deleteRandomNumber))

const add = connect(addRandomNumber)

</script>

<style>

ul {
    list-style-type: none;
    margin:0;
    padding:0;
}

button {
    margin-bottom: 20px;
}

</style>

<button on:click={add}>+ random number</button>

<ul>
    {#each $STORE.randomNumbers as {id, value}, i (id)}
        <RandomNumber id={id} value={value} />
    {/each}
</ul>