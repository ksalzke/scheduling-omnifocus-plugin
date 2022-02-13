/* global PlugIn Version Formatter flattenedTags Tag Calendar */
(() => {
  const schedulingLib = new PlugIn.Library(new Version('1.0'))

  schedulingLib.getDateString = (date) => {
    const formatter = Formatter.Date.withStyle(Formatter.Date.Style.Medium)
    return formatter.stringFromDate(date)
  }

  schedulingLib.getString = (date) => {
    const dateString = schedulingLib.getDateString(date)
    if (Calendar.current.dateComponentsBetweenDates(new Date(), date) > 8) return dateString

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
    const name = schedulingLib.getDateString(date)
    const parent = schedulingLib.getSchedulingTag()
    const tag = parent.children.find(tag => tag.name.includes(name))
    if (tag !== null) return tag

    // else tag does not exist
    return new Tag(name, parent)
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
