import _TestWorker from './queueTaskWorker/testWorker'

export {
  initialize,
  addTask,
  getTasksAll,
  clearTasks,
  useTaskCount,
  getNumOfTasksByType,
} from './queueTaskWorker'

export const TestWorker = _TestWorker;
