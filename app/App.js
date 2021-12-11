import React, {useEffect} from 'react';
import {Button, Text} from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import {addTask, getTasksAll, initialize, useTaskCount} from 'rn-queue-tasks';

const db = SQLite.openDatabase({
  name: '1.db',
});

export default () => {
  useEffect(() => {
    initialize(db, []);
  }, []);
  const taskCount = useTaskCount();

  return (
    <>
      <Text>Task Count: {taskCount}</Text>
      <Button
        title={'Add Task'}
        onPress={() =>
          addTask({
            type: 'test',
            payload: {a: new Date().getTime()},
          })
        }
      />
      <Button
        title={'Get Tasks'}
        onPress={() =>
          getTasksAll().then(tasks => alert(JSON.stringify(tasks, null, 2)))
        }
      />
    </>
  );
};
