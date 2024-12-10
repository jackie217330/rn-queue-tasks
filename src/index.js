import _TestWorker from './queueTaskWorker/testWorker'
import * as M from './queueTaskWorker'

export const TestWorker = _TestWorker;
export const initialize = M.initialize;
export const addTask = M.addTask;
export const getTasksAll = M.getTasksAll;
export const clearTasks = M.clearTasks;
export const useTaskCount = M.useTaskCount;
export const getNumOfTasksByType = M.getNumOfTasksByType;
