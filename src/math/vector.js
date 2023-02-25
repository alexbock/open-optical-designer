"use strict";

class Vector {
    static magnitude(v) {
        let result = 0;
        for (let x of v) {
            result += x * x;
        }
        result = Math.sqrt(result);
        return result;
    }

    static normalized(v) {
        const mag = Vector.magnitude(v);
        let result = v.slice();
        for (let i = 0; i < result.length; i += 1) {
            result[i] /= mag;
        }
        return result;
    }

    static dot(a, b) {
        let result = 0;
        if (a.length != b.length) {
            throw "mismatched dimensions in Vector.dot";
        }
        for (let i = 0; i < a.length; i += 1) {
            result += a[i] * b[i];
        }
        return result;
    }

    static sum(a, b) {
        if (Array.isArray(a) && !Array.isArray(b)) {
            return Vector.sum(a, new Array(a.length).fill(b));
        } else if (!Array.isArray(a) && Array.isArray(b)) {
            return Vector.sum(b, a);
        }

        let result = a.slice();
        for (let i = 0; i < result.length; i += 1) {
            result[i] += b[i];
        }
        return result;
    }

    static product(a, b) {
        if (Array.isArray(a) && !Array.isArray(b)) {
            return Vector.product(a, new Array(a.length).fill(b));
        } else if (!Array.isArray(a) && Array.isArray(b)) {
            return Vector.product(b, a);
        }

        let result = a.slice();
        for (let i = 0; i < result.length; i += 1) {
            result[i] *= b[i];
        }
        return result;
    }
}
