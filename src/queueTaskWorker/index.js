import { useEffect, useState } from 'react'
import WorkerManager from './workerManager'
import TestWorker from './testWorker'
import { parseSQLResult } from './utils'

export const initialize = async (sqlite, { workers = [], ...opts } = {}) => {
  const manager = new WorkerManager([TestWorker, ...workers], {
    ...opts,
    sqlite,
  })
  await initializeSqlite(manager.execute.bind(manager))
  return manager
}

export const initializeSqlite = async (execute) => {
  await execute(
    `
    CREATE TABLE IF NOT EXISTS \`queueTask\` (
      \`id\` INTEGER PRIMARY KEY AUTOINCREMENT,
      \`type\` VARCHAR(20),
      \`payload\` BLOB,
      \`retry\` INTEGER DEFAULT 0,
      \`worker\` VARCHAR(50)
    );
  `,
  )
  await execute(
    `
    CREATE INDEX idx_orders ON \`queueTask\`(type, worker);
  `,
  )

  await execute(
    `CREATE TABLE IF NOT EXISTS \`queueErrorLog\` (
    \`id\` INTEGER PRIMARY KEY AUTOINCREMENT,
    \`name\` TEXT,
    \`type\` VARCHAR(20),
    \`payload\` BLOB,
    \`retry\` INTEGER DEFAULT 0,
    \`taskAt\` DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  )

  try {
    // add column idempotencyKey to queueTask if not exist
    await execute(
      `ALTER TABLE \`queueTask\` ADD COLUMN idempotencyKey VARCHAT(191) DEFAULT NULL`,
    )
  } catch (e) {}

  try {
    await execute(
      `
    CREATE INDEX idx_idempotency ON \`queueTask\`(idempotencyKey);
  `,
    )
  } catch (e) {}
}
