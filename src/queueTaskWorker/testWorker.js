import { sleep } from './utils'

export default class TestWorker {
  type = 'test'
  name = ''
  processing = false
  processTask = (_) => _
  finishTask = (_) => _
  revertTask = (_) => _
  errorTask = (_) => _

  constructor({
    name = 'worker',
    processTask,
    finishTask,
    revertTask,
    errorTask,
  } = {}) {
    this.name = name
    this.processTask = processTask
    this.finishTask = finishTask
    this.revertTask = revertTask
    this.errorTask = errorTask
  }

  start = async (task) => {
    task.time = new Date().toISOString()
    try {
      await this.processTask(this, task)
      await this.worker(task)
      await this.finishTask(this, task)
    } catch (e) {
      if (task.retry % 5 === 0) {
        // console.log(e)
      }
      if (task.retry > 0 && task.retry % 10 === 0) {
        // console.log('type', task.type)
        // console.log('retry', task.retry)
        // console.log('payload', task.payload)
        // Sentry.captureException(e);
        await this.errorTask(e, task)
      }
      await this.revertTask(this, task)
    }
  }

  worker = async (task) => {
    console.log('Start Worker', task)
    await sleep(1000 * 2)
  }
}
