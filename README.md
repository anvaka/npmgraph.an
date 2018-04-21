# npmgraph.an

[Visualization of npm](http://npm.anvaka.com) shows dependency graph of an npm package.

Note, due to https://github.com/anvaka/npmgraph.an/issues/1 the website talks
with npm registry through [heroku-hosted proxy](https://github.com/anvaka/corsregistry).
This may have negative impact on latency.

# Screenshots

Default view:
![Default view](https://raw.githubusercontent.com/anvaka/npmgraph.an/master/images/default_view.png)


Responsive view:

![Responsive view](https://raw.githubusercontent.com/anvaka/npmgraph.an/master/images/responsive_view.png)


3d view:
![3d view](https://raw.githubusercontent.com/anvaka/npmgraph.an/master/images/3d_view.png)

# How it's done?

[angular.js](https://angularjs.org/) + [browserify](http://browserify.org/) + [ngraph](https://github.com/anvaka/ngraph) => [gulp](http://gulpjs.com/) => http://npm.anvaka.com/

The website is entirely hosted on [GitHub Pages](https://pages.github.com/), with continous deployment setup via [travis](https://github.com/anvaka/npmgraph.an/blob/master/.travis.yml).

The npm data is coming from `registry.npmjs.cf` and is collected by [npmgraphbuilder](https://github.com/anvaka/npmgraphbuilder) at real time.

For CSS styles I'm using [twitter bootstrap](http://getbootstrap.com/css/) and [less](http://lesscss.org/).

# npm rocks

All modules of this application are provided by [npm](https://github.com/anvaka/npmgraph.an/blob/master/package.json). 

# Local development

```
git clone https://github.com/anvaka/npmgraph.an.git
cd npmgraph.an
npm i
npm start
```

This should start local dev server and serve npm visualization.

# Other projects

Here I will try to list other projects that visualize npm. 

* http://npm.broofa.com/ - renders dependency graph with direct acyclic graph layout alrogirthm.
* [galaxy](https://anvaka.github.io/pm/#/galaxy/npm?cx=-1345&cy=-7006&cz=-6553&lx=0.6217&ly=-0.6459&lz=0.3098&lw=0.3168&ml=150&s=1.75&l=1&v=2017-11-22T00-00-00Z) - 3D gallaxy simulator of npm packages.

If you have other projects that you want to see here, please send me a pull request or a hint.

# license

MIT
