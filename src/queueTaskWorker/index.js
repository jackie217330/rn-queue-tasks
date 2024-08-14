import { useEffect, useState } from 'react'
import WorkerManager from './workerManager'
import TestWorker from './testWorker'
import { parseSQLResult } from './utils'

let execute = undefined
export const initialize = async (sqlite, { workers = [],  } = {}) => {
  execute = async (query, params = [], debug) => {
    !!debug && console.log(query, params)
    return new Promise((resolve, reject) => {
      try {
        sqlite.transaction((txn) => {
          txn.executeSql(
            query,
            params,
            (__, results) => resolve(results),
            ({ message }) => resolve(new Error(message))
          )
        })
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  }

  await initializeSqlite()
  return new WorkerManager([TestWorker, ...workers])
}

export const addErrorLog = async (e, { type = '', payload, retry, time }) => {
  if (!execute) return
  await execute(
    `INSERT INTO \`queueErrorLog\` (name, type, payload, retry, taskAt) VALUES (?,?,?,?,?)`,
    [e.toString(), type, payload, retry, time]
  )
}

export const addTask = async ({ type = '', payload }) => {
  if (!execute) return
  await execute(
    `INSERT INTO \`queueTask\` (type, worker, payload) VALUES (?,?,?)`,
    [type, '', typeof payload === 'string' ? payload : JSON.stringify(payload)]
  )
}

export const getTasksAll = async () => {
  if (!execute) return []
  return parseSQLResult(await execute(`SELECT * FROM \`queueTask\``))
}

export const getTasks = async ({ workers = [], count = 1 }) => {
  if (!execute) return []
  return parseSQLResult(await execute(
    `SELECT * FROM \`queueTask\` WHERE worker NOT IN (${Array(workers.length)
      .fill('?')
      .join(',')}) ORDER BY retry ASC LIMIT 0,?`,
    [...workers, count]
  ))
}

export const getNumOfTasksByType = async (type) => {
  if (!execute) return
  const [{ count = 0 } = {}] =
    parseSQLResult(
      await execute(`SELECT COUNT(*) as count FROM \`queueTask\` WHERE type = ?`, [
        type,
      ])
    ) || []
  return count
}

export const clearTasks = async () => {
  if (!execute) return
  await execute(`DELETE FROM \`queueTask\` WHERE 1`)
}

export const processTask = async ({ id }, worker) => {
  if (!execute) return
  await execute(`UPDATE \`queueTask\` SET worker = ? WHERE id = ?`, [
    worker,
    id,
  ])
}

export const finishTask = async ({ id }) => {
  if (!execute) return
  await execute(`DELETE FROM \`queueTask\` WHERE id = ?`, [id])
}

export const revertTask = async ({ id, retry = 0 }) => {
  if (!execute) return
  await execute(`UPDATE \`queueTask\` SET worker = ?, retry = ? WHERE id = ?`, [
    '',
    retry + 1,
    id,
  ])
}

export const useTaskCount = () => {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let handler = setInterval(async () => {
      if (!execute) return
      const [{ count = 0 } = {}] =
        parseSQLResult(
          await execute(`SELECT COUNT(*) as count FROM \`queueTask\``)
        ) || []
      setCount(count)
    }, 2000)
    return () => clearInterval(handler)
  }, [])
  return count
}

export const initializeSqlite = async () => {
  if (!execute) return

  await execute(
    `
    CREATE TABLE IF NOT EXISTS \`queueTask\` (
      \`id\` INTEGER PRIMARY KEY AUTOINCREMENT,
      \`type\` VARCHAR(20),
      \`payload\` BLOB,
      \`retry\` INTEGER DEFAULT 0,
      \`worker\` VARCHAR(50)
    );
  `
  )
  await execute(
    `
    CREATE INDEX idx_orders ON \`queueTask\`(type, worker);
  `
  )

  await execute(`CREATE TABLE IF NOT EXISTS \`queueErrorLog\` (
    \`id\` INTEGER PRIMARY KEY AUTOINCREMENT,
    \`name\` TEXT,
    \`type\` VARCHAR(20),
    \`payload\` BLOB,
    \`retry\` INTEGER DEFAULT 0,
    \`taskAt\` DATETIME DEFAULT CURRENT_TIMESTAMP
  );`)
}
