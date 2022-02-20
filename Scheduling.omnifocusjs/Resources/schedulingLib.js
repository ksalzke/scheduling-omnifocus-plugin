/* global PlugIn Version Formatter Tag Calendar moveTags deleteObject Alert DateComponents */
(() => {
  const schedulingLib = new PlugIn.Library(new Version('1.0'))

  schedulingLib.loadSyncedPrefs = () => {
    const syncedPrefsPlugin = PlugIn.find('com.KaitlinSalzke.SyncedPrefLibrary')

    if (syncedPrefsPlugin !== null) {
      const SyncedPref = syncedPrefsPlugin.library('syncedPrefLibrary').SyncedPref
      return new SyncedPref('com.KaitlinSalzke.Scheduling')
    } else {
      const alert = new Alert(
        'Synced Preferences Library Required',
        'For the Scheduling plug-in to work correctly, the \'Synced Preferences for OmniFocus\' plug-in (https://github.com/ksalzke/synced-preferences-for-omnifocus) is also required and needs to be added to the plug-in folder separately. Either you do not currently have this plugin installed, or it is not installed correctly.'
      )
      alert.show()
    }
  }

  schedulingLib.todayTag = () => {
    const syncedPrefs = schedulingLib.loadSyncedPrefs()
    const todayTagID = syncedPrefs.read('todayTagID')
    if (todayTagID === null) return null
    else return Tag.byIdentifier(todayTagID)
  }

  schedulingLib.getDateFormatter = () => {
    return Formatter.Date.withStyle(Formatter.Date.Style.Medium)
  }

  schedulingLib.getDateString = (date) => {
    const formatter = schedulingLib.getDateFormatter()
    return formatter.stringFromDate(date)
  }

  schedulingLib.daysFromToday = (date) => {
    const startOfToday = Calendar.current.startOfDay(new Date())
    const startOfDate = Calendar.current.startOfDay(date)
    return Calendar.current.dateComponentsBetweenDates(startOfToday, startOfDate).day
  }

  schedulingLib.getDayOfWeek = (date) => {
    const dayFormatter = Formatter.Date.withFormat('EEEE')
    return dayFormatter.stringFromDate(date)
  }

  schedulingLib.getString = (date) => {
    const dateString = schedulingLib.getDateString(date)
    const daysFromToday = schedulingLib.daysFromToday(date)
    if (daysFromToday > 7) return dateString
    if (daysFromToday === 1) return `Tomorrow (${dateString})`
    if (daysFromToday === 0) return null

    // otherwise, date is in next 7 days - include day of week
    const dayString = schedulingLib.getDayOfWeek(date)
    return `${dayString} (${dateString})`
  }

  schedulingLib.isAfterToday = (date) => {
    // get start of tomorrow
    const daysToAdd = new DateComponents()
    daysToAdd.day = 1
    const startOfTomorrow = Calendar.current.startOfDay(Calendar.current.dateByAddingDateComponents(new Date(), daysToAdd))

    return date >= startOfTomorrow
  }

  schedulingLib.schedulingTag = () => {
    const syncedPrefs = schedulingLib.loadSyncedPrefs()
    const schedulingTagID = syncedPrefs.read('schedulingTagID')
    if (schedulingTagID === null) return null
    else return Tag.byIdentifier(schedulingTagID)
  }

  schedulingLib.getSchedulingTag = async () => {
    const schedulingTag = schedulingLib.schedulingTag()
    if (schedulingTag !== null) return schedulingTag

    // not set - show preferences pane and then try again)
    await this.action('preferences').perform()
    return await schedulingLib.getSchedulingTag()
  }

  schedulingLib.createTag = async date => {
    const parent = await schedulingLib.getSchedulingTag()
    const tag = new Tag(schedulingLib.getString(date), parent)
    await schedulingLib.recreateTagOrder()
    return tag
  }

  schedulingLib.getTag = async (date) => {
    const dateString = schedulingLib.getDateString(date)
    if (dateString === null) return schedulingLib.todayTag()

    const parent = await schedulingLib.getSchedulingTag()
    const tag = parent.children.find(tag => tag.name.includes(dateString)) || await schedulingLib.createTag(date)
    return tag
  }

  schedulingLib.getDate = (tag) => {
    const formatter = schedulingLib.getDateFormatter()
    const date = formatter.dateFromString(tag.name)
    return date
  }

  schedulingLib.isToday = (date) => {
    return Calendar.current.startOfDay(date).getTime() === Calendar.current.startOfDay(new Date()).getTime()
  }

  schedulingLib.rescheduleTask = async (task, date) => {
    const syncedPrefs = schedulingLib.loadSyncedPrefs()
    const schedulingTag = await schedulingLib.getSchedulingTag()
    const schedulingTags = schedulingTag.children

    if (schedulingLib.isToday(date)) {
      // flag/tag as appropriate
      schedulingLib.addToToday(task)
      // remove old tags
      task.removeTags(schedulingTags)
    } else {
      // unflag task
      if (syncedPrefs.readBoolean('flagToday')) task.flagged = false

      // remove old tags
      task.removeTags(schedulingTags)

      // add new tag
      const dateTag = await schedulingLib.getTag(date)
      task.addTag(dateTag)
    }
  }

  schedulingLib.addToToday = (task) => {
    const syncedPrefs = schedulingLib.loadSyncedPrefs()
    if (syncedPrefs.readBoolean('flagToday')) task.flagged = true

    const todayTag = schedulingLib.todayTag()
    if (todayTag !== null) task.addTag(todayTag)
  }

  schedulingLib.makeToday = (tag) => {
    for (const task of tag.tasks) schedulingLib.addToToday(task)
    deleteObject(tag)
  }

  schedulingLib.recreateTagOrder = async () => {
    const syncedPrefs = schedulingLib.loadSyncedPrefs()
    const schedulingTag = await schedulingLib.getSchedulingTag()
    const schedulingTags = schedulingTag.children
    const orderedTags = []

    // make sure 'Tomorrow' and remaining week tags exists and are named correctly
    for (let i = 1; i <= 7; i++) {
      const daysToAdd = new DateComponents()
      daysToAdd.day = i
      const date = Calendar.current.dateByAddingDateComponents(new Date(), daysToAdd)

      // add/rename date-specific tag
      const dayTag = await schedulingLib.getTag(date) || await schedulingLib.createTag(date)
      dayTag.name = schedulingLib.getString(date)
      orderedTags.push(dayTag)

      // add/rename weekday tag if using weekdays
      if (syncedPrefs.readBoolean('useWeekdays')) {
        const weekday = schedulingLib.getDayOfWeek(date)
        const weekdayTag = schedulingTags.byName(`${weekday}s`) || new Tag(`${weekday}s`, schedulingTag)
        orderedTags.push(weekdayTag)
      }
    }

    const futureTags = schedulingTags.filter(tag => !orderedTags.includes(tag))
    const sortedFutureTags = futureTags.sort((a, b) => schedulingLib.getDate(a) - schedulingLib.getDate(b))
    const sorted = orderedTags.concat(sortedFutureTags)

    moveTags(sorted, schedulingTag)
  }

  schedulingLib.updateTags = async () => {
    const syncedPrefs = schedulingLib.loadSyncedPrefs()
    const lastUpdated = syncedPrefs.readDate('lastUpdated')

    const schedulingTag = await schedulingLib.getSchedulingTag()
    const schedulingTags = schedulingTag.children

    for (const tag of schedulingTags) {
      const date = schedulingLib.getDate(tag)

      // move any tags from the past into 'Today'
      if (date !== null && date <= new Date()) schedulingLib.makeToday(tag)

      // remove future date tags with no remaining tasks
      else if (date !== null && schedulingLib.daysFromToday(date) > 7 && tag.remainingTasks.length === 0) deleteObject(tag)
    }

    // weekdays - make current days current, note in synced prefs when last updated - if using weekdays
    if (syncedPrefs.readBoolean('useWeekdays') && (lastUpdated === null || !schedulingLib.isToday(lastUpdated))) {
      const weekday = schedulingLib.getDayOfWeek(new Date())
      const weekdayTag = schedulingTags.byName(`${weekday}s`)

      for (const task of weekdayTag.tasks) if (!schedulingLib.isAfterToday(task.effectiveDeferDate)) schedulingLib.addToToday(task)
    }

    await schedulingLib.recreateTagOrder()

    syncedPrefs.write('lastUpdated', new Date())
  }

  return schedulingLib
})()
