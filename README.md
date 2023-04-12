# Overview
This package provides a `<Cutter>` component based on [react-three-fiber](https://github.com/pmndrs/react-three-fiber) that can clip and cap `mesh`es in an arbitrary hierarchy tree of `Object3D`/`group`/`mesh` instances in a manner similar to [this](https://codesandbox.io/s/r3f-torus-capped-9f5kyb) example. 

A simple example of usage is something like:

```jsx
import Cutter from '@r3f-cutter/r3f-cutter';

// ...later...
<Cutter plane={xPlane}>
  <mesh position={[0, 0.5, 0]}>
    <boxGeometry />
    <meshStandardMaterial color="orange" />
  </mesh>
</Cutter>
```

![gifted-sound-q3uip1.png](gifted-sound-q3uip1.png)

# Installation

```sh
npm i @r3f-cutter/r3f-cutter
```

# Live Examples
- https://codesandbox.io/s/gifted-sound-q3uip1

# Limitation/Bugs
- Only one plane supported at present. Support for multiple planes will be added. 
- Caps use the same material as the original `mesh`. If a `mesh` uses an array of materials then it is capped using the first material from the list. 
- If the `mesh` is modified after it is initially clipped then the caps are not correctly recomputed. This needs to be fixed.
