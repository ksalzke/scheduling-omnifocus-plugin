/* global PlugIn Form flattenedTags */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {
    const syncedPrefs = this.schedulingLib.loadSyncedPrefs()

    // get current preferences or set defaults if they don't yet exist
    const todayTag = this.schedulingLib.todayTag()
    const flagToday = syncedPrefs.readBoolean('flagToday')

    // create and show form
    const form = new Form()
    const tagNames = flattenedTags.map(t => t.name)
    const todayTagField = new Form.Field.Option('todayTag', '\'Today\' tag', flattenedTags, tagNames, todayTag, 'None')
    todayTagField.allowsNull = true
    form.addField(todayTagField)
    form.addField(new Form.Field.Checkbox('flagToday', 'Flag \'Today\' tasks', flagToday))
    await form.show('Preferences: Agendas', 'OK')

    // save preferences
    if (form.values.todayTag === null) syncedPrefs.write('todayTagID', '')
    else syncedPrefs.write('todayTagID', form.values.todayTag.id.primaryKey)
    syncedPrefs.write('flagToday', form.values.flagToday)
  })

  action.validate = function (selection, sender) {
    return true
  }

  return action
})()
