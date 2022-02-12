/* global PlugIn tagsMatching Calendar flattenedTasks */
(() => {
  const action = new PlugIn.Action(function (selection, sender) {
    const todayTag = tagsMatching('Due Today')[0]

    const now = new Date()
    const today = Calendar.current.startOfDay(now)

    const tasksDueToday = flattenedTasks.filter(task => task.effectiveDueDate !== null && Calendar.current.startOfDay(task.effectiveDueDate).getTime() === today.getTime())

    tasksDueToday.forEach((task) => {
      task.addTag(todayTag)
    })
  })

  action.validate = function (selection, sender) {
    return true
  }

  return action
})()
