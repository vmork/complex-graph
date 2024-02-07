## Misc
- Dont try to make the sidebar collapse a smooth transition, it doesnt work

## Links
- [glsl tips](https://shadertoyunofficial.wordpress.com/2019/01/02/programming-tricks-in-shadertoy-glsl/)
- [domain coloring](https://www.dynamicmath.xyz/domain-coloring/dcgallery.html)
- [plotting 1D function](https://www.shadertoy.com/view/3sKSWc)
- [complex analysis](https://users.mai.liu.se/hanlu09/complex/domain_coloring.html)

## TODO
- Add options for level curves under controls: 
    - modulus, phase, Re, Im
    - option for the spacing of lines
- Add option for which coloring function to use
    - Choice of different textures? 
    - Or just presets that map to different glsl functions? (yes)

- Change colors of coordinate box 
- Add home button

- Custom language
    - write down rough spec
    - javascript/python ?

- Points on the canvas that can be moved, where the position maps to a vec2 uniform
    - vertex shader / fragment shader / html? Probably html is easiest, but need to figure
    out how to transform correctly after camera movements, ie convert camera world matrix to canvas space matrix (?)