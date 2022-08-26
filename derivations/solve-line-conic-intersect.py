#!/usr/bin/env python3

from sympy.solvers import solve
from sympy import Symbol, sqrt

# z_0 + tc = (sqrt((x_0 + ta)^2 + (y_0 + tb)^2)^2) / (R + sqrt(R*R - (K+1) * sqrt((x_0 + ta)^2 + (y_0 + tb)^2)^2))

if __name__ == "__main__":
    x_0 = Symbol("x_0")
    y_0 = Symbol("y_0")
    z_0 = Symbol("z_0")
    t = Symbol("t")
    a = Symbol("a")
    b = Symbol("b")
    c = Symbol("c")
    R = Symbol("R")
    K = Symbol("K")
    result1 = solve( -z_0 + -t*c + (sqrt((x_0 + t*a)**2 + (y_0 + t*b)**2)**2) / (R + sqrt(R*R - (K+1) * sqrt((x_0 + t*a)**2 + (y_0 + t*b)**2)**2)) , t )
    result2 = solve( z_0 + t*c + (sqrt((x_0 + t*a)**2 + (y_0 + t*b)**2)**2) / (R + sqrt(R*R - (K+1) * sqrt((x_0 + t*a)**2 + (y_0 + t*b)**2)**2)) , t )
    print("z=+f(x,y):")
    print(str(result1))
    print("z=-f(x,y):")
    print(str(result2))
