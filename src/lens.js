"use strict";

var Application = require("substance-application");
var LensController = require("./lens_controller");
var Converter = require("lens-converter");

var ROUTES = [
  {
    "route": ":context/:node/:resource/:fullscreen",
    "name": "document-resource",
    "command": "openReader"
  },
  {
    "route": ":context/:node/:resource",
    "name": "document-resource",
    "command": "openReader"
  },
  {
    "route": ":context/:node/:resource",
    "name": "document-resource",
    "command": "openReader"
  },
  {
    "route": ":context/:node",
    "name": "document-node",
    "command": "openReader"
  },
  {
    "route": ":context",
    "name": "document-context",
    "command": "openReader"
  },
  {
    "route": "url/:url",
    "name": "document-context",
    "command": "openReader"
  },
  {
    "route": "",
    "name": "document",
    "command": "openReader"
  }
];

// The Lens Application
// ========
//

var Lens = function(config) {
  config = config || {};
  config.routes = ROUTES;
  Application.call(this, config);

  var panelSpecs = require('./panel_specification');
  var panelFactory = new Lens.Reader.PanelFactory(panelSpecs);
  config.panelFactory = panelFactory;
  config.converter = new Converter.Importer();

  this.controller = new LensController(config);
};

Lens.Article = require("lens-article");
Lens.Reader = {
  Controller: require('./reader_controller'),
  View: require('./reader_view'),
  PanelFactory: require('./panel_factory')
};
Lens.Outline = require("lens-outline");

Lens.Prototype = function() {

  // Start listening to routes
  // --------

  this.render = function() {
    this.view = this.controller.createView();
    this.$el.html(this.view.render().el);
  };

};

Lens.Prototype.prototype = Application.prototype;
Lens.prototype = new Lens.Prototype();
Lens.prototype.constructor = Lens;

module.exports = Lens;
