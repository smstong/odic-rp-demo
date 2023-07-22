package main

import (
	"embed"
	"io"
	"io/fs"
	"log"
	"net/http"
	"strings"
)

//go:embed ui
var UI embed.FS

// OIDC RP server
type Server struct {
	homeURL string
	devMode bool
}

func NewServer(homeURL string, devMode bool) *Server {
	if !strings.HasSuffix(homeURL, "/") {
		homeURL += "/"
	}
	server := Server{
		homeURL: homeURL,
		devMode: devMode,
	}
	return &server
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	log.Println(r.URL)

	//routing
	path := strings.TrimPrefix(r.URL.String(), s.homeURL)
	if strings.HasPrefix(path, "proxy") {
		s.Proxy(w, r)
	} else if strings.HasPrefix(path, "demo") {
	} else {
		s.serveFile(w, r)
	}
}
func (s *Server) serveFile(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		log.Println("Todo: need to relay post to font end")
	}
	log.Println(s.devMode)
	if s.devMode {
		log.Println("using OS file system")
		http.StripPrefix(s.homeURL, http.FileServer(http.Dir("ui"))).ServeHTTP(w, r)
	} else {
		log.Println("using embeded file system")
		uiFS, err := fs.Sub(UI, "ui")
		if err != nil {
			panic(err)
		}
		http.StripPrefix(s.homeURL, http.FileServer(http.FS(uiFS))).ServeHTTP(w, r)
	}
}

// proxy http request to solve CORS problem
func (s *Server) Proxy(w http.ResponseWriter, r *http.Request) {
	httpClient := &http.Client{}
	url := strings.TrimPrefix(r.URL.RequestURI(), s.homeURL+"proxy/")

	log.Println("target: " + url)

	req, err := http.NewRequest(r.Method, url, r.Body)
	req.Header = r.Header
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Println("proxying....")
	resp, err := httpClient.Do(req)
	if err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	io.Copy(w, resp.Body)
}
