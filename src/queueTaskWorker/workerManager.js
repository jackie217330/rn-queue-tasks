import { sleep, uniq, parseSQLResult } from './utils'

export default class WorkerManager {
  workers = []
  sqlite = undefined
  handler = undefined
  processing = false

  async execute(query, params = [], debug) {
    !!debug && console.log(query, params)
    return new Promise((resolve, reject) => {
      try {
        this.sqlite.transaction((txn) => {
          txn.executeSql(
            query,
            params,
            (__, results) => resolve(results),
            ({ message }) => resolve(new Error(message)),
          )
        })
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  }

  constructor(workers = [], opts) {
    this.sqlite = opts.sqlite

    const props = {
      processTask: async (worker, task) => {
        worker.processing = true
        await this.execute(`UPDATE \`queueTask\` SET worker = ? WHERE id = ?`, [
          worker.name,
          task.id,
        ])
      },
      finishTask: async (worker, task) => {
        worker.processing = false
        await this.execute(`DELETE FROM \`queueTask\` WHERE id = ?`, [task.id])
      },
      revertTask: async (worker, task) => {
        worker.processing = false
        await this.execute(
          `UPDATE \`queueTask\` SET worker = ?, retry = ? WHERE id = ?`,
          ['', task.retry + 1, task.id],
        )
      },
      errorTask: async (e, task) => {
        await this.execute(
          `INSERT INTO \`queueErrorLog\` (name, type, payload, retry, taskAt) VALUES (?,?,?,?,?)`,
          [e.toString(), task.type, task.payload, task.retry, task.time],
        )
      },
    }

    const timestamp = new Date().getTime()
    this.workers.push(
      ...workers.map(
        (Worker, i) =>
          new Worker({
            ...props,
            name: `worker:${timestamp + i}`,
          }),
      ),
    )
    if (opts?.interval ?? 2000)
      this.handler = setInterval(this.instantiate, opts?.interval ?? 2000)
  }

  addTask = async ({ idempotencyKey, type = '', payload }) => {
    if (idempotencyKey) {
      const res = await this.execute(
        `SELECT 1 FROM \`queueTask\` WHERE idempotencyKey = ?`,
        [idempotencyKey],
      )
      if (res?.rows?.length > 0) {
        return
      }
    }

    await this.execute(
      `INSERT INTO \`queueTask\` (type, worker, payload, idempotencyKey) VALUES (?,?,?,?)`,
      [
        type,
        '',
        typeof payload === 'string' ? payload : JSON.stringify(payload),
        idempotencyKey,
      ],
    )
  }

  destrory = async () => {
    clearInterval(this.handler)
    this.workers = []
  }

  instantiate = async () => {
    if (this.processing) return
    this.processing = true

    const workers = this.workers.concat()

    const getFreeWorker = (type) => {
      const index = workers.findIndex(
        (worker) => worker.type === type && !worker.processing,
      )
      return index !== -1 ? workers.splice(index, 1).pop() : undefined
    }

    const tasks = await (async () => {
      const workerNames = uniq(this.workers.map((worker) => worker.name))

      let result;
      try {
        result = await this.execute(
          `SELECT * FROM \`queueTask\` WHERE worker NOT IN (${Array(
            workerNames.length,
          )
            .fill('?')
            .join(',')}) ORDER BY retry ASC LIMIT 0,?`,
          [...workerNames, this.workers.length],
        )
      } catch (e) {
        try {
          result = await this.execute(
            `SELECT * FROM \`queueTask\` WHERE worker NOT IN (${Array(
              workerNames.length,
            )
              .fill('?')
              .join(',')}) LIMIT 0,?`,
            [...workerNames, this.workers.length],
          )
        } catch (e) {
          throw e;
        }
      }

      if(result) return parseSQLResult(result)
      return [];
    })()

    for (const task of tasks) {
      const { type } = task

      const worker = getFreeWorker(type)
      if (!!worker) worker.start(task)
      await sleep(1)
    }

    this.processing = false
  }
}
