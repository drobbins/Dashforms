;(function Dashforms(){

  var global = this,
      app = global.Dashcouch.Apps.Dashforms.app;

  var ddoc = app.get("doc"),
      mainHTML = ddoc.dashapp.templates.main,
      templates = ddoc.dashapp.templates;

  $(".content").html(mainHTML);

  var Field, Fields, FieldView, FieldsView, emptyFields,
      FieldSet, FieldSets, FieldSetView, FieldSetsView, emptyFieldSets,
      Form, FormView,
      EditFieldView,
      Option, Options, emptyOptions;

  Dashforms.Option = Option = Backbone.Model.extend({
    defaults : {
      value : "defaultvalue",
      label : "Default Label"
    }
  });

  Dashforms.Options = Options = Backbone.Collection.extend({
    model : Option
  });

  Dashforms.emptyOptions = emptyOptions = new Options();

  Dashforms.Field = Field = Backbone.Model.extend({
    defaults : {
      type : "text",
      autofill : false,
      help : "",
      label : "",
      rows : 3,
      options : emptyOptions
    }
  });

  Dashforms.Fields = Fields = Backbone.Collection.extend({
    model : Field
  });

  Dashforms.emptyFields = emptyFields = new Fields();

  Dashforms.FieldView = FieldView = Backbone.View.extend({
    tagName : "div",

    className : "control-group",

    initialize : function () {
      _.bindAll(this, "render", "unrender", "renderEdit", "edit",
        "remove", "add", "reRender");
      this.model.bind("change", this.reRender);
      this.bind("start-edit", function(){ this.editing = true; this.render() }, this);
      this.bind("end-edit", function(){ this.editing = false; this.render() }, this);
    },

    edit : function () {
      console.log("Editing", this.model.get("name"));
      new EditFieldView({ model : this.model });
    },

    render : function () {
      var template = _.template(templates[this.model.get("type")]);
      this.$el.html(template(this.model.toJSON()));
      if (this.editing) return this.renderEdit();
      else return this;
    },

    reRender : function () {
      this.$el.empty();
      this.render();
    },

    renderEdit : function () {
      var template = _.template(templates.editbuttons);
      this.$el.prepend(template({ field : this.model.toJSON()}));
      this.delegateEvents({
        "click button.edit-field" : "edit",
        "click button.add-field" : "add",
        "click button.remove-field" : "remove"
      });
      return this;
    },

    unrender : function () {
      this.$el.empty();
    },

    add : function () {
      this.model.collection.add({ name : "NewField"}, { at : this.model.collection.indexOf(this.model)+1 });
    },

    remove : function () {
      this.$el.remove();
      this.model.destroy();
    }
  });

  // Not in use currently
  Dashforms.FieldsView = FieldsView = Backbone.View.extend({
    events : {
      "toggleEdit" : "toggleEdit"
    },
    initialize : function () {
      _.bindAll(this, "createViews", "render", "renderViews", "toggleEdit");
      this.fieldViews = [];
      this.render();
    },
    createViews : function () {
      var fields, fieldViews;

      fields = this.collection;
      fieldViews = this.fieldViews;

      fields.each( function (field) {
        var newFieldView;
        if ( !(_.any(fieldViews, function (fieldView) {
          return field === fieldView.model;
        }))) {
          newFieldView = new FieldView({ model : field })
          fieldViews.splice(fields.indexOf(field), 0, newFieldView);
          if (this.editing) newFieldView.trigger("start-edit");
        }
      }, this);
    },
    render : function () {
      this.createViews();
      this.renderViews();
      return this.$el;
    },
    renderViews : function () {
    }
  });

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
      fieldSets : emptyFieldSets,
      editing : false,
      name : "Awesome New Form"
    }
  });

  Dashforms.FieldSetView = FieldSetView = Backbone.View.extend({
    tagName : "fieldset",

    events : {
      "click button.rename-fieldset" : "rename",
      "click button.add-fieldFieldset" : "addField"
    },

    initialize : function () {
      _.bindAll(this, "render", "createViews", "renderViews", "startEdit", "endEdit", "rename", "addField");
      this.bind("start-edit", this.startEdit);
      this.bind("end-edit", this.endEdit);
      this.model.get("fields").bind("add", this.render);
    },

    addField : function () {
      this.model.get('fields').add({ name : "newfield", label : "New Field"});
    },

    createViews : function () {
      var fields, fieldViews;

      fields = this.model.get("fields");
      fieldViews = this.fieldViews = this.fieldViews || [];

      fields.each( function (field) {
        var newFieldView;
        if ( !(_.any(fieldViews, function (fieldView) {
          return field === fieldView.model;
        }))) {
          newFieldView = new FieldView({ model : field })
          fieldViews.splice(fields.indexOf(field), 0, newFieldView);
          if (this.editing) newFieldView.trigger("start-edit");
        }
      }, this);
    },

    endEdit : function () {
      this.editing = false;
      _.each(this.fieldViews, function (fieldView) {
        fieldView.trigger("end-edit");
      });
      $("legend .pull-right").empty();
    },

    rename : function () {
      this.model.set("legend", prompt("Fieldset Name", this.model.get("legend")));
      this.render();
    },

    render : function () {
      var template = _.template(templates.fieldset),
          $el = this.$el;
      $el.html(template(this.model.toJSON()));
      this.createViews();
      this.renderViews();
      if (this.editing) { this.startEdit(); }
      return this;
    },

    renderViews : function () {
      var $el = this.$el;
      _.each(this.fieldViews, function (fieldView) {
        $el.append(fieldView.render().el);
      });
    },

    startEdit : function () {
      this.editing = true;
      $("legend .pull-right", this.$el).html(templates.fieldseteditbuttons);
      _.each(this.fieldViews, function (fieldView) {
        fieldView.trigger("start-edit");
      });
    }
  });

  Dashforms.FormView = FormView = Backbone.View.extend({
    el : $(".current-form"),

    events : {
      "click button.edit-form" : "toggleEdit",
      "click button.rename-form" : "rename",
      "click button.add-fieldForm" : "addField",
      "click button.add-fieldSet" : "addFieldSet"
    },

    initialize : function () {
      _.bindAll(this, "render", "testForm", "createViews", "rename", "renderViews", "renderHead", "toggleEdit",
        "addField", "addFieldSet");
      this.model = new Form();
      this.model.get('fields').bind("add", this.render);
      this.model.get('fieldSets').bind("add", this.render);
      this.editing = false;
      this.testForm();
    },

    addField : function () {
      this.model.get('fields').add({ name : "newfield", label : "New Field"});
    },

    addFieldSet : function () {
      var nf = new FieldSet({ legend : "New Fieldset", fields : new Fields()});
      this.model.get('fieldSets').add(nf);
      if (this.editing) nf.trigger("start-edit");
    },

    createViews : function () {
      var fields, fieldViews, fieldSets, fieldSetViews;

      fields = this.model.get("fields");
      fieldSets = this.model.get("fieldSets");
      fieldViews = this.fieldViews = this.fieldViews || [];
      fieldSetViews = this.fieldSetViews = this.fieldSetViews || [];

      fields.each( function (field) {
        var newFieldView;
        if ( !(_.any(fieldViews, function (fieldView) {
          return field === fieldView.model;
        }))) {
          newFieldView = new FieldView({ model : field })
          fieldViews.splice(fields.indexOf(field), 0, newFieldView);
          if (this.editing) newFieldView.trigger("start-edit");
        }
      }, this);

      fieldSets.each( function (fieldSet) {
        var newFieldSetView;
        if ( !(_.any(fieldSetViews, function (fieldSetView) {
          return fieldSet === fieldSetView.model;
        }))) {
          newFieldSetView = new FieldSetView({ model : fieldSet });
          fieldSetViews.splice(fieldSets.indexOf(fieldSet), 0, newFieldSetView);
          if (this.editing) newFieldSetView.trigger("start-edit");
        }
      }, this);
    },

    toggleEdit : function () {
      var evt;
      this.editing = !this.editing;
      evt = this.editing ? "start-edit" : "end-edit";
      _.each(this.fieldViews, function (fieldView) {
       fieldView.trigger(evt);
      });
      _.each(this.fieldSetViews, function (fieldSetView) {
       fieldSetView.trigger(evt);
      });
      this.render();
    },

    rename : function () {
      this.model.set("name", prompt("Fieldset Name", this.model.get("name")));
      this.render();
    },

    renderHead : function () {
      var template = _.template(templates.form);
      this.$el.html(template(this.model.toJSON()));
      this.$form = $("form", this.$el);
    },

    renderViews : function () {
      var $el = this.$form;
      _.each(this.fieldViews, function (fieldView) {
        $el.append(fieldView.render().el);
      });
      _.each(this.fieldSetViews, function (fieldSetView) {
        $el.append(fieldSetView.render().el);
      });
    },

    render : function () {
      this.renderHead();
      this.createViews();
      this.renderViews();
      if (this.editing) {
        $(".form-header .pull-right", this.$el).html(templates.formeditbuttons);
      }
      else{
        $(".form-header .pull-right", this.$el).html('<button class="btn edit-form"><i class="icon-pencil"></i></button>');
      }
    },

    testForm : function () {
      var fields, fieldSets, testFields;
      fields = this.model.get('fields');
      fieldSets = this.model.get('fieldSets');
      testFields = [
        { name : "textbox", help : "Enter some text", label : "Waffles"},
        { name : "checkboxes", type : "checkbox", options : new Options([
          { value : "1", label : "One" },
          { value : "2", label : "Two" },
          { value : "2", label : "Three" }
        ])},
        { name : "radios", type : "radio", options : new Options([
          { value : "1", label : "One" },
          { value : "2", label : "Two" },
          { value : "2", label : "Three" }
        ])},
        { name : "single-select", type : "select", options : new Options([
          { value : "1", label : "One" },
          { value : "2", label : "Two" },
          { value : "2", label : "Three" }
        ])},
        { name : "multiple-select", type : "multiple", options : new Options([
          { value : "1", label : "One" },
          { value : "2", label : "Two" },
          { value : "2", label : "Three" }
        ])},
        { name : "textArea", type : "textarea", rows:7 }
      ];
      fields.add(testFields, {silent:true});
      fieldSets.add({ legend : "A FieldSet", fields : new Fields(fields.toJSON()) }, {silent:true});
      //fieldSets.add({ legend : "And Yet Another Copy", fields : fields }, {silent:true});
      this.render();
    }

  });

  Dashforms.EditFieldView = EditFieldView = Backbone.View.extend({
    tagName : "div",
    className : "modal hide fade in",

    events : {
      "change input,select" : "update",
      "click button.add-opt" : "addOption",
      "click button.remove-opt" : "removeOption"
    },

    initialize : function () {
      _.bindAll(this, "render", "update", "addOption", "removeOption");
      this.model.bind("change", this.render);
      this.model.get("options").bind("add", this.render, this);
      this.render();
    },

    render : function () {
      var template = _.template(templates.editmodal);
      this.$el.html(template(this.model.toJSON()));
      this.$el.modal('show');
    },

    update : function () {
      var fieldArray = $("form", this.$el).serializeArray(), fields = {};
      _.each(fieldArray, function (field) {
        fields[field.name] = field.value;
      });
      this.model.set(fields);
    },

    addOption : function() {
      this.model.get("options").add();
      return false;
    },

    removeOption : function() {
    }
  });

  Dashforms.fv = new FormView();

  global.Dashcouch.Apps.Dashforms = Dashforms;
})();
