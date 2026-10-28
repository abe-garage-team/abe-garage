import fs from 'node:fs';
import path from 'node:path';

const migrationNamePattern = /^(\d{3,})_([a-z0-9][a-z0-9_-]*)\.sql$/;

export function listMigrations(migrationsDir) {
  const files = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name);

  const migrations = files.map((file) => {
    const match = migrationNamePattern.exec(file);
    if (!match) throw new Error(`Migration filename must use NNN_description.sql: ${file}`);
    return { file, version: match[1], path: path.join(migrationsDir, file) };
  });

  migrations.sort((left, right) => left.version.localeCompare(right.version));
  for (let index = 1; index < migrations.length; index++) {
    if (migrations[index - 1].version === migrations[index].version) {
      throw new Error(`Duplicate migration version: ${migrations[index].version}`);
    }
  }
  return migrations;
}

export function splitSqlStatements(source) {
  const statements = [];
  let delimiter = ';';
  let statement = '';
  let quote = null;
  let blockComment = false;
  let index = 0;

  const pushStatement = () => {
    if (statement.trim()) statements.push(statement.trim());
    statement = '';
  };

  while (index < source.length) {
    const lineStart = index === 0 || source[index - 1] === '\n';
    if (!quote && !blockComment && lineStart && !statement.trim()) {
      const lineEnd = source.indexOf('\n', index);
      const line = source.slice(index, lineEnd === -1 ? source.length : lineEnd).replace(/\r$/, '');
      const directive = /^\s*DELIMITER\s+(\S+)\s*$/i.exec(line);
      if (directive) {
        delimiter = directive[1];
        index = lineEnd === -1 ? source.length : lineEnd + 1;
        continue;
      }
    }

    const character = source[index];
    const next = source[index + 1];

    if (blockComment) {
      statement += character;
      if (character === '*' && next === '/') {
        statement += next;
        index += 2;
        blockComment = false;
      } else {
        index++;
      }
      continue;
    }

    if (quote) {
      statement += character;
      if (character === '\\' && quote !== '`' && next !== undefined) {
        statement += next;
        index += 2;
        continue;
      }
      if (character === quote) {
        if (next === quote && quote !== '`') {
          statement += next;
          index += 2;
          continue;
        }
        quote = null;
      }
      index++;
      continue;
    }

    if (character === '/' && next === '*') {
      statement += '/*';
      index += 2;
      blockComment = true;
      continue;
    }
    if (
      character === '#' ||
      (character === '-' && next === '-' && /\s/.test(source[index + 2] || ''))
    ) {
      const lineEnd = source.indexOf('\n', index);
      const end = lineEnd === -1 ? source.length : lineEnd + 1;
      statement += source.slice(index, end);
      index = end;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      statement += character;
      index++;
      continue;
    }
    if (source.startsWith(delimiter, index)) {
      pushStatement();
      index += delimiter.length;
      continue;
    }
    statement += character;
    index++;
  }

  if (quote) throw new Error('Unterminated quoted value in migration SQL');
  if (blockComment) throw new Error('Unterminated block comment in migration SQL');
  pushStatement();
  return statements;
}
