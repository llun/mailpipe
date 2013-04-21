var Service = Backbone.Model.extend({
  idAttribute: '_id',
  urlRoot: '/services',
  parse: function (res) {
    console.log (res);
    return res;
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
