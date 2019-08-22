<script>
import { format } from 'd3-format';
import { slide } from 'svelte/transition';
import  { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import { getContext } from 'svelte'
import STORE from './store';
export let id;
export let value;

// this component will either look at the passed-in props for onRandomize
// and onDelete, or it will look at the context, or it will be undefined.
export let onRandomize = getContext('randomizeNumber');
export let onDelete = getContext('deleteRandomNumber');

const randomizeNumber = () => onRandomize(id)
const deleteNumber = () => onDelete(id)

// create a tween which gracefully spins between previous and next values.
const tweenedNumber = tweened(0, {duration: 500, easing: cubicOut});
$: tweenedNumber.set(value)

const fm = format(',.2')

</script>

<style>


.list-container {
    display: grid;
    grid-template-columns: 50px 200px 100px 100px;
    grid-column-gap: 20px;
}

.list-container div:first-child {
    text-align: right;
}

</style>

<li transition:slide={{duration:200}}>
    <div class=list-container>
        <div>{fm($tweenedNumber)}</div>
        <div>
            <svg width="100" height="20">
                <rect x=0 y=0 height=20 width={$tweenedNumber} fill=lightgray />
            </svg>
        </div>
        <div>
            <button on:click={randomizeNumber}>randomize</button>
        </div>
        <div>
            <button on:click={deleteNumber}>delete</button>
        </div>
    </div>
</li>