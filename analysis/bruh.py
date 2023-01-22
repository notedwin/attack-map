# script to run on host to analyze nginx logs
import os
import re
import gzip
from urllib.parse import unquote

debug = False

def count_ip(ip_list):
    ip_count = {}
    for ip in ip_list:
        ip_count[ip] = ip_count.get(ip, 0) + 1
    return ip_count

def count_url(url_list):
    url_count = {}
    for url in url_list:
        url_count[url] = url_count.get(url, 0) + 1
    return url_count


def main():
    # move to the directory where the data is
    os.chdir('/var/log/nginx')

    # list of all the files in the directory
    files = os.listdir()

    records = []
    print('Reading log files...')
    for f in files:
        if not f.startswith('access.log'):
            continue

        lines = None
        if f.endswith('.gz'):
            fh = gzip.open(f, 'rb')
            # readlines as utf-8
            lines = [l.decode('utf-8') for l in fh.readlines()]
        else:
            fh = open(f)
            lines = fh.readlines()
        
        fh.close()

        for line in lines:
            match = re.match(r'(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}) - - \[(\d{2}/\w{3}/\d{4}:\d{2}:\d{2}:\d{2} \+\d{4})\] \"(.*?)\" \d{0,3} \d{0,3}', line)
            if match:
                ip = match.group(1)
                date = match.group(2)
                url = match.group(3)
                records.append((ip, date, url))
            else:
                if debug:
                    print('No match: {}'.format(line))
                

    print('Processing {} records...'.format(len(records)))

    ip_list = []
    url_list = []
    for record in records:
        ip_list.append(record[0])
        url_list.append(record[2])

    ip_count = count_ip(ip_list)
    top_ip = sorted(ip_count.items(), key=lambda x: x[1], reverse=True)[:10]
    url_count = count_url(url_list)
    top_url = sorted(url_count.items(), key=lambda x: x[1], reverse=True)[:10]

    print('\nIPs:')
    # print top 10 IPs
    for ip in top_ip:
        print('{}: {}'.format(ip[0], ip[1]))
    

    print('\nURLs:')
    for url in top_url:
        print('{}: {}'.format(unquote(url[0]), url[1]))

    # for url,count in url_count.items():
    #     new = unquote(url)
    #     print('{}: {}'.format(new, count))
    #     if re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}',new):
    #         print('{}: {}'.format(new, count))


    


if __name__ == '__main__':
    main()
