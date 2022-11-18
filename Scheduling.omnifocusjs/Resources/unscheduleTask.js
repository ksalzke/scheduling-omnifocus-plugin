/* global PlugIn Form */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {
    await this.schedulingLib.unscheduleTasks(selection.tasks)
  })

  action.validate = function (selection, sender) {
    return selection.tasks.length > 0
  }

  return action
})()
