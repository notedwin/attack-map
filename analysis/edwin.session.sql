

-- sql to get most popular path for the latest day, not knowing the date
select path,
    COUNT(*) c
from tmp_table
WHERE created_at::date = (SELECT MAX(created_at::date) FROM accesslog)
GROUP BY 1
ORDER BY c DESC;

-- sql for most popular sucessful requests
select log_line->>'path' path,
    log_line->>'status' status,
    COUNT(*) c
from accesslog
WHERE log_line->>'status' = '200'
GROUP BY 1,2
ORDER BY c DESC;



select log_line->>'ip' ip,
    count(distinct log_line->>'path') as distinct_paths
from accesslog
WHERE created_at::date = '2022-11-15' -- 1172 requests from same IP, 187.62.212.197
GROUP BY 1;


-- sql query to find the most popular path
select log_line->>'path' path,
    --count distinct ip
    count(distinct log_line->>'ip') as distinct_ips
from accesslog
GROUP BY 1
HAVING COUNT(distinct log_line->>'ip') > 10


WITH logs AS (
SELECT * FROM processed_logs
	WHERE created_at > '2023-01-01'
)

SELECT * FROM logs
INNER JOIN ip_data ip
ON logs.ip = ip.query
LIMIT 100

SELECT * FROM metadata