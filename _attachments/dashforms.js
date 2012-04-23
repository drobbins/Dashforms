;(function Dashforms(){

  var global = this,
      app = global.Dashcouch.Apps.Dashforms.app;

  var ddoc = app.get("doc"),
      mainHTML = ddoc.dashapp.templates.main,
      templates = ddoc.dashapp.templates;

  $(".content").html(mainHTML);

  var Field, FieldSet, Form, FieldView, FieldSetView, FormView, emptyFields,
      emptyFieldSets, Dashforms = {};

  Dashforms.Field = Field = Backbone.Model.extend({
    defaults : {
      type : "text",
      autofill : false,
      help : "",
      label : ""
    }
  });

  Dashforms.Fields = Fields = Backbone.Collection.extend({
    model : Field
  });

  Dashforms.emptyFields = emptyFields = new Fields();

  Dashforms.FieldSet = FieldSet = Backbone.Model.extend({
    defaults : {
      fields : emptyFields,
      legend : ""
    }
  });

  Dashforms.FieldSets = FieldSets = Backbone.Collection.extend({
    model : FieldSet
  });

  Dashforms.emptyFieldSets = emptyFieldSets = new FieldSets();

  Dashforms.Form = Form = Backbone.Model.extend({
    defaults : {
      fields : emptyFields,
      fieldSets : emptyFieldSets
    }
  });

  Dashforms.FieldView = FieldView = Backbone.View.extend({
    tagName : "div",

    className : "control-group",

    initialize : function () {
      _.bindAll(this, "render", "unrender", "update");
    },

    render : function () {
      var template = _.template(templates[this.model.get("type")]);
      this.$el.html(template(this.model.toJSON()));
      return this;
    },

    unrender : function () {
    },

    update : function () {
    }
  });

  Dashforms.FieldSetView = FieldSetView = Backbone.View.extend({
    tagName : "fieldset",

    initialize : function () {
      _.bindAll(this, "render");
    },

    render : function () {
      var template = _.template(templates.fieldset),
          fields = this.model.get("fields"),
          $el = this.$el;
      $el.html(template(this.model.toJSON()));
      fields.each(function (field) {
        var fieldView = new FieldView({ model : field });
        $el.append(fieldView.render().el);
      });
      return this;
    }
  });

  Dashforms.FormView = FormView = Backbone.View.extend({
    tageName : "form",
    className : "form-horizontal",

    initialize : function () {
      _.bindAll(this, "render", "testForm");
      this.testForm();
    },

    render : function () {
      var container = $(".current-form"),
          $el = this.$el,
          fields = this.model.get("fields"),
          fieldSets = this.model.get("fieldSets");
      fields.each(function (field) {
        var fieldView = new FieldView({ model : field });
        $el.append(fieldView.render().el);
      });
      fieldSets.each(function (fieldSet) {
        var fieldSetView = new FieldSetView({ model : fieldSet });
        $el.append(fieldSetView.render().el);
      });
      container.html($el);
    },

    testForm : function () {
      var fields, fieldSets, testFields;
      this.model = new Form();
      fields = this.model.get('fields');
      fieldSets = this.model.get('fieldSets');
      testFields = [
        { name : "Text1", help : "Enter some text", label : "Waffles"},
        { name : "Checkboxes", type : "checkbox", options : [
          { value : "1", label : "One" },
          { value : "2", label : "Two" },
          { value : "2", label : "Three" },
        ]},
        { name : "Radios", type : "radio", options : [
          { value : "1", label : "One" },
          { value : "2", label : "Two" },
          { value : "2", label : "Three" },
        ]},
        { name : "Select a Thingy", type : "select", options : [
          { value : "1", label : "One" },
          { value : "2", label : "Two" },
          { value : "2", label : "Three" },
        ]},
        { name : "Select some Thingys", type : "multiple", options : [
          { value : "1", label : "One" },
          { value : "2", label : "Two" },
          { value : "2", label : "Three" },
        ]},
        { name : "Text3" }
      ];
      fields.add(testFields);
      fieldSets.add({ legend : "Another Copy", fields : fields });
      fieldSets.add({ legend : "And Yet Another Copy", fields : fields });
      this.render();
    }
  });

  Dashforms.fv = new FormView();

  global.Dashcouch.Apps.Dashforms = Dashforms;
})();
