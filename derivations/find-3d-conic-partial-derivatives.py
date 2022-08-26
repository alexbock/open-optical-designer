#!/usr/bin/env python3

from sympy.solvers import solve
from sympy import Symbol, sqrt, diff

# z = (sqrt(x^2 + y^2)^2) / (R + sqrt(R*R - (K+1) * sqrt(x^2 + y^2)^2))

if __name__ == "__main__":
    x = Symbol("x")
    y = Symbol("y")
    z = Symbol("z")
    R = Symbol("R")
    K = Symbol("K")
    z = (sqrt(x**2 + y**2)**2) / (R + sqrt(R*R - (K+1) * sqrt(x**2 + y**2)**2))
    result_x = diff(z, x)
    result_y = diff(z, y)
    print("dz/dx:")
    print(str(result_x))
    print("dz/dy:")
    print(str(result_y))
