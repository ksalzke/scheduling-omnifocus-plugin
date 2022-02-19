/* global PlugIn deleteObject Calendar DateComponents Project ApplyResult library Folder moveSections */
(() => {
  const action = new PlugIn.Action(function (selection, sender) {
    this.schedulingLib.updateTags()
  })

  action.validate = function (selection, sender) {
    // only valid if nothing is selected - so does not show in share menu
    return selection.tasks.length === 0 && selection.projects.length === 0
  }

  return action
})()
