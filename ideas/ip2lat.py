import time
from ipdata import ipdata
def follow(thefile):
    thefile.seek(0,2)
    while True:
        line = thefile.readline()
        if not line:
            time.sleep(0.1)
            continue
        yield line

if __name__ == '__main__':
    ipdata = ipdata.IPData('8d90c6670a1a382d168336e0414e6c1aa7b4ed374579437293d07f63')
    arr = []
    logfile = open("ssh.out","r")
    loglines = follow(logfile)
    for line in loglines:
        a = ipdata.lookup(line.strip())
        arr.append([line.strip(),a["latitude"],a["longitude"]])
        print(arr)