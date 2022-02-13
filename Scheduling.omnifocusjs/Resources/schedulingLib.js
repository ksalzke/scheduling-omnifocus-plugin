/* global PlugIn Version Formatter flattenedTags Tag Calendar moveTags */
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
    const dateString = schedulingLib.getDateString(date)
    const daysFromToday = Calendar.current.dateComponentsBetweenDates(new Date(), date).day
    if (daysFromToday >= 7) return dateString

    if (daysFromToday <= 1) return `Tomorrow (${dateString})`

    // otherwise, date is in next 7 days - include day of week
    const dayFormatter = Formatter.Date.withFormat('EEEE')
    const dayString = dayFormatter.stringFromDate(date)
    return `${dayString} (${dateString})`
  }

  schedulingLib.getSchedulingTag = () => {
    // TODO: Prompt for tag if it doesn't already exist - and use synced prefs for this
    return flattenedTags.byName('Scheduling')
  }

  schedulingLib.getTag = (date) => {
    const dateString = schedulingLib.getDateString(date)
    const parent = schedulingLib.getSchedulingTag()

    const createTag = date => {
      const tag = new Tag(schedulingLib.getString(date), parent)
      schedulingLib.sortDateTags()
      return tag
    }

    const tag = parent.children.find(tag => tag.name.includes(dateString)) || createTag(date)
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
      if (schedulingLib.getDate(tag) < new Date()) schedulingLib.makeToday()
      else break
    }
  }

  return schedulingLib
})()
