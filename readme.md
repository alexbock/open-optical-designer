# Open Optical Designer

Alexander Bock

[Launch Open Optical Designer](https://alexbock.github.io/open-optical-designer/)

![Open Optical Designer Screenshot 2](screenshots/screenshot2.png)
![Open Optical Designer Screenshot 1](screenshots/screenshot1.png)

## Introduction

This is a work-in-progress web application for
designing optical lenses consisting of sequential lens elements.
It is intended to support practical design of, for
example, a large aperture double Gauss lens for a full frame camera with
effective control of image aberrations. Support for mirrors
and the design of reflecting telescopes is planned in the future.

## Features

* Full geometrical ray tracing simulated in 3D
* Aspherical surfaces (conic constant)
* Formula support for dynamically calculated surface properties
* Incoming ray environment control
* Automatic 2D cross section viewport
* Geometric point spread function (spot diagram)
* Display of focal length, effective f-number, and numerical aperture
* Autofocus
* Optical path length and phase
* Axial and transverse chromatic aberration
* Transverse ray aberration
* Material database
* Save/load designs as local JSON files
* Import designs from ".len" files
* Light and dark UI color schemes

## Next Development Priorities

* Mirrors (including systems such as catadioptric telescopes)
* Design Optimization

## Future Plans

* Generate links for sharing designs by URL
* Example designs (achromatic doublet, double Gauss, Cooke triplet, historical lenses, etc.)
* Design generators/wizards (singlet, achromatic doublet, telescope objective, spherical best form lens, etc.)
* Overall surface transmission for unpolarized light
* Field curvature
* Distortion
* Abbe sine condition
* Wavefront analysis
* Modulation transfer function graph
* Through-the-lens scene simulation (test chart, astronomical, custom photo with optional depth map)
* 3D design view
* Material browser/editor

## Potential Future Considerations

* Export standard element drawing PDFs for manufacturing
* Even-degree polynomial terms added to aspherical surfaces
* Anti-reflective coatings
* Tolerances

## Notes

### Aspherical Surfaces

Open Optical Designer supports centered, symmetrical, aspherical surfaces of revolution from curves of the form:

$$ z(y) = \frac{y^2}{R + \sqrt{R^2-(K+1)y^2}} $$

defined by the radius of curvature $R$ and the conic constant $K$. The intersection of a ray with
surfaces defined in this manner is implemented using direct evaluation of the exact solutions for
the intersection of the surface with a parameterized line. The additional even-degree polynomial terms:

$$ {A_4}y^4 + {A_6}y^6  + {A_8}y^8 + {A_{10}}y^{10} + \cdots{} $$

 used for more complex aspherical surfaces are
not currently supported because a more complex procedure is required to determine ray intersections in
the absence of an algebraic solution for the parameter of an intersecting line. The `derivations`
directory contains artifacts from the process of finding these solutions for reference.

### Units

Design parameters use generic measurement units, but designs generally
follow a standard such as considering units equivalent to millimeters. Inputs
and outputs that require specific units (such as the design center wavelength
in micrometers) are labeled appropriately.

### Formula Syntax and Evaluation

A surface input field value beginning with an equals sign (`=`) will be interpreted
as a formula which can include numbers, arithmetic operations, and references to
the final values of other surface fields.

Supported operators: (for arbitrary operands `x` and `y`)

* `x + y`: addition
* `x - y`: subtraction
* `x * y`: multiplication
* `x / y`: division
* `x ^ y`: exponentiation
* `(x)`: parentheses
* `-x`: negation

Supported surface variables: (where `#` is the 1-based surface index)

* `RC#`: radius of curvature
* `AR#`: aperture radius
* `TH#`: thickness
* `CC#`: conic constant

Examples:

* To set the aperture radius of surface 2 to automatically update to match the aperture radius of surface 1, enter `=AR1` into the aperture radius field for surface 2.
* To set the thickness of surface 1 to automatically update to be one quarter of surface 1's radius of curvature, enter `=RC1/4` into the thickness field for surface 1.

### Saving and Loading Files

The "Save JSON File" button will download the current lens design as a JSON file.
Depending on your browser settings, this may prompt for a location and name to save
the file or immediately save the file in your downloads directory with the default name (lens-design.json).
The "Load JSON File" button can be used to load a lens design that was previously saved
to a local file. JSON project files contain both the lens design and the environment settings.

### Importing ".len" Files

The ".len" file import feature imports design surfaces and recognizes the following
surface parameters:

* Radius of curvature
* Aperture radius
* Thickness
* Material
* Conic constant

## Development

### Implemented Using Standard Web Technologies With No External Dependencies

This software does not utilize any external or third-party dependencies,
fonts, images, packages, or frameworks.
It is written in plain, modern JavaScript as a single page application
using standard HTML and CSS with no build, preprocessing, generation, or
transformation steps. It can be run directly in the browser locally
without a web server if desired.

### Unit Tests

Open `tests/test.html` in a browser to run the unit test suite.

## Copyright

See COPYRIGHT.txt.

## License

See LICENSE.txt.
