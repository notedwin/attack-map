from flask import Flask, render_template
from dotenv import load_dotenv
import json
import redis
import os
import logging
import requests
import time

load_dotenv()
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger("web_server")
redis_url = os.getenv(key="REDIS_URL")
r = redis.from_url(redis_url)

API = "http://ip-api.com/json/"

app = Flask(__name__)

# connect to redis from db url

def pull_hackers():
    ret = []
    t = time.time() - (60*60*5)
    for hacker in r.zrangebyscore("hackers", t, time.time()):
        data = r.get(hacker)
        data = json.loads(data)
        data["time"] = time.strftime('%H:%M:%S', time.localtime(float(hacker)))
        ret.append(data)
    return ret


@app.route("/")
def hello_world():
    hacker = pull_hackers()
    hacker = {"hackers": hacker}
    hacker = json.dumps(hacker)
    print(hacker)
    return render_template("index.html", name=hacker)

# if flask is run as main, run the app
if __name__ == "__main__":
    app.run()
