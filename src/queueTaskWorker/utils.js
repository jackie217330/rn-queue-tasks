export function parseSQLResult(result) {
  try {
    const { rows: { length, item, _array = [] } = {} } = result || {};
    return _array;
  } catch (e) {
    return []
  }
}

export const sleep = (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const uniq = (array = []) => {
  return array.reduce((reducer, value) => {
    if (!~reducer.indexOf(value)) reducer.push(value)
    return reducer
  }, [])
}
