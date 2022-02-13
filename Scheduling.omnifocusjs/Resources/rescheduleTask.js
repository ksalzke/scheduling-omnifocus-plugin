/* global PlugIn Form */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {
    const lib = this.schedulingLib

    const form = new Form()
    form.addField(new Form.Field.Date('date', 'Date', null, lib.getDateFormatter()))

    // TODO: validation - confirm date is in the future

    await form.show('Reschedule to...', 'Reschedule') // TODO: Use 'schedule' if not already scheduled

    const dateTag = lib.getTag(form.values.date)

    for (const task of selection.tasks) {
      task.removeTags(lib.getSchedulingTag().children)
      task.addTag(dateTag)
    }
  })

  action.validate = function (selection, sender) {
    return selection.tasks.length > 0
  }

  return action
})()
