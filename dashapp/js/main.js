function Dashforms(app){
  var ddoc = app.get("doc"),
      mainHTML = ddoc.dashapp.templates.main;

  $(".content").html(mainHTML);

  var Field, FieldSet, Form, FieldView, FieldSetView, FormView, emptyFields,
      emptyFieldSets;

  Field = Backbone.Model.extend({
    defaults : {
      name : "defaultField",
      type : "text",
      autofill : false
    }
  });

  Fields = Backbone.Collection.extend({
    model : Field
  });

  emptyField = new Fields();

  FieldSet = Backbone.Model.extend({
    defaults : {
      fields : emptyFields,
      legend : ""
    }
  });

  FieldSets = Backbone.Collection.extend({
    model : FieldSet
  });

  emptyFieldSets = new FieldSets();

  Form = Backbone.Model.extend({
    defaults : {
      fields : emptyFields,
      fieldSets : emptyFieldSets
    }
  });

  FieldView = Backbone.View.extend({
    tagName : "div",

    className : "contro-group",

    initialize : function () {
      _.bindAll(this, "render", "unrender", "update");
    },

    render : function () {
      var template = ddoc.dashapp.templates[this.model.get("type")];
      this.$el.html(template(this.model.toJSON()));
      return this;
    }

  });

  FieldSetView = Backbone.View.extend({
    tagName : "fieldset",

    initialize : function () {
      _.bindAll(this, "render");
    },

    render : function () {
      var template = ddoc.dashapp.templates.fieldset;
      this.$el.html(template(this.model.toJSON()));
      return this;
    }
  });

  FormView = Backbone.View.extend({
    tageName : "form",

    initialize : function () {
      _.bindAll(this, "render", "testForm");
      this.testForm();
    },

    render : function () {
      var container = $("#current-form"),
          $el = this.$el,
          fields = this.model.get("fields"),
          fieldSets = this.model.get("fieldSets");
      _(fields).each(function (field) {
        var fieldView = new FieldView({ model : field });
        $el.append(fieldView.render().el);
      });
      _(fieldSets).each(function (fieldSet) {
        var fieldSetView = new FieldSetView({ model : fieldSet });
        $el.append(fieldSetView.render().el);
      });
    },

    testForm : function () {
      var fields, fieldSets, testFields;
      this.model = new Form();
      fields = this.model.get('fields');
      fieldSets = this.model.get('fieldSets');
      testFields = [
        { name : "Text1" },
        { name : "Text2" },
        { name : "Text3" }
      ];
      fields.add(testFields);
      this.render();
    }
  });
}
