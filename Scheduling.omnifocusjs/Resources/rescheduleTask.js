/* global PlugIn Form */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {
    this.schedulingLib.promptAndReschedule(selection.tasks)
  })

  action.validate = function (selection, sender) {
    return selection.tasks.length > 0
  }

  return action
})()
