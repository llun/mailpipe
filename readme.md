#MailPipe

[![Build Status](https://travis-ci.org/llun/mailpipe.png?branch=master)](https://travis-ci.org/llun/mailpipe)
[![Dependency Status](https://gemnasium.com/llun/mailpipe.png)](https://gemnasium.com/llun/mailpipe)

MailPipe is a small smtp server for convert mail and send to other service. Mail will convert to JSON format and use http post for send to other service.

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

