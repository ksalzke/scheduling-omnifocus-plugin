/* global PlugIn Version Formatter flattenedTags Tag Calendar moveTags deleteObject */
(() => {
  const schedulingLib = new PlugIn.Library(new Version('1.0'))

  schedulingLib.getDateFormatter = () => {
    return Formatter.Date.withStyle(Formatter.Date.Style.Medium)
  }

  schedulingLib.getDateString = (date) => {
    const formatter = schedulingLib.getDateFormatter()
    return formatter.stringFromDate(date)
  }

  schedulingLib.getString = (date) => {
    const startOfToday = Calendar.current.startOfDay(new Date())
    const startOfDate = Calendar.current.startOfDay(date)
    const dateString = schedulingLib.getDateString(date)
    const daysFromToday = Calendar.current.dateComponentsBetweenDates(startOfToday, startOfDate).day
    if (daysFromToday >= 7) return dateString
    if (daysFromToday === 1) return `Tomorrow (${dateString})`
    if (daysFromToday === 0) return null // TODO: Get from prefs if applicable

    // otherwise, date is in next 7 days - include day of week
    const dayFormatter = Formatter.Date.withFormat('EEEE')
    const dayString = dayFormatter.stringFromDate(date)
    return `${dayString} (${dateString})`
  }

  schedulingLib.getSchedulingTag = () => {
    // TODO: Prompt for tag if it doesn't already exist - and use synced prefs for this
    return flattenedTags.byName('Scheduling')
  }

  schedulingLib.createTag = date => {
    const parent = schedulingLib.getSchedulingTag()
    const tag = new Tag(schedulingLib.getString(date), parent)
    schedulingLib.sortDateTags()
    return tag
  }

  schedulingLib.getTag = (date) => {
    const dateString = schedulingLib.getDateString(date)
    const parent = schedulingLib.getSchedulingTag()

    if (dateString === null) return null // date is today and not using today tag TODO: allow today tag to be set via pref

    const tag = parent.children.find(tag => tag.name.includes(dateString)) || schedulingLib.createTag(date)
    return tag
  }

  schedulingLib.sortDateTags = () => {
    const parent = schedulingLib.getSchedulingTag()
    const sortedTags = parent.children.sort((a, b) => { return schedulingLib.getDate(a) - schedulingLib.getDate(b) })
    moveTags(sortedTags, parent)
  }

  schedulingLib.getDate = (tag) => {
    const formatter = schedulingLib.getDateFormatter()
    const date = formatter.dateFromString(tag.name)
    return date
  }

  schedulingLib.isToday = (date) => {
    console.log(Calendar.current.startOfDay(date).getTime())
    console.log(Calendar.current.startOfDay(new Date()).getTime())
    return Calendar.current.startOfDay(date).getTime() === Calendar.current.startOfDay(new Date()).getTime()
  }

  schedulingLib.rescheduleTask = (task, date) => {
    if (schedulingLib.isToday(date)) task.flagged = true
    else {
      const dateTag = schedulingLib.getTag(date)
      task.flagged = false // TODO: flag depends on prefs
      task.removeTags(schedulingLib.getSchedulingTag().children)
      task.addTag(dateTag)
    }
  }

  schedulingLib.makeToday = (tag) => {
    // TODO: add flag/tag option
    for (const task of tag.tasks) task.flagged = true
    deleteObject(tag)
  }

  schedulingLib.updateTags = () => {
    // sort tags
    schedulingLib.sortDateTags()

    // move any tags from the past into 'Today'
    for (const tag of schedulingLib.getSchedulingTag().children) {
      if (schedulingLib.getDate(tag) < new Date()) schedulingLib.makeToday(tag)
      else break
    }
    // make sure 'Tomorrow' tag exists and is correct date
    const timeToAdd = new DateComponents()
    timeToAdd.day = 1
    const tomorrow = Calendar.current.dateByAddingDateComponents(new Date(), timeToAdd)
    const tomorrowTag = schedulingLib.getTag(tomorrow)
    if (tomorrowTag !== null) tomorrowTag.name = schedulingLib.getString(tomorrow)
    else schedulingLib.createTag(tomorrow)

    // TODO: make sure remaining week tags exist and are correct date
  }

  return schedulingLib
})()
