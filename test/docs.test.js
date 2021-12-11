// @flow
import React from 'react'
import { View } from 'react-native'
import renderer from 'react-test-renderer'
import RnQueueTasks from 'rn-queue-tasks'

test('README example renders correctly.', () => {
  const tree = renderer.create(
    <View>
      <RnQueueTasks />
    </View>
  )

  expect(tree).toBeDefined()
})
