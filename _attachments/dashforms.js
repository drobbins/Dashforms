;(function Dashforms(){

  var global = this,
      app = global.Dashcouch.Apps.Dashforms.app;

  var ddoc = app.get("doc"),
      templates = ddoc.dashapp.templates;

  //$(".content").html(templates.main);

  var DashFormApp,
      Field, Fields, FieldView, FieldsView,
      FieldSet, FieldSets, FieldSetView, FieldSetsView,
      Form, Forms, FormListView, FormView, FormsView,
      EditFieldView,
      Option, Options, OptionView, OptionsView, emptyOptions;

  Dashforms.Option = Option = Backbone.Model.extend({
    defaults : {
      value : "defaultvalue",
      label : "Default Label"
    }
  });

  Dashforms.Options = Options = Backbone.Collection.extend({
    model : Option
  });

  Dashforms.OptionView = OptionView = Backbone.View.extend({
    tagName : 'tr',
    events : {
      "click button.remove-opt" : "remove",
      "change input" : "update"
    },
    initialize : function () {
      _.bindAll(this, 'render', 'remove', 'update');
      this.model.bind("change", this.render);
    },
    remove : function () {
      this.$el.empty();
      this.model.destroy();
    },
    render : function () {
      var template = _.template(templates.editoption);
      this.$el.html(template(this.model.toJSON()));
      return this;
    },
    update : function () {
      var value, label;
      label = $("input[name='opt-label']", this.$el).val();
      value = $("input[name='opt-value']", this.$el).val();
      this.model.set({label : label, value : value});
    }
  });

  Dashforms.OptionsView = OptionsView = Backbone.View.extend({
    tagName : 'fieldset',
    events : {
      "click button.add-opt" : "add"
    },
    initialize : function () {
      _.bindAll(this, 'render', 'renderOptions', 'add');
      this.collection.bind('add', this.render);
      this.optionViews = [];
    },
    add : function () {
      this.collection.add(new Option());
    },
    render : function () {
      this.$el.empty();
      this.$el.html(templates.editoptions);
      this.renderOptions();
      return this;
    },
    renderOptions : function () {
      var $el = this.$el;
      this.collection.each(function (option){
        var optionView;
        optionView = _.find(this.optionViews, function (optionView) {
          return optionView.model === option;
        });
        if (!optionView) {
          optionView = new OptionView({model:option});
        }
        $('tbody.options', $el).append(optionView.render().el);
      });
    }
  });

  Dashforms.emptyOptions = emptyOptions = new Options();

  Dashforms.Field = Field = Backbone.Model.extend({
    defaults : {
      name : "newfield",
      type : "text",
      autofill : false,
      help : "",
      label : "New Field",
      rows : 3,
      options : emptyOptions
    },
    initialize : function () {
      this.set("options", new Options(this.get('options')));
    }
  });

  Dashforms.Fields = Fields = Backbone.Collection.extend({
    model : Field,
    initialize : function () {
      if (this.length === 0) this.add(new Field());
    }
  });

  Dashforms.FieldView = FieldView = Backbone.View.extend({
    tagName : "div",

    className : "control-group",

    events : {
      "click button.edit-field" : "edit",
      "click button.add-field" : "add",
      "click button.remove-field" : "removeField"
    },

    initialize : function () {
      _.bindAll(this, "render", "unrender", "renderEdit", "edit",
        "removeField", "add");
      this.model.bind("change", this.render);
      this.model.get("options").bind("add remove change", this.render);
      this.bind("start-edit", function(){
        this.editing = true; this.render();
      }, this);
      this.bind("end-edit", function(){
        this.editing = false; this.render();
      }, this);
    },

    edit : function () {
      console.log("Editing", this.model.get("name"));
      new EditFieldView({ model : this.model });
      return false;
    },

    render : function () {
      var template = _.template(templates[this.model.get("type")]);
      this.$el.html(template(this.model.toJSON()));
      this.$el.prepend(templates.editbuttons);
      if (this.editing) this.renderEdit();
      this.delegateEvents();
      return this;
    },

    renderEdit : function () {
      $(".edit-buttons", this.$el).removeClass('hide');
    },

    unrender : function () {
      this.$el.empty();
    },

    add : function () {
      var fields = this.model.collection;
      fields.add({ name : "NewField"}, { at : fields.indexOf(this.model)+1 });
    },

    removeField : function () {
      this.$el.remove();
      this.model.destroy();
    }
  });

  Dashforms.FieldSet = FieldSet = Backbone.Model.extend({
    defaults : {
      legend : "New Fieldset"
    },
    initialize : function () {
      var fields = this.get('fields');
      if (!fields){
        this.set('fields', new Fields());
      }
      else if (fields instanceof Array) {
        this.set('fields', new Fields(fields));
      }
    }
  });

  Dashforms.FieldSets = FieldSets = Backbone.Collection.extend({
    model : FieldSet
  });

  Dashforms.FieldSetView = FieldSetView = Backbone.View.extend({
    tagName : "fieldset",

    events : {
      "click button.rename-fieldset" : "rename",
      "click button.remove-fieldset" : "removeFieldset",
      "click button.add-fieldFieldset" : "addField"
    },

    initialize : function () {
      _.bindAll(this, "render", "createViews", "renderViews", "startEdit", "endEdit", "rename", "addField", "removeFieldset");
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
          newFieldView = new FieldView({ model : field });
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
      this.render();
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
      if (this.editing) {
        $("legend .pull-right", this.$el).html(templates.fieldseteditbuttons);
        this.delegateEvents(this.events);
      }
      else $("legend .pull-right", this.$el).empty();
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
      _.each(this.fieldViews, function (fieldView) {
        fieldView.trigger("start-edit");
      });
      this.render();
    },

    removeFieldset : function () {
      this.$el.remove();
      this.model.destroy();
    }
  });

  Dashforms.Form = Form = Backbone.Model.extend({
    defaults : {
      editing : false,
      name : "Awesome New Form"
    },
    initialize : function () {
      if (!this.get('fields')) this.set('fields', new Fields());
      if (!this.get('fieldSets')) this.set('fieldSets', new FieldSets());
    },
    parse : function (response) {
      if (response.fields) response.fields = new Fields(response.fields);
      if (response.fieldSets) response.fieldSets = new FieldSets(response.fieldSets);
      return response;
    }
  });

  Dashforms.Forms = Forms = Backbone.Collection.extend({
    url : "/forms",
    model : Form
  });

  Dashforms.FormView = FormView = Backbone.View.extend({
    tagName : "div",
    className : "current-form",

    events : {
      "click button.edit-form" : "toggleEdit",
      "click button.rename-form" : "rename",
      "click button.add-fieldForm" : "addField",
      "click button.add-fieldSet" : "addFieldSet",
      "click button.remove-form" : "removeForm"
    },

    initialize : function () {
      _.bindAll(this, "render", "testForm", "createViews", "rename", "renderViews", "renderHead", "toggleEdit",
        "addField", "addFieldSet", "removeForm");
      this.model = this.model || new Form();
      this.model.get('fields').bind("add", this.render);
      this.model.get('fieldSets').bind("add", this.render);
      this.editing = false;
      this.render();
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
          newFieldView = new FieldView({ model : field });
          fieldViews.splice(fields.indexOf(field), 0, newFieldView);
          if (this.editing) newFieldView.trigger("start-edit");
        }
      }, this);

      this.fieldViews = _.filter(fieldViews, function (fieldView){
        return fields.indexOf(fieldView.model) !== -1;
      });

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

      this.fieldSetViews = _.filter(fieldSetViews, function (fieldSetView){
        return fieldSets.indexOf(fieldSetView.model) !== -1;
      });
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
      if (!this.editing) this.model.save();
      this.render();
    },

    removeForm : function () {
      this.model.destroy();
      this.$el.empty();
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
      this.delegateEvents();
      return this;
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
      var temp = this.model;
      this.model = "Waffles!!";
      this.model = new Form(temp.toJSON());
      this.render();
    }
  });

  Dashforms.EditFieldView = EditFieldView = Backbone.View.extend({
    tagName : "div",
    className : "modal hide fade in",

    events : {
      "change :not(td)>input,select" : "update"
    },

    initialize : function () {
      _.bindAll(this, "render", "update");
      this.render();
    },

    render : function () {
      var template = _.template(templates.editmodal);
      this.$el.html(template(this.model.toJSON()));
      if (this.model.get("options")){
        this.optionsView = this.optionsView || new OptionsView({collection:this.model.get("options")});
        $("form", this.$el).append(this.optionsView.render().el);
      }
      this.$el.modal('show');
    },

    update : function () {
      var fieldArray = $("form", this.$el).serializeArray(), fields = {};
      _.each(fieldArray, function (field) {
        if (field.name === "opt-label" || field.name === "opt-value") return;
        fields[field.name] = field.value;
      });
      this.model.set(fields);
    }
  });

  Dashforms.FormListView = FormListView = Backbone.View.extend({
    tagName : "li",
    events : {
      'click' : 'load'
    },
    initialize : function () {
      _.bindAll(this, 'render', 'load');
    },
    render : function () {
      var name = this.model.get('name');
      this.$el.html("<a href='#"+name+"'>"+name+"</a>");
      return this;
    },
    load : function () {
      this.options.fv.trigger('load', this.model);
    }
  });

  Dashforms.FormsView = FormsView = Backbone.View.extend({
    el : $(".content"),
    events : {
      'click .new-form' : 'newForm'
    },
    initialize : function () {
      _.bindAll(this, "render", "loadForm", 'newForm');
      this.bind('load', this.loadForm);
      this.collection = new Forms();
      this.collection.fetch({
        success : this.render
      });
      this.collection.bind("add remove change", this.render);
    },
    render : function () {
      var that = this, $el = this.$el;
      $el.html(templates.main);
      this.collection.each(function (form) {
        var flv = new FormListView({model:form, fv:that});
        $(".form-list", $el).append(flv.render().el);
      });
      if (this.currentFormView) {
        this.$el.append(this.currentFormView.render().el);
      }
    },
    loadForm : function (form) {
      if (this.currentFormView) {
        this.currentFormView.remove();
      }
      this.currentFormView = new FormView({model : form});
      this.render();
    },
    newForm : function () {
      this.loadForm(this.collection.create({name:"New Form"}));
    }
  });

  Dashforms.App = new FormsView();

  global.Dashcouch.Apps.Dashforms = Dashforms;
})();
