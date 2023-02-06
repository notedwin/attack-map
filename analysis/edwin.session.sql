

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

WITH ssh AS (SELECT IP, COUNT(*) FROM ssh_failed GROUP BY IP), logs AS (SELECT IP, COUNT(*) FROM processed_logs GROUP BY IP)

SELECT * FROM logs
INNER JOIN ssh
ON logs.ip = ssh.ip

SELECT * FROM ssh_failed


-- average number of requests per week


SELECT COUNT(*) / (SELECT COUNT(DISTINCT extract(week from created_at)) FROM processed_logs) FROM processed_logs

SELECT COUNT(*) / (SELECT COUNT(DISTINCT extract(month from created_at)) FROM processed_logs) FROM processed_logs


SELECT COUNT(*) / (SELECT COUNT(DISTINCT created_at::date) FROM processed_logs) FROM processed_logs

select COUNT(*) as c FROM ssh_failed


WITH agg AS (SELECT 1, [1,2,3])

SELECT * FROM agg
CROSS JOIN unnest(agg) WITH ORDINALITY AS t (value, ord)