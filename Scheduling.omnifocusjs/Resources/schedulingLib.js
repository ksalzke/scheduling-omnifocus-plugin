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
    if (Calendar.current.dateComponentsBetweenDates(new Date(), date) > 8) return dateString

    // TODO: Use 'Tomorrow' for tomorrow

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
    // TODO: implement this
    const parent = schedulingLib.getSchedulingTag()
    const sortedTags = parent.children.sort((a, b) => { return schedulingLib.getDate(a) - schedulingLib.getDate(b) })
    moveTags(sortedTags, parent)
  }

  schedulingLib.getDate = (tag) => {
    // TODO: implement this
    const formatter = schedulingLib.getDateFormatter()
    const date = formatter.dateFromString(tag.name)
    return date
  }

  return schedulingLib
})()
