"use strict";

function runMathTests(t) {
    t.group_name = "math";
    // Vector.magnitude
    t(() => Vector.magnitude([0,0]), 0);
    t(() => Vector.magnitude([5,0,0]), 5);
    t(() => Vector.magnitude([0,-5]), 5);
    t(() => Vector.magnitude([5, 5, 5, 5]), 10);
    t(() => Math.ceil(Vector.magnitude([303.9, 700, 1900])), 2048);
    // TODO add tests for other vector and matrix functions
}
