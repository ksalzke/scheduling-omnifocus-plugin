/* global PlugIn Form flattenedTags */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {
    const syncedPrefs = this.schedulingLib.loadSyncedPrefs()

    // get current preferences or set defaults if they don't yet exist
    const schedulingTag = this.schedulingLib.schedulingTag()
    const todayTag = this.schedulingLib.todayTag()
    const flagToday = syncedPrefs.readBoolean('flagToday')
    const useScheduledNotifications = syncedPrefs.readBoolean('useScheduledNotifications')
    const useWeekdays = syncedPrefs.readBoolean('useWeekdays')

    // create and show form
    const form = new Form()
    const tagNames = flattenedTags.map(t => t.name)

    form.addField(new Form.Field.Option('schedulingTag', 'Scheduling tag', flattenedTags, tagNames, schedulingTag, 'Please select a tag'))

    const todayTagField = new Form.Field.Option('todayTag', '\'Today\' tag', flattenedTags, tagNames, todayTag, 'None')
    todayTagField.allowsNull = true
    form.addField(todayTagField)

    form.addField(new Form.Field.Checkbox('flagToday', 'Flag denotes \'Today\' tasks', flagToday))
    form.addField(new Form.Field.Checkbox('useScheduledNotifications', 'Use scheduled notifications', useScheduledNotifications))

    form.addField(new Form.Field.Checkbox('useWeekdays', 'Use recurring weekday-based scheduling', useWeekdays))
    
    await form.show('Preferences: Scheduling', 'OK')

    // save preferences
    if (form.values.todayTag) syncedPrefs.write('todayTagID', form.values.todayTag.id.primaryKey)
    else syncedPrefs.write('todayTagID', null)
    syncedPrefs.write('flagToday', form.values.flagToday)
    syncedPrefs.write('useScheduledNotifications', form.values.useScheduledNotifications)
    syncedPrefs.write('schedulingTagID', form.values.schedulingTag.id.primaryKey)
    syncedPrefs.write('useWeekdays', form.values.useWeekdays)
  })

  action.validate = function (selection, sender) {
    return true
  }

  return action
})()
