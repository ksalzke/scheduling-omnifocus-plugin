(() => {
  var action = new PlugIn.Action(function (selection, sender) {
    functionLibrary = PlugIn.find("com.KaitlinSalzke.functionLibrary").library(
      "functionLibrary"
    );

    // if 'sort by importance' plugin installed, delete backup tag
    sortByImportancePlugin = PlugIn.find("com.KaitlinSalzke.sortByImportance");
    if (sortByImportancePlugin !== null) {
      backupCopyTag = sortByImportancePlugin
        .library("sortByImportanceConfig")
        .backupCopyTag();
      deleteObject(backupCopyTag);
    }

    todayTag = functionLibrary.findTag("Today");
    tomorrowTag = functionLibrary.findTag("Tomorrow");

    // Move tasks from 'Tomorrow' to 'Today'
    tomorrowTag.tasks.forEach(function (task) {
      task.addTag(todayTag);
      task.removeTag(tomorrowTag);
    });

    //// Move tomorrow's tasks from named day to 'Tomorrow'
    // get tag with the name of the weekday tomorrow
    timeToAdd = new DateComponents();
    timeToAdd.day = 1;
    tomorrow = Calendar.current.dateByAddingDateComponents(
      new Date(),
      timeToAdd
    );
    tomorrowDay = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
      tomorrow
    );
    tomorrowWeekdayTag = functionLibrary.findTag(tomorrowDay);

    // Replace tag
    tomorrowWeekdayTag.tasks.forEach(function (task) {
      task.addTag(tomorrowTag);
      task.removeTag(tomorrowWeekdayTag);
    });

    // if 'Dependency' plugin is installed, check if dependant tasks have had all prerequisites completed
    dependencyPlugin = PlugIn.find("com.KaitlinSalzke.DependencyForOmniFocus");
    if (dependencyPlugin == null) {
      console.warn("DependencyForOmniFocus plugin is not installed.");
    } else {
      dependencyPlugin.action("checkPrerequisites").perform();
    }

    // if 'com.KaitlinSalzke.config' installed, deal with 'maybe' folders and project tags
    configPlugin = PlugIn.find("com.KaitlinSalzke.config");
    if (configPlugin !== null) {
      config = configPlugin.library("configLibrary");
      maybeFolders = config.maybeFolders();
      maybeFolders.forEach((folder) => {
        // set all projects to on-hold
        folder.apply((item) => {
          if (item instanceof Project) {
            item.status = Project.Status.OnHold;
            return ApplyResult.SkipChildren;
          }
        });
        // move 'maybe' folder to end of parent folder
        library.apply((item) => {
          if (!item instanceof Folder) {
            return ApplyResult.SkipChildren;
          } else {
            if (item.folders !== undefined && item.folders.includes(folder)) {
              moveSections([folder], item.ending);
            }
          }
        });
      });

      // remove 'project-only' tags from non-project items
      allRemainingTasks = functionLibrary.getAllRemainingTasks();
      functionLibrary.removeProjectTagsFromTasks(
        allRemainingTasks,
        config.projectTags()
      );
    }
  });

  action.validate = function (selection, sender) {
    return true;
  };

  return action;
})();
