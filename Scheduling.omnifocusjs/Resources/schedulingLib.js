/* global PlugIn Version Formatter flattenedTags Tag Calendar moveTags deleteObject */
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

  schedulingLib.getSchedulingTag = () => {
    // TODO: Prompt for tag if it doesn't already exist - and use synced prefs for this
    return flattenedTags.byName('Scheduling')
  }

  schedulingLib.createTag = date => {
    const parent = schedulingLib.getSchedulingTag()
    const tag = new Tag(schedulingLib.getString(date), parent)
    schedulingLib.recreateTagOrder()
    return tag
  }

  schedulingLib.getTag = (date) => {
    const dateString = schedulingLib.getDateString(date)
    const parent = schedulingLib.getSchedulingTag()

    if (dateString === null) return schedulingLib.todayTag()

    const tag = parent.children.find(tag => tag.name.includes(dateString)) || schedulingLib.createTag(date)
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

  schedulingLib.rescheduleTask = (task, date) => {
    if (schedulingLib.isToday(date)) schedulingLib.addToToday(task)
    else {
      const dateTag = schedulingLib.getTag(date)
      task.flagged = false // TODO: flag depends on prefs
      task.removeTags(schedulingLib.getSchedulingTag().children)
      task.addTag(dateTag)
    }
  }

  schedulingLib.addToToday = (task) => {
    task.flagged = true // TODO: depend on prefs

    const todayTag = schedulingLib.todayTag()
    if (todayTag !== null) task.addTag(todayTag)
  }

  schedulingLib.makeToday = (tag) => {
    for (const task of tag.tasks) schedulingLib.addToToday(task)
    deleteObject(tag)
  }

  schedulingLib.recreateTagOrder = () => {
    const schedulingTag = schedulingLib.getSchedulingTag()
    const schedulingTags = schedulingTag.children
    const orderedTags = []

    // make sure 'Tomorrow' and remaining week tags exists and are named correctly
    for (let i = 1; i <= 7; i++) {
      const daysToAdd = new DateComponents()
      daysToAdd.day = i
      const date = Calendar.current.dateByAddingDateComponents(new Date(), daysToAdd)

      // add/rename date-specific tag
      const dayTag = schedulingLib.getTag(date) || schedulingLib.createTag(date)
      dayTag.name = schedulingLib.getString(date)
      orderedTags.push(dayTag)

      // add/rename weekday tag TODO: make optional
      const weekday = schedulingLib.getDayOfWeek(date)
      const weekdayTag = schedulingTags.byName(`${weekday}s`) || new Tag(`${weekday}s`)
      orderedTags.push(weekdayTag)
    }
    
    const futureTags = schedulingTags.filter(tag => !orderedTags.includes(tag))
    const sortedFutureTags = futureTags.sort((a, b) => schedulingLib.getDate(a) - schedulingLib.getDate(b) )
    const sorted = orderedTags.concat(sortedFutureTags)

    moveTags(sorted, schedulingTag)
  }

  schedulingLib.updateTags = () => {

    const syncedPrefs = schedulingLib.loadSyncedPrefs()
    const lastUpdated = syncedPrefs.readDate('lastUpdated')

    // TODO: combine into one 'for' loop

    // move any tags from the past into 'Today'
    for (const tag of schedulingLib.getSchedulingTag().children) {
      const date = schedulingLib.getDate(tag)
      if (date !== null && date <= new Date()) schedulingLib.makeToday(tag)
    }

    // Remove future date tags with no remaining tasks
    for (const tag of schedulingLib.getSchedulingTag().children) {
      const date = schedulingLib.getDate(tag)
      if (date !== null && schedulingLib.daysFromToday(date) > 7 && tag.remainingTasks.length === 0) deleteObject(tag)
    }
    
    // weekdays - make current days current, note in synced prefs when last updated
    for (const tag of schedulingLib.getSchedulingTag().children) { // TODO: make optional
      if (lastUpdated === null || !schedulingLib.isToday(lastUpdated)) {
        const weekday = schedulingLib.getDayOfWeek(new Date())
        const weekdayTag = schedulingLib.getSchedulingTag().children.byName(`${weekday}s`) // TODO: use schedulingTags const
        
        // get start of tomorrow
        const daysToAdd = new DateComponents()
        daysToAdd.day = 1
        const startOfTomorrow = Calendar.current.startOfDay(Calendar.current.dateByAddingDateComponents(new Date(), daysToAdd))
        
        for (const task of weekdayTag.tasks) if (task.effectiveDeferDate < startOfTomorrow) schedulingLib.addToToday(task)
      }
    }

    schedulingLib.recreateTagOrder()

    syncedPrefs.write('lastUpdated', new Date())
  }

  return schedulingLib
})()
