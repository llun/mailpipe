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
    'click input': 'toggleRadio'
  },

  toggleRadio: function (e) {
    this.$('.toggle').toggleClass('toggle-off');
    
    var val = $(e.target).val();
    if (val === 'off') { this.model.set('enable', true); }
    else { this.model.set('enable', false); }
    this.model.save(null, {
      beforeSend: function (xhr) {
        xhr.setRequestHeader('X-CSRF-Token', self.$('#csrf').val());
      }});
  }
});

var ServiceDetailView = RemoteTemplateView.extend({
  templateFile: 'service-info'
});

var ServicesView = Backbone.View.extend({
  el: 'body',
  events: {
    'click .service-list li': 'selectService',
    'click #delete-service': 'removeService'
  },
  services: new Services,
  initialize: function () {
    var self = this;

    var services = this.services;
    this.listenTo(services, 'add', this.addService);
    this.listenTo(services, 'destroy', this.fetchService);
    this.listenTo(services, 'reset', this.resetServices);

    services.fetch({ reset: true });
  },

  // Services actions
  selectService: function (e) {
    var self = this;

    if ($(e.target).is('li') || /service\-/.test($(e.target).attr('class'))) {
      this.$('.service-list li').removeClass('selected');
      $(e.currentTarget).addClass('selected');

      var service = this.services.get($(e.currentTarget).attr('service'));
      this.selected = service;
      
      var view = new ServiceDetailView({ model: service });
      view.render(function (cv) {
        this.$('.service-detail').empty();
        this.$('.service-detail').append(cv.el)
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
    var services = this.services;

    self.$('.service-list').empty();
    async.forEachSeries(services.models, this.addService);
  },
  fetchService: function () {
    this.services.fetch({ reset: true });
  }
});

var AddServiceView = Backbone.View.extend({
  el: 'body',
  events: {
    'change #service-authentication-type': 'toggleAuthenticationInfo',
    'click #cancel': 'back',
    'submit form': 'addService'
  },

  toggleAuthenticationInfo: function (e) {
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
    window.location = '/main.html';
  },

  addService: function (e) {
    e.preventDefault();

    var self = this;
    var service = new Service({
      name: self.$('#service-name').val(),
      target: self.$('#service-url').val(),
      authentication: {
        type: self.$('#service-authentication-type').val(),
        key: self.$('#service-key').val(),
        pass: self.$('#service-pass').val()
      }
    });
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
          console.log (field);
        }
        self.$('.alert').append(list);
        self.$('.alert').show();
      }});
  }
});
