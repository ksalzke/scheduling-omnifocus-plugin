/* global PlugIn Form */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {

    this.schedulingLib.promptAndReschedule([...selection.tasks, ...selection.projects.map(p => p.task)])
  })

  action.validate = function (selection, sender) {
    return [...selection.tasks, ...selection.projects].length > 0
  }

  return action
})()
