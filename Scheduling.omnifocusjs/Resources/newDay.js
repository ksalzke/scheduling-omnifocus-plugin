/* global PlugIn */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {
    await this.schedulingLib.updateTags()
  })

  action.validate = function (selection, sender) {
    // only valid if nothing is selected - so does not show in share menu
    return selection.tasks.length === 0 && selection.projects.length === 0
  }

  return action
})()
