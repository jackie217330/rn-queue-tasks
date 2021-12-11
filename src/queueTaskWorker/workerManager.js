import {
  getTasks,
  finishTask,
  revertTask,
  processTask,
  addErrorLog,
} from './index'
import { sleep, uniq } from './utils'

export default class WorkerManager {
  workers = []
  handler = undefined
  constructor(workers = []) {
    const props = {
      processTask: async (worker, task) => {
        worker.processing = true
        await processTask(task, worker.name)
      },
      finishTask: async (worker, task) => {
        worker.processing = false
        await finishTask(task)
      },
      revertTask: async (worker, task) => {
        worker.processing = false
        await revertTask(task)
      },
      errorTask: async (e, task) => {
        await addErrorLog(e, task)
      },
    }

    const timestamp = new Date().getTime()
    this.workers.push(
      ...workers.map(
        (Worker, i) =>
          new Worker({
            ...props,
            name: `worker:${timestamp + i}`,
          })
      )
    )
    this.handler = setInterval(this.instantiate, 2000)
  }

  instantiate = async () => {
    const workers = this.workers.concat()

    const getFreeWorker = (type) => {
      const index = workers.findIndex(
        (worker) => worker.type === type && !worker.processing
      )
      return index !== -1 ? workers.splice(index, 1).pop() : undefined
    }

    const tasks = await getTasks({
      workers: uniq(this.workers.map((worker) => worker.name)),
      count: this.workers.length,
    })

    for (const task of tasks) {
      const { type } = task

      const worker = getFreeWorker(type)
      if (!!worker) worker.start(task)
      await sleep(1)
    }
  }
}
