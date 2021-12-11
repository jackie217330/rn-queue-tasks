# rn-queue-tasks

A plugin to handle queue tasks
This module is repeatedly included in my works, so i would like to pack it as an installable module.

## Installation

```
yarn add react-native-sqlite-storage
yarn add {this git repo}
```

## Usage

#### 1. initiate the sqlite

```jsx
import SQLite from 'react-native-sqlite-storage'

const db = SQLite.openDatabase({
  name: '1.db',
})
```

#### 2. customize workers

```jsx
import { TestWorker } from 'rn-queue-tasks'

class MyWorker extends TestWorker {
  /* specify the type of task handled by this worker */
  type = 'console_the_payload'

  /* specify the worker function */
  worker = async (task) => {
    const { id, worker, retry, payload, type, time } = task
    /*
      id: string,      the auto-increment index from sqlite
      worker: string,  the worker name handling this task
      retry: int,      the retry count
      payload: string, the json object of the task content
      type: string,    the type specified
      time: string,    created time in ISO string format
     */
    console.log(JSON.parse(payload))
    /* to resolve this task, just pass the function */
    /* if throw, the task will be retried later (if there is an idle worker) */
  }
}
```

#### 3. initiate the rn-queue-tasks

```jsx
import { initialize } from 'rn-queue-tasks'

// here 3 instanses of MyWorker
initialize(db, [MyWorker, MyWorker, MyWorker])
```

#### 4. add tasks

```jsx
import { addTask } from 'rn-queue-tasks'

addTask({
  type: 'console_the_payload',
  payload: {
    key1: 'value1',
    key2: 'value2',
  },
})
```

#### inspect tasks

```jsx
import { useTaskCount, getTasksAll } from 'rn-queue-tasks'
import { Button } from 'react-native'

export default App = () => {
  const taskCount = useTaskCount()
  return (
    <Button
      title={`Get Tasks: ${taskCount}`}
      onPress={async () => {
        const tasks = await getTasksAll()
        console.log(tasks)
      }}
    />
  )
}
```
