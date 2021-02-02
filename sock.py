import socket
import json
from ipdata import ipdata
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

ipdata = ipdata.IPData('8d90c6670a1a382d168336e0414e6c1aa7b4ed374579437293d07f63')

HOST = os.environ.get("HOST") # Standard loopback interface address (localhost)
PORT = int(os.environ.get("PORT")) # Port to listen on (non-privileged ports are > 1023)

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind((HOST, PORT))
    s.listen()
    conn, addr = s.accept()
    with conn:
        print('Connected by', addr)
        while True:
            data = conn.recv(1024).decode()
            try:
                data_arr = data.split()
                if(data_arr[3] == "root" or data_arr[3] == "pi"):
                    user = data_arr[3]
                    ip = data_arr[5]
                else:
                    user = data_arr[5]
                    ip = data_arr[7]
                port = data_arr[-2]
                data = ipdata.lookup(ip)
                lat_long = [data["latitude"],data["longitude"]]
                print(user,ip,port,lat_long)
            except:
                print("fail")
                # skip
            if not data:
                break