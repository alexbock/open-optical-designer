"use strict";

class Material {
    constructor(name, complex_refractive_index_at_wavelength, description, tags, reference) {
        this.name = name;
        this.alternate_name = null;
        this.description = description;
        this.tags = tags;
        this.reference = reference;

        // array of [Wavelength (um), Complex(Refractive Index, Extinction Coefficient)]
        this.complex_refractive_index_at_wavelength = complex_refractive_index_at_wavelength;
    }

    complexRefractiveIndex(wavelength) {
        if (!wavelength) { throw "missing wavelength for refractive index"; }
        // returns:
        // * an exact match for the input wavelength,
        // * an inner linear interpolation between two immediately surrounding data points,
        // * or an outer linear interpolation from the first or last two data points
        if (this.complex_refractive_index_at_wavelength.length == 1) {
            return this.complex_refractive_index_at_wavelength[0][1];
        }
        let x = null;
        let y = null;
        for (let entry of this.complex_refractive_index_at_wavelength) {
            if (entry[0] == wavelength) {
                return entry[1];
            } else if (entry[0] < wavelength) {
                x = entry;
            } else if (entry[0] > wavelength) {
                y = entry;
                break;
            }
        }
        if (x === null) {
            x = this.complex_refractive_index_at_wavelength[0];
            y = this.complex_refractive_index_at_wavelength[1];
        } else if (y === null) {
            const len = this.complex_refractive_index_at_wavelength.length;
            x = this.complex_refractive_index_at_wavelength[len - 1];
            y = this.complex_refractive_index_at_wavelength[len - 2];
        }
        let dn = (y[1].real - x[1].real) / (y[0] - x[0]);
        let dk = (y[1].imag - x[1].imag) / (y[0] - x[0]);
        let d = wavelength - x[0];
        let n = x[1].real + d * dn;
        let k = x[1].imag + d * dk;
        return new Complex(n, k);
    }

    refractiveIndex(wavelength) {
        return this.complexRefractiveIndex(wavelength).real;
    }

    extinctionCoefficient(wavelength) {
        return this.complexRefractiveIndex(wavelength).imag;
    }

    static fromJSON(obj) {
        let refr_index_data = [];
        for (let entry of obj.refractive_index) {
            const wavelength = entry[0];
            const n = entry[1];
            const k = entry.length > 2 ? entry[2] : 0;
            refr_index_data.push([wavelength, new Complex(n,k)]);
        }
        let result = new Material(obj.name, refr_index_data, obj.description, obj.tags, obj.reference);
        result.alternate_name = obj.alternate_name;
        return result;
    }
}

const VACUUM_MATERIAL = new Material("Vacuum", [[0, new Complex(1, 0)]], "", [], "");
const PERFECT_MIRROR_MATERIAL = new Material("Perfect Mirror", [[0, new Complex(0, 1)]], "", [ "mirror" ], "");
const AIR_MATERIAL = Material.fromJSON(MATERIAL_DATA[MATERIAL_DATA.findIndex((m) => {
    return m.name == "Air";
})]);
