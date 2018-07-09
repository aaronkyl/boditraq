SELECT sub.session_id, sub.sysdate, sub.record_count, bmc.body_measurement_literal as literal, bmc.sort_order, ubm.measurement
FROM user_body_measurements ubm
INNER JOIN (
    SELECT ubm.user_measurement_sessions_id AS session_id, ums.sysdate, COUNT(*) as record_count
    FROM user_body_measurements ubm
    INNER JOIN user_measurement_sessions ums ON ums.id = ubm.user_measurement_sessions_id
    WHERE ums.user_id = 2
    GROUP BY ubm.user_measurement_sessions_id, ums.sysdate
    ) sub on sub.session_id = ubm.user_measurement_sessions_id
INNER JOIN body_measurements_cd bmc ON bmc.id = ubm.body_measurements_cd_id