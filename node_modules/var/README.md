Usage
======

Use strongly typed environment variables like a boss:

    npm install var

Then create a file named **env.json** in your root folder. It will contain default values and simple validation rules for your environment variables. **Any environment variables defined prior to reading the env.json file will take precedence**, but will be converted and validated according to the corresponding type inferred from the **env.json** file.

Finally, just require the package, assign it to a variable and use that instead of **process.env**:

    var env = require('var');

**Any variables that aren't defined in process.env will receive the raw, unparsed value from the env.json file**. This allows you, among other things, to set node-specific variables like **NODE_ENV** (useful in **Express**) or **TZ** from **env.json**.

**Warning:** **process.env** can only hold string values. That's the very reason this package exists.

**Warning:** some Node hosting providers don't support using spaces in environment variables through their web interface. You are free to use spaces in **env.json** though.

Supported types
===============

- string
- number
- boolean
- date
- function

Configuration
===============

Strings
-------

You should define default values for Node environment variables first in case you want to reference them later in your configuration:

    {
      "NODE_ENV": "development",
      "TZ": "UTC",
      ...
    }

Numbers
-------

Just slap some numbers:

      "port": 3000

That was still a default value, just a shorthand for:

      "pageSize": {
        "default": 10
      }

Or if you want to be somewhat cryptic:

      "aspectRatio": {
        "type": "number",
        "default": "1.618"
      }

But you don't need to to that, floats are parsed just fine without the quotes and type specification.

What if you don't want a default value, just a strongly typed setting you can depend on:

      "limit": {
        "type": "number"
      }

Unless you set the **required** setting to true, the presence of the variable is optional.

Boolean
-------

It's as simple as that:

      "gzip": true

But even if you set it to the string **"false"** in your server configuration, the type will still be inferred from the **env.json** settings, so env.gzip would evaluate to the boolean **false**, not to the string **"false"**.

Dates
-----

Just use anything that returns a valid date after being called with new Date():

      "minDate": {
        "type": "date",
        "default": "1899-12-31"
      }

Functions
-------

Let's try something more sophisticated:

      "maxSessionLength": {
        "type": "function",
        "default": "60 * 60 * 1000"
      }

Or why not be a bit more dynamic:

      "maxExtendedSessionLength": {
        "type": "function",
        "default": "30 * 24 * this.maxSessionLength"
      }

Yes, **this** refers to the already parsed environment variables, so order is important. And you didn't hope circular references would work, did you?

Let's see another example:

      "version": {
        "type": "function",
        "default": "new Date().getTime()"
      }

**Warning:** Functions aren't strongly typed, so if you wanted to set the value to a string in your server configuration, you can.

Enviroments
-----------

But what about different environments:

      "sessionSecret": {
        "development": "my secret key",
        "required": true
      }

This sets a default value in development, but throws an error if **sessionSecret** is not defined in the production configuration. Failing to do so often results in the encryption algorithm failing.

You can use anything for an environment name, except **type**, **default** and **required**:

      "logLevel": {
        "development": 3,
        "test": 2,
        "production": 1,
        "default": 0
      }

License
=======
Copyright (c) 2013 Vladimir Sabev

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
