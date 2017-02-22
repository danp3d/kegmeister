-- Up
CREATE TABLE configs (key VARCHAR(30) NOT NULL PRIMARY KEY, value TEXT);

-- Down
DROP TABLE configs;
