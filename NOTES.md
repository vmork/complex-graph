## Misc
- Dont try to make the sidebar collapse a smooth transition, it doesnt work
- You cant use classes as discriminated union, only interfaces
- `npm run build && git subtree push --prefix public origin gh-pages` to deploy to gh-pages

## Links
- [glsl tips](https://shadertoyunofficial.wordpress.com/2019/01/02/programming-tricks-in-shadertoy-glsl/)
- [domain coloring](https://www.dynamicmath.xyz/domain-coloring/dcgallery.html)
- [plotting 1D function](https://www.shadertoy.com/view/3sKSWc)
- [complex analysis](https://users.mai.liu.se/hanlu09/complex/domain_coloring.html)

## TODO
- Add option for which coloring function to use
    - Choice of different textures? 
    - Or just presets that map to different glsl functions? (yes)

- Add home button
- Add labels to points (positioning)

- Add prefix to each user defined variable to avoid name clashing in fragment.glsl
- Add more functions (iterate, julia, mandelbrot)
    - Implement in glsl or lslg?
    - How to do higher order functions correctly?
- Add anonymous functions (how?)