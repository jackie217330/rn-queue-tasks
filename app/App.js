import React, {useEffect, useState} from 'react';
import {Button, Text} from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import {initialize} from 'rn-queue-tasks';

const db = SQLite.openDatabase({
  name: '1.db',
});

export default () => {
  const [manager, setManager] = useState(undefined);
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    initialize(db, []).then(setManager);
  }, []);

  return (
    <>
      <Text>Task Count: {count}</Text>
      <Button
        title={'Add Task'}
        onPress={() => {
          manager.addTask({type: 'test', payload: {time: Date.now()}});
        }}
      />
    </>
  );
};
