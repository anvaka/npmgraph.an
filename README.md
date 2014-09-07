# npmgraph.an

[Visualization of npm](http://npm.anvaka.com) shows dependency graph of an npm package.

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

The npm data is coming from `isaacs.iriscouch.com` and is collected by [npmgraphbuilder](https://github.com/anvaka/npmgraphbuilder) in real time.

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

This should start local dev server and serve npm registry.

# license

MIT
