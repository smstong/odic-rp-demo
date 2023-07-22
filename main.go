package main

import (
	"flag"
	"log"
	"net/http"
)

func main() {
	var certFile string
	var keyFile string
	var homeURL string
	var listen string
	var devMode bool

	flag.StringVar(&certFile, "certFile", "", "x509 certificate file")
	flag.StringVar(&keyFile, "keyFile", "", "x509 key file")
	flag.StringVar(&listen, "listen", "0.0.0.0:443", "this listen address IP:port")
	flag.StringVar(&homeURL, "homeURL", "/", "the relative path of home URL")
	flag.BoolVar(&devMode, "devMode", true, "run in development mode")
	flag.Parse()

	log.Printf("listen: %s\nhomeURL:%s\n", listen, homeURL)
	server := NewServer(homeURL, devMode)

	if certFile != "" && keyFile != "" {
		log.Fatal(http.ListenAndServeTLS(listen, certFile, keyFile, server))
	} else {
		log.Fatal(http.ListenAndServe(listen, server))
	}
}
