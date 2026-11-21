import os, http.server, socketserver
os.chdir("/Users/brendowbreda/Downloads/claude/whitelabel-bicho")
handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", 4181), handler) as httpd:
    print("Serving on port 4181")
    httpd.serve_forever()
