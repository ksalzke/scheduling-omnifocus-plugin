/* global PlugIn deleteObject Calendar DateComponents Project ApplyResult library Folder moveSections */
(() => {
  const action = new PlugIn.Action(function (selection, sender) {
    const functionLibrary = PlugIn.find('com.KaitlinSalzke.functionLibrary').library(
      'functionLibrary'
    )

    // if 'sort by importance' plugin installed, delete backup tag
    const sortByImportancePlugin = PlugIn.find('com.KaitlinSalzke.sortByImportance')
    if (sortByImportancePlugin !== null) {
      const backupCopyTag = sortByImportancePlugin
        .library('sortByImportanceConfig')
        .backupCopyTag()
      deleteObject(backupCopyTag)
    }

    // const todayTag = functionLibrary.findTag('Today')
    const tomorrowTag = functionLibrary.findTag('Tomorrow')

    // Move tasks from 'Tomorrow' to 'Today'
    tomorrowTag.tasks.forEach(function (task) {
      task.flagged = true
      task.removeTag(tomorrowTag)
    })

    // add 'Today' tag to any tasks assigned to '<Weekday>s'
    /* const now = new Date()
    const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now)
    const weekdaysTag = tagsMatching(`${weekday}s`)[0]
    weekdaysTag.tasks.forEach(task => {
      task.addTag(todayTag)
    }) */

    /// / Move tomorrow's tasks from named day to 'Tomorrow'
    // get tag with the name of the weekday tomorrow
    const timeToAdd = new DateComponents()
    timeToAdd.day = 1
    const tomorrow = Calendar.current.dateByAddingDateComponents(
      new Date(),
      timeToAdd
    )
    const tomorrowDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(
      tomorrow
    )
    const tomorrowWeekdayTag = functionLibrary.findTag(tomorrowDay)

    // Replace tag
    tomorrowWeekdayTag.tasks.forEach(function (task) {
      task.addTag(tomorrowTag)
      task.removeTag(tomorrowWeekdayTag)
    })

    // Tag any tasks due today with 'Due Today'
    PlugIn.find('com.KaitlinSalzke.Scheduling').action('tagDueTasks').perform()

    // if 'Dependency' plugin is installed, check if dependant tasks have had all prerequisites completed, and update due dates
    const dependencyPlugin = PlugIn.find('com.KaitlinSalzke.DependencyForOmniFocus')
    if (dependencyPlugin == null) {
      console.warn('DependencyForOmniFocus plugin is not installed.')
    } else {
      dependencyPlugin.action('checkPrerequisites').perform()
      dependencyPlugin.action('updateDueDates').perform()
    }

    // if 'com.KaitlinSalzke.config' installed, deal with 'maybe' folders and project tags
    const configPlugin = PlugIn.find('com.KaitlinSalzke.config')
    if (configPlugin !== null) {
      const config = configPlugin.library('configLibrary')
      const maybeFolders = config.maybeFolders()
      maybeFolders.forEach((folder) => {
        // set all projects to on-hold
        folder.apply((item) => {
          if (item instanceof Project) {
            item.status = Project.Status.OnHold
            return ApplyResult.SkipChildren
          }
        })
        // move 'maybe' folder to end of parent folder
        library.apply((item) => {
          if (!(item instanceof Folder)) {
            return ApplyResult.SkipChildren
          } else {
            if (item.folders !== undefined && item.folders.includes(folder)) {
              moveSections([folder], item.ending)
            }
          }
        })
      })

      // remove 'project-only' tags from non-project items
      const allRemainingTasks = functionLibrary.getAllRemainingTasks()
      functionLibrary.removeProjectTagsFromTasks(
        allRemainingTasks,
        config.projectTags()
      )
    }
  })

  action.validate = function (selection, sender) {
    // only valid if nothing is selected - so does not show in share menu
    return selection.tasks.length === 0 && selection.projects.length === 0
  }

  return action
})()
