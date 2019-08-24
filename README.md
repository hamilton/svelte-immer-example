# one way (of many) to maintain global app state in Svelte

One thing I like about Svelte is that the primitives are powerful and diverse
enough that you can imitate many common app architecture patterns from
React-land if you want. This repository provides an example of using Svelte
writables & immer to create a redux-lite approach to app state.

My approach is (1) testable, (2) barely any code, and (3) a joy to work
with. It may not be "heavy duty", but I think it handles virtually all the
use-cases I've had for Redux in React-land, even more complex ones. 

This explanation assumes knowledge of Redux & Svelte, and in fact replicates
some of the functionality in Redux. Why? Because I use Redux in my React apps
and wanted an excuse to understand some parts of it better. Let's take a
look.

## Svelte Writables + Immer's `produce`

Our entire state model only needs Svelte's `writable` and Immer's `produce`
function. First, we'll create our store and add some initial state that looks
like some of what's in the repository.

```javascript

import { writable } from 'svelte/store';
import produce from 'immer';

const initialState = {
    thing: true,
    randomNumbers: []
} // however you want to define it

const STORE = writable(initialState);

```

Next, we will create a dispatcher that gives us a way to update the state.

```javascript

function dispatch(fcn) {
    STORE.update(state => produce(state, fcn));
}

```

Our `dispatch` function uses Immer's `produce`. Let's write two functions that
we can feed into `dispatch`:

```javascript

const changeThingValue = trueFalse => draftState => {
    draftState.thing = trueFalse;
}

const addRandomNumber = (value = Math.random()) => draftState => {
    draftState.randomNumbers.push(value);
}

```

Here is how you'd use these in the wild:

```javascript

dispatch(changeThingValue(false));
dispatch(addRandomNumber());

```

So these functions all return functions that _close_ over the original
function's arguments, and define some kind of state mutation. This might seem a
little strange if you haven't encountered Immer before, but that's the magic of
`produce` – you pass in an object and a function that mutates some draft of the
object, and it produces a deep copy of the object with the changes. Pretty
magical. 

In the real world, however, one might be in the position of crafting composite /
asyncronous functions that also aim to change the state, perhaps to hit an API
endpoint. Take this one for example:

```javascript
export const requestNewNumbersFromAPI = (someArg) => async () => {
    const numbers = await fetch(`/api/v1/some-args/${someArg}`)
        .then(r => r.json());
    numbers.forEach(value => dispatch(addRandomNumber(value)));
    // what is thingValue? I don't know.
    dispatch(changeThingValue(false));
}

``` 

You could take one of two approaches here: (1) either just call
`requestNewNumbersFromAPI()(dispatch)`, or (2) figure some way to
actually dispatch this composite thing just like we did with the simpler ones. The first option seems kind of weird and
hairy, and it sure would be nice to treat these more complex functions similarly
to our simple state-mutating ones.

My solution (for now) is to always add `async` to these functions, and have
`dispatch` notice if the enclosing function is in fact `async`, and then pass in
the dispatcher directly into the function (rather than expect a draft). Even if
the function isn't inherently asynchronous, it won't really affect the
dispatching one way or another.

Here is one way to treat async functions differently:

```javascript
function dispatch(fcn) {
    if (fcn.constructor.name === 'AsyncFunction') {
        func(dispatch, () => get(STORE));
    } else {
        STORE.update(state, fcn)
    }
}
```

The second function I'm passing into my composite function is the equivalent of
Redux's `getState`. The function then calls `dispatch` again for the atomic
updates. Now when I write a complex function such as
`requestNewNumbersFromAPI`, I can do so like this:

```javascript
export const requestNewNumbersFromAPI = (someArg) => async (dispatch, getState => {
    const numbers = await fetch(`/api/v1/some-args/${someArg}`)
        .then(r => r.json());
    numbers.forEach(value => dispatch(addRandomNumber(value)));
    // turn thingValue into the opposite
    dispatch(changeThingValue(!getState().thingValue));
}
```

This kind of functionality is something you get from the `redux-thunk`
middleware. But I find the pattern common enough
that I rather just have it built into my dispatcher by default.

At this point, if you come from a Redux background, you'll notice that these
draft-mutating functions are replacing action creators entirely in my model. 
There are, of course, tradeoffs to this approach. For one, I don't have any
Redux-like middleware, which may be a bummer if you're used to logging or other
complex things like sagas. Here's the thing, though: I'm just trying to put
together the functionality I care about based on the patterns I've found
helpful. It wouldn't be that hard to mimic Redux's middleware functionality. [It
is pretty slim and easily
copied source
code, after all](https://github.com/reduxjs/redux/blob/master/src/applyMiddleware.js).

Go with your heart.

I also define a function, `connect`, which allows you to better compose the
function with the dispatcher so you don't have to call the latter:

```javascript
const connect = fcn => {
    return (...args) => dispatch(fcn(...args));
}

// in use:

const add = connect(addRandomNumber);
add() // equivalent of dispatch(addRandomNumber());
```

This will come in handy later.

---

The last important part of our store exploration is this: _using_ the store. The
[Svelte
tutorial](https://svelte.dev/tutorial/custom-stores) demonstrates that any
object with a subscribe function will count as a store in Svelte (even if the
functionality is not properly created. I suggest exporting from `store.js` an
object with only `subscribe`, `dispatch`, and `connect`, leaving out the
writable's `update` and `set` to prevent mutating the store in a component
directly.

In other words:

```javascript

export const store = { subscribe: STORE.subscribe, dispatch, connect };

```

All of this functionality could easily be coalesced into a function
`createStore`, similar to what you'd see in Redux.

## components can generically subscribe to STORE directly and use the state, no prob

Because we export a read-only `store`, we can easily subscribe to the
store values we care about directly in our components, a la
`$store.randomNumbers` and so on.

## using state & actions in components

When you use `react-redux`, you
typically define  `mapStateToProps` and `mapDispatchToProps` (for mapping the
store to props & dispatched actions to props, respectively) and `connect` your
component using those two functions.

With that in mind, here's how I handle that functionality in this repo:

1. `mapStateToProps` – In this model the parent component implements the functionality to handle the
   `mapStateToProps` workflow by passing in the props to the children. You could
   write a `mapStateToProps` function, but I haven't.
2. `mapDispatchToProps` – in a similar fashion, one could connect actions to the store
   update function via the `connect` function above – something like 
   ```javascript
   const add = connect(addRandomNumber)
   ```
    – and just pass that down as a prop to each child component. Alternatively, you
    can use Svelte's `setContext` and `getContext` to give your components
    the opportunity to either consume the prop (if passed as such) or attempt to
    fetch from the parent component (in other words, the component that utilizes
    said component). In a component, you can easily construct this
    using something like `export let onDelete = getContext('onDelete')` and
    throw if no prop was passed in / the `getContext` returns `undefined` (that
    is, the parent never calls `setContext('onDelete',
    connect(deleteRandomNumber))`).

A full example with all of these patterns can be found in `RandomNumberList.svelte`.


## conclusion

I think Redux's biggest strength is in evangelizing a conceptual model for
transforming an application's state. I am indebted to that model, which gives me
a great excuse to evade my leaky brain's desire for app-state chaos.

This all said, I feel a wave of relief from escaping the noise and boilerplate
in some of my React / Redux apps. Some of that noise is simply the impression of
a community that feels too loud and opinionated. My time in Svelte-land has
taught me that there are many ways to build an app, and the important thing to
remember is that these frameworks are tools to organize and communicate your
intentions. Svelte + Immer gives me the best of all worlds. For now.
