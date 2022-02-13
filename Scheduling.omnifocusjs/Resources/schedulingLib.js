/* global PlugIn Version Formatter flattenedTags Tag Calendar */
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
    return flattenedTags.byName('Scheduled')
  }

  schedulingLib.getTag = (date) => {
    const dateString = schedulingLib.getDateString(date)
    const parent = schedulingLib.getSchedulingTag()
    const tag = parent.children.find(tag => tag.name.includes(dateString)) || new Tag(schedulingLib.getString(date), parent)
    return tag

    // if tag does not exist
    // TODO: deal with existing tags that are not in this format?
    // TODO: sort tags by date
  }

  schedulingLib.sortDateTags = () => {
    // TODO: implement this
  }

  schedulingLib.getDate = (tag) => {
    // TODO: implement this
  }

  return schedulingLib
})()
