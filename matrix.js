"use strict";

/*
     0 1
     2 3
*/

function matrix_2x2_multiply(a, b) {
    return [ a[0]*b[0] + a[1]*b[2], a[0]*b[1] + a[1]*b[3],
             a[2]*b[0] + a[3]*b[2], a[2]*b[1] + a[3]*b[3] ];
}
