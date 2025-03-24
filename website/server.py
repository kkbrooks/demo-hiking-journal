from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class JournalServer(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.dirname(__file__)), **kwargs)

if __name__ == "__main__":
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, JournalServer)
    print("Server running at http://localhost:8000/website/")
    httpd.serve_forever()