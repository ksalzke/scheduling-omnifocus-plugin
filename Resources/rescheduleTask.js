/*{
	"type": "action",
	"targets": ["omnifocus"],
	"author": "Kaitlin Salzke",
	"identifier": "com.KaitlinSalzke.rescheduleTasks",
	"version": "1.0",
	"description": "Replace scheduled tag for selected tasks",
	"label": "Reschedule Task(s)",
	"shortLabel": "Reschedule Task(s)"
}*/
var _ = (function() {
  var action = new PlugIn.Action(function(selection, sender) {
    // action code
    // selection options: tasks, projects, folders, tags

    // GET CONFIGURATION INFO

    config = PlugIn.find("com.KaitlinSalzke.config").library("configLibrary");
    rescheduleChoices = config.rescheduleChoices;
    tomorrowTag = config.tomorrowTag;

    // show form to select follow up method
    var inputForm = new Form();

    // generate labels for popup menu
    rescheduleChoicesLabels = [];
    rescheduleChoices.forEach(function(tag) {
      rescheduleChoicesLabels.push(tag.name);
    });

    popupMenu = new Form.Field.Option(
      "rescheduleDate",
      "Date to reschedule to",
      rescheduleChoices,
      rescheduleChoicesLabels,
      tomorrowTag
    );

    inputForm.addField(popupMenu);

    // PRESENT THE FORM TO THE USER
    formPrompt = "Reschedule to:";
    formPromise = inputForm.show(formPrompt, "Continue");

    // VALIDATE THE USER INPUT
    inputForm.validate = function(formObject) {
      validation = true;
      return validation;
    };

    // PROCESSING USING THE DATA EXTRACTED FROM THE FORM
    formPromise.then(function(formObject) {
      selectedRescheduleDate = formObject.values["rescheduleDate"];
      selection.tasks.forEach(function(task) {
        task.removeTags(rescheduleChoices);
        task.addTag(selectedRescheduleDate);
      });
    });

    // PROMISE FUNCTION CALLED UPON FORM CANCELLATION
    formPromise.catch(function(err) {
      console.log("form cancelled", err.message);
    });
  });

  action.validate = function(selection, sender) {
    // validation code
    // selection options: tasks, projects, folders, tags
    return selection.tasks.length > 0;
  };

  return action;
})();
_;
