import { createSelector } from 'reselect'
import { writable, derived } from "svelte/store"
import produce from "immer"

export const options = {
    product: ['firefox', 'fenix'],
    channel: ['release', 'beta', 'nightly'],
    os: ['mac', 'windows', 'linux'],
    randomNumbers: []
}

const initStore = {
    channel: 'release',
    os: 'mac',
    randomNumbers: []
}

// here, we will separate out subscribe from update.
const STORE = writable(initStore)

// this works very similar to what you'd expect in a redux setting.
// eg. dispatch(changeChannel('beta')) should take the changeChannel
// action, which returns a draft-mutating function to be fed into
// immer's produce function.
export const dispatch = func => {
    STORE.update(state => produce(state, func));
}

const getNextId = (arr) => {
    if (!arr.length) return 0;
    return Math.max(...arr.map(it => it.id), 0) + 1;
}

// connect is a way to return a new function that takes in arguments
// and calls dispatch explicitly.
export const connect = func => {
    return (...args) => dispatch(func(...args))
}

export const changeChannel = (ch) => draft =>  { draft.channel = ch }
export const changeOS = (os) => draft =>  { draft.os = os }

const randomNumber = () => {
    return Math.random() * 100;
}

export const addRandomNumber = () => draft => {
    draft.randomNumbers.push({
        value: randomNumber(),
        id: getNextId(draft.randomNumbers)
    })
}

export const randomizeNumber = (id) => draft => {
    const ind = draft.randomNumbers.findIndex(r=>r.id === id);
    draft.randomNumbers[ind].value = randomNumber();
}

export const deleteRandomNumber = id => draft => {
    draft.randomNumbers = draft.randomNumbers.filter(r=> r.id !== id)
}


// let's select out just just parts of the state we want to add to the queryString.

export const serverParams = derived(STORE, $st => {
    return {os: $st.os, channel: $st.channel}
})

// make the querystring portion off of serverParams.

export const queryString = derived(serverParams, $params => {
    const keys = Object.keys($params).sort()
    return keys.map(k => `${k}=${$params[k]}`).join('&')
})

// we default export only the subscribe function.
// This makes the store somewhat read-only by nature, since
// the components that will use the store can only read from it.
// See https://svelte.dev/tutorial/custom-stores for an example of
// this pattern in action (albeit done from a different perspective.)
export default { subscribe: STORE.subscribe }