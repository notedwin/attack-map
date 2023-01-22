# a horrible way of writing a postgresql insert operator in python
import psycopg

query = """
select id,
    created_at,
    log_line->>'ip' ip
from accesslog"""

def get_columns_w_types(sql, cur):
    """
    Takes a string of sql query and returns a string of column names and types to be used in output table creation.
    LOL THIS IS SO BAD
    """
    cur.execute(sql + ' WHERE 1=0')
    columns = [desc[0] for desc in cur.description]
    types = [psycopg.adapters.types[desc[1]].name for desc in cur.description]
    columns = ['{} {}'.format(col, typ) for col, typ in zip(columns, types)]
    return ', '.join(columns)

def PostgresInsertOperator(table_name, sql, cur):
    columns = get_columns_w_types(sql, cur)
    print('Creating table...')
    sql = 'CREATE TABLE IF NOT EXISTS {} ({})'.format(table_name, columns)
    print(sql)
    cur.execute(sql)
    print('Table created.')

    print('Inserting data...')
    # get columns names from a table
    cur.execute('SELECT * FROM {} WHERE 1=0'.format(table_name))
    columns = [desc[0] for desc in cur.description]
    # create a string of column names
    columns = ', '.join(columns)
    sql = 'INSERT INTO {} ({}) {}'.format(table_name, columns, query)
    print(sql)
    cur.execute(sql)
    print('Data inserted.')
    # print how many rows were inserted
    print('Rows inserted: {}'.format(cur.rowcount))

# drop table
def drop_table(table_name, cur):
    print('Dropping table...')
    sql = 'DROP TABLE IF EXISTS {}'.format(table_name)
    print(sql)
    cur.execute(sql)
    print('Table dropped.')

def main():
    print('Running main...')
    #with psycopg.connect("") as conn:
        with conn.cursor() as cur:
            PostgresInsertOperator('tmp_table', query, cur)
            # once done, commit the changes
            drop_table("tmp_table", cur)
            conn.commit()


# every 5 mins query ip api for ip's not in db
# if ip is not in db, insert into db
# if ip is in db, update db with new info
# def query_ip_api():


if __name__ == '__main__':
    main()


# simple script to pull data from postgresql db and normalize json

