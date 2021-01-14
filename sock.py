import socket
import json
from ipdata import ipdata
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

#ipdata = ipdata.IPData(os.environ.get("IPDATA_KEY"))
#a = ipdata.lookup(line.strip())
#arr.append([line.strip(),a["latitude"],a["longitude"]])


HOST = os.environ.get("HOST") # Standard loopback interface address (localhost)
PORT = int(os.environ.get("PORT"))       # Port to listen on (non-privileged ports are > 1023)
print(type(HOST),type(PORT))
x = []

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
                print(y["message"])
                print(y)
            except:
                print("fail")
                print(data)
            if not data:
                break
print(x)