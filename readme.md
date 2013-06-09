#MailPipe

[![Build Status](https://travis-ci.org/llun/mailpipe.png?branch=master)](https://travis-ci.org/llun/mailpipe)
[![Dependency Status](https://gemnasium.com/llun/mailpipe.png)](https://gemnasium.com/llun/mailpipe)

MailPipe is a small smtp server for convert mail and send to other service. Mail will convert to JSON format and use http post for send to other service. JSON format send to other service will in below format.

    { text: 'Simple mail content',
      headers: 
       { from: 'llun <llun@mail.com>',
         'content-type': 'text/plain; charset=us-ascii',
         'content-transfer-encoding': '7bit',
         subject: 'Sample Mail',
         'message-id': '<D8ADBE6A-0E20-42B7-9F91-50313012FF42@me.com>',
         date: 'Sun, 9 Jun 2013 14:19:28 +0800',
         to: '"My Blog" <user+service@mailpipe.me>',
         'mime-version': '1.0 (Mac OS X Mail 6.5 \\(1508\\))',
         'x-mailer': 'Apple Mail (2.1508)' },
      subject: 'Sample Mail',
      priority: 'normal',
      from: [ { address: 'llun@mail.com', name: 'llun' } ],
      to: [ { address: 'user+service@mailpipe.me', name: 'My Blog' } ] }


## Installation

- Clone the project and install dependencies package.

        git clone git://github.com/llun/mailpipe.git
        cd mailpipe
        npm install

- To seed first user data by run `jake db:seed`. The script will insert first user for your, the username and password is `firstuser` and `password`. This is an optional step.
- That's it

## Run the server

Mailpipe consist two components, web admin and mail service. Mailpipe use MongoDB as database backend. So before start the service, need to export `MONGO_URL` for production environment. Default value is localhost.

To start web admin, start app.js with `node app.js` and mail service, `node mail.js`

There are few options you can configure for both services.

- `-p <port number>` for run admin ui on specific port. default value is `3000`
- `-d <domain name>` to tell what's the domain for this service. default value is `mailpipe.me`
- `-f <number of process>` Number of process for web admin. default value is `1`

