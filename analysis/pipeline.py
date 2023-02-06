import pandas as pd
from pandas import json_normalize

from sqlalchemy import create_engine
from sqlalchemy import inspect
import logging
import sys
from dotenv import load_dotenv
import os
import requests
import time
import json
import redis

load_dotenv()

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger("etl")

redis_url = os.getenv(key="REDIS_URL")
r = redis.from_url(redis_url)



engine = create_engine(os.getenv(key="DATABASE_URL"))
inspector = inspect(engine)

FINAL_TABLE = "processed_logs"
API = "http://ip-api.com/batch/"


def normalize_raw(table_name):
    # get data from previous runs via metadata table
    latest_row = 0
    if inspector.has_table("metadata"):
        logger.info("Metadata table exists")
        df = pd.read_sql_query("select MAX(last_row) as num_row from metadata", con=engine)
        latest_row = df["num_row"][0]
    logger.info(f"Latest row processed was: {latest_row}")
    raw_data = pd.read_sql_query(
        f"select * from accesslog WHERE id > {latest_row}", engine
    )
    logger.info(f"Read {raw_data.shape[0]} rows from accesslog table")

    # normalize json data and insert to final table
    normalized_df = json_normalize(raw_data["log_line"])
    normalized_df = pd.concat([raw_data, normalized_df], axis=1)
    normalized_df = normalized_df.drop(columns=["log_line"])
    row_inserted = normalized_df.to_sql(
        table_name,
        engine,
        if_exists="append",
        index=False,
        chunksize=100000,
        method="multi",
    )
    logger.info(f"Inserted {row_inserted} rows into {table_name} table")

    # last row in accesslog table
    max_value = raw_data["id"].max() if raw_data.shape[0] > 0 else 0
    date = pd.to_datetime("today").strftime("%Y-%m-%d %H:%M:%S")
    # insert last row processed into metadata table
    metadata = pd.DataFrame({"last_row": [max_value], "date": [date]})
    num_rows = metadata.to_sql("metadata", engine, if_exists="append", index=False)
    logger.info(
        f"Last row processed was: {max_value}, Inserted {num_rows} rows into metadata table"
    )

def create_lat_long_table():
    df = pd.read_sql_query(
        """SELECT DISTINCT ip
        FROM processed_logs
        WHERE ip NOT IN (SELECT DISTINCT query FROM ip_data)
        """,
        engine,
    )
    insert_df = pd.DataFrame()
    logger.info(f"Found {df.shape[0]} unique missing IPs")
    
    df["batch"] = df.index // 100
    df = df.groupby("batch").agg({"ip": lambda x: list(x)})
    df = df.reset_index(drop=True)
    
    for row in df.itertuples():
        ip = json.dumps(row.ip)
        try:
            response = requests.post(API, data=ip, timeout=12)
            if response.status_code != 200:
                logger.error(f"Error: {response.status_code}")
                break
            data = response.json()
            df = pd.DataFrame.from_records(data)
            if "message" in df.columns:
                df = df.drop(columns=["message"])
            insert_df = pd.concat([insert_df, df])
        except Exception as e:
            logger.error(f"Error: {e}")
            pass
        time.sleep(1)
    
    num_rows = insert_df.to_sql(
        "ip_data",
        engine,
        if_exists="append",
        index=False,
        chunksize=1000,
        method="multi",
    )
    logger.info(
        f"{num_rows} IP's were added to ip table."
    )

def move_data_from_redis_to_postgres():
    latest_row = 0
    # drop ssh_failed table if it exists
    if inspector.has_table("ssh_failed"):
        engine.execute("DROP TABLE ssh_failed")
    # if inspector.has_table("ssh_failed"):
    #     df = pd.read_sql_query("select COUNT(*) as c FROM ssh_failed", con=engine)
    #     latest_row = df["c"][0] + 1
    total_hackers = r.zcard("hackers")
    logger.info(f"Latest row processed was: {latest_row}, Total hackers: {total_hackers}")
    for i in range(latest_row, total_hackers, 10000):
        logger.info(f"Processing hackers {i} to {i + 10000}")
        hackers = [json.loads(r.get(hacker)) for hacker in r.zrange("hackers", i, i + 10000)]
        for hacker in hackers:
            hacker["time"] = pd.to_datetime(hacker["time"], unit="s")
        hackers = pd.DataFrame(hackers)
        logger.info(f"Read {hackers.shape[0]} rows from hackers table")
        num_rows = hackers.to_sql(
            "ssh_failed",
            engine,
            if_exists="append",
            index=False,
            chunksize=10000,
            method="multi",
        )
        logger.info(f"Inserted {num_rows} rows into hackers table")

if __name__ == "__main__":
    logger.info("Starting ETL")
    normalize_raw(FINAL_TABLE)
    move_data_from_redis_to_postgres()
    create_lat_long_table()
    logger.info("ETL complete")
