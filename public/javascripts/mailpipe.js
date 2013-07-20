var Service = Backbone.Model.extend({
  idAttribute: '_id',
  urlRoot: '/services',
  parse: function (res) {
    return res;
  }
});

var Services = Backbone.Collection.extend({
  model: Service,
  url: '/services',
  parse: function (res) {
    return res;
  }
});

var Message = Backbone.Model.extend({
  idAttribute: '_id',
  parse: function (res) {
    return res;
  }
})

var Messages = Backbone.Collection.extend({
  model: Message,
  url: '/messages',
  parse: function (res) {
    return res;
  }
});

var RemoteTemplateView = Backbone.View.extend({
  render: function (cb) {
    var self = this;
    var createElement = function () {
      var data = self.model.toJSON();

      var html = RemoteTemplateView.cache[self.templateFile](data);
      self.setElement(html);

      cb(self);
    }

    if (!RemoteTemplateView.cache[self.templateFile]) {
      $.get('/templates/' + self.templateFile + '.html', function (data) {
        RemoteTemplateView.cache[self.templateFile] = _.template(data);
        createElement();
      });
    }
    else {
      createElement();
    }
  }
});

RemoteTemplateView.cache = {};

var ServiceMenuView = RemoteTemplateView.extend({
  templateFile: 'service-menu',
  events: {
    'switch-change .switch': 'toggleService'
  },

  toggleService: function (e, data) {
    var value = data.value;
    this.model.set('enable', value);
    this.model.save(null, {
      beforeSend: function (xhr) {
        xhr.setRequestHeader('X-CSRF-Token', self.$('#csrf').val());
      }});
  }

});

var ServiceDetailView = RemoteTemplateView.extend({
  templateFile: 'service-info'
});

var MessageListItemView = RemoteTemplateView.extend({
  templateFile: 'mail-list-item'
});

var ServicesView = Backbone.View.extend({
  el: 'body',
  events: {
    'click .service-list li': 'selectService',
    'click #delete-service': 'removeService'
  },
  services: new Services,
  messages: new Messages,
  initialize: function () {
    var self = this;

    var services = this.services;
    this.listenTo(services, 'add', this.addService);
    this.listenTo(services, 'destroy', this.fetchService);
    this.listenTo(services, 'reset', this.resetServices);

    services.fetch({ reset: true });

    var messages = this.messages;
    this.listenTo(messages, 'add', this.addMessage);
    this.listenTo(messages, 'reset', this.resetMessages);
  },

  // Services actions
  selectService: function (e) {
    var self = this;

    if ($(e.target).is('li') || /service\-/.test($(e.target).attr('class'))) {
      this.$('.service-list li').removeClass('active');
      $(e.currentTarget).addClass('active');

      var service = this.services.get($(e.currentTarget).attr('service'));
      this.selected = service;
      
      var view = new ServiceDetailView({ model: service });
      view.render(function (cv) {
        this.$('.service-detail').empty();
        this.$('.service-detail').append(cv.el)

        self.messages.fetch({ reset: true, data: { service: service.id, page: 0 } });
      });
    }
  },
  addService: function (service) {
    var self = this;
    
    var cb = function () {};
    var lastArgument = arguments[arguments.length - 1];
    if (typeof lastArgument === 'function') {
      cb = lastArgument;
    }

    var view = new ServiceMenuView({ model: service });
    view.render(function (cv) {
      self.$('.service-list').append(cv.el);
      cb();
    });
  },
  removeService: function () {
    var confirmDelete = confirm('Do you really want to delete service `' + this.selected.get('name') + '`');
    if (confirmDelete) {
      this.selected.destroy({
        beforeSend: function (xhr) {
          xhr.setRequestHeader('X-CSRF-Token', self.$('#csrf').val());
        }
      });
    }
  },
  resetServices: function () {
    var self = this;
    var services = this.services;

    this.$('.service-list').empty();
    async.forEachSeries(services.models, this.addService, function (err) {
      var els = self.$('.service-list li');
      if (els.length > 0) {
        els[0].click();

        this.$("[data-toggle='switch']").wrap('<div class="switch" />').parent().bootstrapSwitch();
      }
      else {
        window.location = '/services/add.html';
      }
    });
  },
  fetchService: function () {
    this.services.fetch({ reset: true });
  },

  addMessage: function (message) {
    var self = this;
    
    var cb = function () {};
    var lastArgument = arguments[arguments.length - 1];
    if (typeof lastArgument === 'function') {
      cb = lastArgument;
    }

    var view = new MessageListItemView({ model: message });
    view.render(function (cv) {
      self.$('#mails').append(cv.el);
      cb();
    });
  },
  resetMessages: function () {
    var messages = this.messages;

    this.$('#mails').empty();
    async.forEachSeries(messages.models, this.addMessage);
  }
});

var ServiceFormView = Backbone.View.extend({
  events: {
    'click #cancel': 'back',
    'change #service-authentication-type': 'toggleAuthenticationInfo'
  },

  toggleAuthenticationInfo: function (e) {
    // Clear authentication form when changing authentication type
    this.$('#service-key').val('');
    this.$('#service-pass').val('');

    if (e.val === 'none') { $('.authentication-info').hide(); }
    else {
      if (e.val === 'basic') {
        $('.key-field label').html('Username');
        $('.pass-field label').html('Password');
      }
      else if (e.val === 'oauth') {
        $('.key-field label').html('OAuth Key');
        $('.pass-field label').html('OAuth Secret');
      }
      else {
        $('.key-field label').html('Key');
        $('.pass-field label').html('Pass');
      }

      $('.authentication-info').show();
    }
  },

  back: function (e) {
    e.preventDefault();

    window.location = '/main.html';
  }
});

var AddServiceView = ServiceFormView.extend({
  el: 'body',
  events: function () {
    return _.extend({}, ServiceFormView.prototype.events, {
      'submit form': 'addService',
      'change #service-type': 'showOption'
    });
  },

  initialize: function () {
    var module = this.$('#service-type').val();
    this.$('#module-' + module).show();
  },

  addService: function (e) {
    e.preventDefault();

    var self = this;

    var prepare = {};
    var form = $('form').serializeArray();
    _.each(form, function (field) {

      var names = field.name.split('.');
      var level = prepare;
      _.each(names, function (name, index) {
        if (!level[name]) {
          level[name] = {};
        }


        if (index == names.length - 1) {
          level[name] = field.value;
        }
        else {
          level = level[name];
        }
      });

    });

    var csrf = prepare._csrf;
    delete prepare._csrf;

    var input = {
      name: prepare.name,
      type: prepare.type,
      properties: prepare[prepare.type].properties
    }

    var service = new Service(input);
    service.save(null, { wait: true, 
      beforeSend: function (xhr) {
        xhr.setRequestHeader('X-CSRF-Token', self.$('#csrf').val());
      },
      success: function (model,result,xhr) {
        window.location = '/main.html';
      },
      error: function (model,xhr,options) {
        self.$('.alert').html('');
        var list = document.createElement('ul');

        var response = xhr.responseJSON;
        if (response.errors) {
          for (var key in response.errors) {
            var field = response.errors[key];
            var child = document.createElement('li');
              
            if (field.type === 'required') {
              child.textContent = field.path + ' is required';
            }
            else {
              child.textContent = field.type;
            }
            $(list).append(child);
          }
          self.$('.alert').append(list);
        }
        else {
          self.$('.alert').html(response.message);
        }
        self.$('.alert').show();
      }});
  },

  showOption: function (e) {
    var module = $(e.currentTarget).val();
    this.$('.module').hide();
    this.$('#module-' + module).show();
  }
});

var UpdateServiceView = ServiceFormView.extend({
  el: 'body',
  events: function () {
    return _.extend({}, ServiceFormView.prototype.events, {
      'submit form': 'updateService',
      'change #service-type': 'showOption'
    });
  },

  initialize: function () {
    var module = this.$('#service-type').val();
    this.$('#module-' + module).show();
  },

  showOption: function (e) {
    var module = $(e.currentTarget).val();
    this.$('.module').hide();
    this.$('#module-' + module).show();
  },

  updateService: function(e) {
    e.preventDefault();

    var prepare = {};
    var form = $('form').serializeArray();
    _.each(form, function (field) {

      var names = field.name.split('.');
      var level = prepare;
      _.each(names, function (name, index) {
        if (!level[name]) {
          level[name] = {};
        }


        if (index == names.length - 1) {
          level[name] = field.value;
        }
        else {
          level = level[name];
        }
      });

    });

    var csrf = prepare._csrf;
    delete prepare._csrf;

    var input = {
      _id: prepare.id,
      name: prepare.name,
      type: prepare.type,
      properties: prepare[prepare.type].properties,
      enable: prepare.enable
    }

    var self = this;
    var service = new Service(input);
    service.save(null, { wait: true,
      beforeSend: function (xhr) {
        xhr.setRequestHeader('X-CSRF-Token', self.$('#csrf').val());
      },
      success: function (model,result,xhr) {
        if (result.action == 'redirect') {
          window.location = result.url;
          return
        }
        window.location = '/main.html';
      },
      error: function (model,xhr,options) {
        self.$('.alert').html('');
        var list = document.createElement('ul');

        var response = xhr.responseJSON;
        if (response.errors) {
          for (var key in response.errors) {
            var field = response.errors[key];
            var child = document.createElement('li');

            if (field.type === 'required') {
              child.textContent = field.path + ' is required';
            }
            else {
              child.textContent = field.type;
            }
            $(list).append(child);
          }
          self.$('.alert').append(list);
        }
        else {
          self.$('.alert').html(response.message);
        }
        self.$('.alert').show();
      }});
  }
});
