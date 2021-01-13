import socket
import json
from ipdata import ipdata
    
#ipdata = ipdata.IPData('8d90c6670a1a382d168336e0414e6c1aa7b4ed374579437293d07f63')
#a = ipdata.lookup(line.strip())
#arr.append([line.strip(),a["latitude"],a["longitude"]])


HOST = '0.0.0.0'  # Standard loopback interface address (localhost)
PORT = 5000        # Port to listen on (non-privileged ports are > 1023)

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind((HOST, PORT))
    s.listen()
    conn, addr = s.accept()
    with conn:
        print('Connected by', addr)
        while True:
            data = conn.recv(1024).decode()
            try:
                y = json.dumps(data)
                y = json.loads(y)
                print(y)
            except:
                print(data)
            if not data:
                break