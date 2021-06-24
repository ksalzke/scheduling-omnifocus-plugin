/* global PlugIn tagsMatching Calendar library Project */
(() => {
  const action = new PlugIn.Action(function (selection, sender) {
    const todayTag = tagsMatching('Due Today')[0]

    const now = new Date()
    const today = Calendar.current.startOfDay(now)

    const tasksDueToday = []
    library.apply(function (item) {
      if (item instanceof Project && item.task.hasChildren) {
        item.task.children.forEach((tsk) => {
          if (tsk.effectiveDueDate !== null) {
            if (
              Calendar.current.startOfDay(tsk.effectiveDueDate).getTime() ===
              today.getTime()
            ) {
              tasksDueToday.push(tsk)
            }
          }
        })
      }
    })

    tasksDueToday.forEach((task) => {
      task.addTag(todayTag)
    })
  })

  action.validate = function (selection, sender) {
    return true
  }

  return action
})()
