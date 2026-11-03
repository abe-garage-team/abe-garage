import test from 'node:test';
import assert from 'node:assert/strict';
import { splitSqlStatements } from '../../scripts/migration-utils.js';

test('migration SQL splitter keeps quoted semicolons inside a statement', () => {
  assert.deepEqual(
    splitSqlStatements("INSERT INTO notes (body) VALUES ('wash; wax');\nSELECT 1;"),
    ["INSERT INTO notes (body) VALUES ('wash; wax')", 'SELECT 1'],
  );
});

test('migration SQL splitter supports MySQL DELIMITER blocks', () => {
  const sql = `DELIMITER $$
CREATE TRIGGER trg_example BEFORE INSERT ON example
FOR EACH ROW BEGIN
  SET NEW.name = TRIM(NEW.name);
END$$
DELIMITER ;
SELECT 1;`;
  assert.deepEqual(splitSqlStatements(sql), [
    'CREATE TRIGGER trg_example BEFORE INSERT ON example\nFOR EACH ROW BEGIN\n  SET NEW.name = TRIM(NEW.name);\nEND',
    'SELECT 1',
  ]);
});

test('migration SQL splitter recognises DELIMITER after a comment and drops comment-only chunks', async () => {
  const { splitSqlStatements } = await import('../../scripts/migration-utils.js');
  const statements = splitSqlStatements(`
-- integrity guards
DELIMITER $$
CREATE TRIGGER t BEFORE UPDATE ON x FOR EACH ROW
BEGIN
  SET NEW.a = 1;
END$$
DELIMITER ;
INSERT INTO roles (role_id) VALUES (1);
-- trailing note only
`);
  assert.equal(statements.length, 2);
  assert.match(statements[0], /^CREATE TRIGGER/);
  assert.match(statements[1], /^INSERT INTO roles/);
});
