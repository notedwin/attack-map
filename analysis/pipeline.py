import pandas as pd
from pandas import json_normalize

from sqlalchemy import create_engine
from sqlalchemy import inspect
import logging
import sys
from dotenv import load_dotenv
import os

load_dotenv()

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("etl")

engine = create_engine(os.getenv(key="DATABASE_URL"))
inspector = inspect(engine)

FINAL_TABLE = "processed_logs"


def normalize_raw(engine, table_name):
    # get data from previous runs via metadata table
    latest_row = 0
    if inspector.has_table("metadata"):
        logger.info("Metadata table exists")
        df = pd.read_sql_query("select MAX(last_row) as num_row from metadata", engine)
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


def stats_table(engine):

    df = pd.read_sql_query(
        """path,
        COUNT(*) c
        from tmp_table
        WHERE created_at::date = (SELECT MAX(created_at::date) FROM accesslog)
        GROUP BY 1
        ORDER BY c DESC;""",
        engine,
    )

    pass


if __name__ == "__main__":
    logger.info("Starting ETL")
    normalize_raw(engine, FINAL_TABLE)
    logger.info("ETL complete")
