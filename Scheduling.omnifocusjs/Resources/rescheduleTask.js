/* global PlugIn Form */
(() => {
  const action = new PlugIn.Action(function (selection, sender) {
    // action code
    // selection options: tasks, projects, folders, tags

    // GET CONFIGURATION INFO

    const config = PlugIn.find('com.KaitlinSalzke.config').library('configLibrary')
    const rescheduleChoices = config.rescheduleChoices
    const tomorrowTag = config.tomorrowTag

    // show form to select follow up method
    const inputForm = new Form()

    // generate labels for popup menu
    const rescheduleChoicesLabels = []
    rescheduleChoices.forEach(function (tag) {
      rescheduleChoicesLabels.push(tag.name)
    })

    const popupMenu = new Form.Field.Option(
      'rescheduleDate',
      'Date to reschedule to',
      rescheduleChoices,
      rescheduleChoicesLabels,
      tomorrowTag
    )

    inputForm.addField(popupMenu)

    // PRESENT THE FORM TO THE USER
    const formPrompt = 'Reschedule to:'
    const formPromise = inputForm.show(formPrompt, 'Continue')

    // VALIDATE THE USER INPUT
    inputForm.validate = function (formObject) {
      const validation = true
      return validation
    }

    // PROCESSING USING THE DATA EXTRACTED FROM THE FORM
    formPromise.then(function (formObject) {
      const selectedRescheduleDate = formObject.values.rescheduleDate
      selection.tasks.forEach(function (task) {
        task.removeTags(rescheduleChoices)
        task.addTag(selectedRescheduleDate)
      })
    })

    // PROMISE FUNCTION CALLED UPON FORM CANCELLATION
    formPromise.catch(function (err) {
      console.log('form cancelled', err.message)
    })
  })

  action.validate = function (selection, sender) {
    // validation code
    // selection options: tasks, projects, folders, tags
    return selection.tasks.length > 0
  }

  return action
})()
