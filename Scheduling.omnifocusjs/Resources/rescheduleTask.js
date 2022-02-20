/* global PlugIn Form */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {
    const lib = this.schedulingLib

    const form = new Form()

    form.addField(new Form.Field.Date('date', 'Date', null, lib.getDateFormatter()))
    form.validate = (form) => form.values.date && (lib.isAfterToday(form.values.date) || lib.isToday(form.values.date))

    await form.show('(Re)schedule to...', '(Re)schedule')

    for (const task of selection.tasks) await lib.rescheduleTask(task, form.values.date)
  })

  action.validate = function (selection, sender) {
    return selection.tasks.length > 0
  }

  return action
})()
