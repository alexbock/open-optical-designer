# Open Optical Designer

Alexander Bock

## Introduction

This is an early work-in-progress web application for
designing optical lenses consisting of sequential lens elements.
It is initially intended to support practical design of, for
example, a large aperture double Gauss lens for a full frame camera with
effective control of image aberrations. Support for mirrors
and the design of reflecting telescopes is planned in the future.

## Features

* Full geometrical ray tracing simulated in 3D
* Aspherical surfaces (conic constant)
* Incoming ray environment control
* Automatic 2D cross section viewport
* Material database
* Paraxial calculation of focal length and f-number
* Import designs from ".len" files
* Light and dark UI color schemes

## Planned Functionality

* Save/load designs as local files
* Geometric spot diagram
* Point spread function simulation
* Modulation transfer function graph
* Report:
    * Axial chromatic aberration
    * Field curvature
    * Spherical aberration
    * Coma
    * Distortion
    * Overall surface transmission for unpolarized light
    * Abbe sine condition
    * Optical path difference
    * Optical phase difference
    * Wavefront analysis
* Numerical aperture and effective f-number
* Define surface properties in terms of a formula
* Optimization
* Anti-reflective coatings
* Even-degree polynomial terms added to aspherical surfaces
* Distortion grid simulation
* Through-the-lens astronomical scene simulation
* Through-the-lens test chart rendering simulation
* High-resolution lens element model export for computer-controlled manufacturing
* Mirrors (including systems such as catadioptric telescopes)
* Design generators/wizards (singlet, achromatic doublet, telescope objective, spherical best form lens, etc.)
* Example designs (achromatic doublet, double Gauss, Cooke triplet, expired camera lens patents, etc.)
* Material browser
* Export standard element drawing PDFs for commercial manufacturing

## Design Notes

### Aspherical Surfaces

Open Optical Designer supports centered, symmetrical, aspherical surfaces of revolution from curves of the form:

$$ z(y) = \frac{y^2}{R + \sqrt{R^2-(K+1)y^2}} $$

defined by the radius of curvature $R$ and the conic constant $K$. The intersection of a ray with
surfaces defined in this manner is implemented using direct evaluation of the exact solutions for
the intersection of the surface with a parameterized line. The additional even-degree polynomial terms
(${A_4}y^4 + {A_6}y^6  + {A_8}y^8 + {A_{10}}y^{10}$ etc.) used for more complex aspherical surfaces are not currently supported because a more complex procedure is required to determine ray intersections in the absence of an
algebraic solution for the parameter of an intersecting line. The `derivations` directory contains artifacts
from the process of finding these solutions for reference.

### Implemented Using Standard Web Technologies With No External Dependencies

This software does not utilize any external or third-party dependencies,
fonts, images, packages, or frameworks.
It is written in plain, modern JavaScript as a single page application
using standard HTML and CSS with no build, preprocessing, generation, or
transformation steps. It can be run directly in the browser locally
without a web server if desired.
