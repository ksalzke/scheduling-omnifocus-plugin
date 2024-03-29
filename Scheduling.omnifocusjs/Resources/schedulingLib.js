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
    const components = Calendar.current.dateComponentsBetweenDates(startOfToday, startOfDate)

    // if the date is more than a month away, return Infinity
    // in this context, we only care about values within a week
    if (components.month > 0 || components.year > 0 || components.era > 0) {
      return Infinity
    }

    return components.day
  }

  schedulingLib.getDayOfWeek = (date) => {
    const dayFormatter = Formatter.Date.withFormat('EEEE')
    return dayFormatter.stringFromDate(date)
  }

  schedulingLib.getWeekdayTag = async (date) => {
    const tagName = `${schedulingLib.getDayOfWeek(date)}s`
    const schedulingTag = await schedulingLib.getSchedulingTag()
    return schedulingTag.tagNamed(tagName) || new Tag(tagName, schedulingTag)
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
    const tag = parent.children.find(tag => tag.name === dateString || tag.name.includes(`(${dateString})`)) || await schedulingLib.createTag(date)
    return tag
  }

  schedulingLib.getDate = (tag) => {
    const formatter = schedulingLib.getDateFormatter()
    const dateString = schedulingLib.getDateStringFromTag(tag)
    const date = formatter.dateFromString(dateString)
    return date
  }

  schedulingLib.getDateStringFromTag = (tag) => {
    const matches = tag.name.match(/ \((.*)\)$/)
    return matches ? matches[1] : tag.name
  }

  schedulingLib.isToday = (date) => Calendar.current.startOfDay(date).getTime() === Calendar.current.startOfDay(new Date()).getTime()

  schedulingLib.promptAndReschedule = async (tasks) => {
    const syncedPrefs = schedulingLib.loadSyncedPrefs()
    const useScheduledNotifications = syncedPrefs.readBoolean('useScheduledNotifications')

    const form = new Form()

    form.addField(new Form.Field.Date('date', 'Date', null, schedulingLib.getDateFormatter()))
    form.validate = (form) => form.values.date && (schedulingLib.isAfterToday(form.values.date) || schedulingLib.isToday(form.values.date))

    await form.show('(Re)schedule to...', '(Re)schedule')

    for (const task of tasks) await schedulingLib.rescheduleTask(task, form.values.date)
  }

  schedulingLib.rescheduleTask = async (task, date) => {
    const syncedPrefs = schedulingLib.loadSyncedPrefs()
    const schedulingTag = await schedulingLib.getSchedulingTag()
    const todayTag = schedulingLib.todayTag()
    const schedulingTags = schedulingTag.children
    const useScheduledNotifications = syncedPrefs.readBoolean('useScheduledNotifications')

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
      if (todayTag !== null) task.removeTag(todayTag)

      // add new tag
      const dateTag = await schedulingLib.getTag(date)
      task.addTag(dateTag)
    }

    if (useScheduledNotifications) {

      // remove old notifications
      for (notification of task.notifications) task.removeNotification(notification)
      // add new notification
      const defaultScheduledTime = settings.objectForKey('DefaultScheduledNotificationTime')
      const defaultScheduledTimeSplit = defaultScheduledTime.split(':')
      const defaultScheduledHours = defaultScheduledTimeSplit[0]
      const defaultScheduledMinutes = defaultScheduledTimeSplit[1]
      date.setHours(defaultScheduledHours,defaultScheduledMinutes,0)
      task.addNotification(date)
    }

  }

  schedulingLib.unscheduleTasks = async (tasks) => {
    const syncedPrefs = schedulingLib.loadSyncedPrefs()
    const todayTag = schedulingLib.todayTag()
    const schedulingTags = schedulingLib.schedulingTag().children
    for (task of tasks) {
      if (syncedPrefs.readBoolean('flagToday')) task.flagged = false
      if (syncedPrefs.readBoolean('useScheduledNotifications')) {
        for (notification of task.notifications) task.removeNotification(notification)
        }
      if (todayTag !== null) task.removeTag(todayTag)
      task.removeTags(schedulingTags)
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
        const weekdayTag = await schedulingLib.getWeekdayTag(date)
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
      const weekdayTag = await schedulingLib.getWeekdayTag(new Date())
      for (const task of weekdayTag.tasks) if (!schedulingLib.isAfterToday(task.effectiveDeferDate)) schedulingLib.addToToday(task)
    }

    await schedulingLib.recreateTagOrder()

    syncedPrefs.write('lastUpdated', new Date())
  }

  schedulingLib.getScheduleInfo = async (task) => {
    const syncedPrefs = schedulingLib.loadSyncedPrefs()

    const schedulingTag = await schedulingLib.getSchedulingTag()
    const schedulingTags = schedulingTag.children

    const appliedTags = task.tags.filter(tag => schedulingTags.includes(tag))

    const oxford = (arr, conjunction, ifempty) => {
      let l = arr.length;
      if (!l) return ifempty;
      if (l<2) return arr[0];
      if (l<3) return arr.join(` ${conjunction} `);
      arr = arr.slice();
      arr[l-1] = `${conjunction} ${arr[l-1]}`;
      return arr.join(", ");
  }

    return oxford(appliedTags.map(t => t.name), 'and', '')
  }

  return schedulingLib
})()
