(() => {
  var schedulingConfig = new PlugIn.Library(new Version("1.0"));

  schedulingConfig.todayTag = () => {
    // edit the below line to configure the 'today' tag.
    // by default this will use the first found tag named 'Today'
    // THIS SHOULD BE A TAG OBJECT
    functionLibrary = PlugIn.find("com.KaitlinSalzke.functionLibrary").library(
      "functionLibrary"
    );
    return functionLibrary.findTag("Today");
  };

  return schedulingConfig;
})();
