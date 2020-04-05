/*{
	"type": "action",
	"targets": ["omnifocus"],
	"author": "Kaitlin Salzke",
	"identifier": "com.KaitlinSalzke.markDueTasksAsMIT",
	"version": "1.0",
	"description": "Tag tasks due today with 'MIT'",
	"label": "Mark Due As MIT",
	"shortLabel": "Mark Due As MIT"
}*/

(() => {
  var action = new PlugIn.Action(function (selection, sender) {
    config = this.schedulingConfig;
    todayTag = config.todayTag();

    var now = new Date();
    var today = Calendar.current.startOfDay(now);

    var tasksDueToday = new Array();
    library.apply(function (item) {
      if (item instanceof Project && item.task.hasChildren) {
        item.task.children.forEach((tsk) => {
          if (tsk.effectiveDueDate !== null) {
            if (
              Calendar.current.startOfDay(tsk.effectiveDueDate).getTime() ==
              today.getTime()
            ) {
              tasksDueToday.push(tsk);
            }
          }
        });
      }
    });

    tasksDueToday.forEach((task) => {
      task.addTag(todayTag);
    });
  });

  action.validate = function (selection, sender) {
    return true;
  };

  return action;
})();
