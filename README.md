# OIDC RP Demo implementaton
## how to build and run it?
```
$ go build .
$ ./oidc-client -h  # for help
```

e.g.
```
./oidc-client -keyFile my.server.com.key -certFile my.server.com.crt -devMode=false 
```
Then open a browser to access https://my.server.com.

## design 
This demo RP is mostly written in front end JavaScript.

The backend is super simple; it just hosts the html/js/css files and acts as a http proxy.

Duo to CORS (Cross Origin Resource Sharing) issues, frontend JavaScript fetch calls to OP are proxied by 
the backend. 

## warning
Just for fun!
