/* global PlugIn */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {
    await this.schedulingLib.updateTags()
  })

  action.validate = function (selection, sender) {
    return true
  }

  return action
})()
