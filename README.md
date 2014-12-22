# Lens

<!--**Lens** provides a novel way of looking at content on the web. It is designed to make life easier for researchers, reviewers, authors and readers. For example, have you tried to look at a figure in an online article, while at the same time trying to see what the author says about the figure, jumping all around the article, losing track of what you were looking for in the first place? The reason for this is that most online research articles are published in a fixed digital version of the original paper. With Lens, we take full advantage of the internet’s flexibility.-->

**Lens** provides a novel way of looking at content on the web. It is designed to make life easier for researchers, reviewers, authors and readers.

- **Read the [announcement](http://elifesciences.org/elife-news/lens)**
- **Watch the [introduction video](http://vimeo.com/67254579).**
- **See Lens in [action](http://lens.elifesciences.org/00778)**

<!--
## The Lens Article Format

XML-based formats such as NLM are hard to consume by web clients. Existing formats target print, and thus contain style information, which makes them hard to process by computer programs. We needed strict separation of content for our vision, so we developed the Lens Article Format.

The Lens Article is based on the [Substance Document Model](http://github.com/substance/document) and features basic content types such as paragraphs and headings, as well as figure types, such as images, tables and videos complete with captions and cross-references. Each content element lives as a node in a flat address space, identified by a unique id. Think of it as a database of independent content fragments. The document definitions can easily be extended. Developers can either create their own flavours or contribute to the Lens Article Format directly.
-->

## Using Lens

Lens is a stand-alone web component that can be embedded into any web page. Just take the contents from the latest [distribution](https://github.com/elifesciences/lens/releases), then adjust the `document_url` parameter in `index.html`.

```js
// Endpoint must have CORS enabled, or file is served from the same domain as the app
var documentURL = "https://s3.amazonaws.com/elife-cdn/elife-articles/00778/elife00778.xml";

var app = new Lens({
  document_url: documentURL
});
```

Lens can display any NLM XML document or, alternatively, the Lens-native JSON representation. Lens is pure client-side Javascript, so anyone (even authors) can host their own documents on a regular webspace.

## Lens development

Lens is meant to be extended and customized. Touch the code!

### Prerequisites

For Lens development, you need to have Node.js >=0.10.x installed.

#### Substance Screwdriver

Lens uses a custom Python tool to manage Git repositories, the [Substance Screwdriver](http://github.com/substance/screwdriver).

To install Substance Screwdriver do

```bash
$ git clone https://github.com/substance/screwdriver.git
```

and install it globally

```bash
$ cd screwdriver
$ sudo python setup.py install
```

You need to repeat that install step whenever you updated the screwdriver repo.

### Setup

1. Clone the lens-starter repository

  ```bash
  $ git clone https://github.com/elifesciences/lens-starter.git
  ```

2. Fetch dependencies

  ```bash
  $ cd lens-ams
  $ substance --update
  ```

3. Run the server

  ```bash
  ~/projects/lens-ams $ node server
  Lens running on port 4001
  http://127.0.0.1:4001/
  ```

4. Open in browser

This will show you a simple index page with links to sample files.

5. Updates

To receive all new changes update the main repo and then use the screwdriver again

```
$ git pull
$ substance --update
```

### Panels

Lens can easily be extended with a customized panel. It can be used to show additional information relevant to the displayed article. A few examples of what you could do:

- Pull in tweets that talk about the current article
- Pull in metrics (click count, number of articles citing that article etc.)
- Retrieve related articles dynamically (e.g. important ones that reference the existing one)

For demonstration we will look at the implementation of a simple Altmetrics panel. It will pull data asynchronously from the Altmetrics API (http://api.altmetric.com/v1/doi/10.7554/eLife.00005) and render the information in Lens.


#### Panel Definition

This is the main entry point for a panel.

```js
// src/panels/altmetrics/index.js
"use strict";

var Panel = require('lens').Panel;
var AltmetricsController = require('./altmetrics_controller');

var panel = new Panel({
	name: "altmetrics",
  type: 'resource',
  title: 'Altmetrics',
  icon: 'fa-bar-chart',
});

panel.createController = function(doc) {
  return new AltmetricsController(doc, this.config);
};

module.exports = panel;
```

#### Panel Controller

Our custom controller provides a `getAltmetrics` method, that we will use in the view to fetch data from altmetrics.com asynchronously. Using the Substance Document API we retrieve the DOI, which is stored on the `publication_info` node.

```js
// src/panels/altmetrics_controller.js

var PanelController = require("lens").PanelController;
var AltmetricsView = require("./altmetrics_view");

var AltmetricsController = function(document, config) {
  PanelController.call(this, document, config);
};

AltmetricsController.Prototype = function() {
  this.createView = function() {
    return new AltmetricsView(this, this.config);
  };

  this.getAltmetrics = function(cb) {
    var doi = this.document.get('publication_info').doi;

		$.ajax({
		  url: "http://api.altmetric.com/v1/doi/"+doi,
		  dataType: "json",
		}).done(function(res) {
			cb(null, res);
		}).error(function(err) {
			cb(err);
		});
  };
};

AltmetricsController.Prototype.prototype = PanelController.prototype;
AltmetricsController.prototype = new AltmetricsController.Prototype();

module.exports = AltmetricsController;
```

#### Panel View

The Panel View is where you define, what should be rendered in your custom panel. Your implementation needs to inherit from `Lens.PanelView` and define a render method. The implementation of the altmetrics panel is pretty simple. We will show the panel (`PanelView.showToggle`) as soon as data from altmetric.com has arrived.

```js
// src/panels/altmetrics_view.js
var PanelView = require('lens').PanelView;

var AltmetricsView = function(panelCtrl, config) {
  PanelView.call(this, panelCtrl, config);

  this.$el.addClass('altmetrics-panel');

  // Hide toggle on contruction, it will be displayed once data has arrived
  this.hideToggle();
};

AltmetricsView.Prototype = function() {

  this.render = function() {
    var self = this;
    this.el.innerHTML = '';

    this.controller.getAltmetrics(function(err, altmetrics) {
      if (!err) {
        self.renderAltmetrics(altmetrics);  
      } else {
        console.error("Could not retrieve altmetrics data:", err);
      }
    });
    
    return this;
  };

  this.renderAltmetrics = function(altmetrics) {
    // Finally data is available so we tell the panel to show up as a tab
    this.showToggle();

    var $altmetrics = $('<div class="altmetrics"></div>');
    $altmetrics.append($('<div class="label">Altmetric.com Score</div>'));
    $altmetrics.append($('<div class="value"></div>').text(altmetrics.score));
    $altmetrics.append($('<div class="label">Cited on Twitter</div>'));
    $altmetrics.append($('<div class="value"></div>').text(altmetrics.cited_by_tweeters_count));
    $altmetrics.append($('<div class="label">Readers on Mendeley</div>'));
    $altmetrics.append($('<div class="value"></div>').text(altmetrics.readers.mendeley));
    $altmetrics.append($('<div class="copyright">Data provided by <a href="http://altmetric.com">altmetrics.com</div>'));

    this.$el.append($altmetrics);
  };
};

AltmetricsView.Prototype.prototype = PanelView.prototype;
AltmetricsView.prototype = new AltmetricsView.Prototype();
AltmetricsView.prototype.constructor = AltmetricsView;

module.exports = AltmetricsView;
```

#### Activate Panel

In the app definition file `src/app.js` find the following line:

```js
var panels = Lens.getDefaultPanels();
```

Now you are able to manipulate that array to include an additional panel. This code adds the altmetrics panel to the next to last position (before the info panel).

```js
var altmetricsPanel = require('./panels/altmetrics');
panels.splice(-1, 0, altmetricsPanel);
```

### Custom CSS

Lens can be styled with custom CSS easily. You can put a CSS file anywhere and reference it from the style section in `project.json`. E.g. the styles for the altmetrics panel were referenced like that.

```js
// .screwdriver/project.json
In order to consider 

  "styles": {
    ...
    "styles/altmetrics.css": "src/panels/altmetrics/altmetrics.css",
    ...
  },
```

### Converter

Lens can natively read the JATS (formerly NLM) format, thanks to its built-in converter.
Conversion is done on the client side using the browser-native DOM Parser.

```js
var importer = new LensImporter();
var doc = importer.import(xmlData, {
  // this path is used to resolve relative figure urls
  baseURL: "http://docs.example.com/doc-25/"
});
```


### Bundling

You need to have `browserify` and `uglify-js` installed.

```bash
$ sudo npm install -g browserify uglify-js
```

A bundle is created via:

```bash
$ substance --bundle
```

There are two options available (not-minified JS bundle, bundle with sourcemap):

```bash
$ substance --bundle nominify,sourcemap
```

To control which assets are bundled adjust the `assets` block in `.screwdriver/project.json`.

After bundling you can serve the bundle e.g. using

```bash
$ cd dist
$ pyhton -m SimpleHTTPServer
```

To open one of the bundled samples you need open the following URL in your browser

```bash
http://127.0.0.1:8000/doc.html?url=data/samples/preprocessed/bproc1.xml
```

Adjust the 'url' parameter to open a different document.


## Advanced tools

### Sublime 2 Integration

We use a custom Sublime plugin which adds a summary page to show all pending changes so that we do not forget to commit and push changes to some of the sub-modules.

MacOSX:

```bash
$ cd $HOME/Library/Application Support/Sublime Text 2/Packages
$ git clone https://github.com/substance/sublime.git Substance
```

Linux (Ubuntu):

```bash
$ cd ~/.config/sublime-text-2/Packages
$ git clone https://github.com/substance/sublime.git Substance
```

## Credits

Lens was developed in collaboration between [UC Berkeley](http://bioegrad.berkeley.edu/) graduate student [Ivan Grubisic](http://www.linkedin.com/pub/ivan-grubisic/26/353/739) and [eLife](http://elifesciences.org). The team of [Substance](http://substance.io) is helping with the technical execution.

Substantial contributions were made by [HighWire](highwire.org), which launched Lens for a number of science journals in fall 2014 (The Journal of Biological Chemistry, The Plant Cell, Journal of Lipid Research, mBio®, and more). [The American Mathematical Society (AMS)](http://ams.org/) made Lens ready for rendering math articles.

Thanks go to the following people, who made Lens possible:

- Ivan Grubisic (concept, dev)
- Ian Mulvany (leadership)
- Oliver Buchtala (dev)
- Michael Aufreiter (dev)
- Graham Nott (infrastructure)
- Rebecca Close (converter)
- Felix Breuer (math)
- Peter Krautzberger (math)
- Samo Korošec (design)

<!-- 
	TODO:
	
	- proper converter docs (custom property)
	- update to fontawesome 4.2.0
	update jquery
-->
