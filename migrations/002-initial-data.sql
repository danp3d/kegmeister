-- Up
INSERT INTO configs (key, value) VALUES ('lowerTemp', '1.5');
INSERT INTO configs (key, value) VALUES ('upperTemp', '3');

-- Down
DELETE FROM configs WHERE key IN ('lowerTemp', 'upperTemp');
