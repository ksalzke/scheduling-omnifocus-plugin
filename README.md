# About

This is an OmniFocus plug-in that assigns a 'do date' to tasks using a system of tags.

_Please note that all scripts on my GitHub account (or shared elsewhere) are works in progress. If you encounter any issues or have any suggestions please let me know--and do please make sure you backup your database before running scripts from the internet!)_

## Known issues 

Refer to ['issues'](https://github.com/ksalzke/scheduling-omnifocus-plugin/issues) for known issues and planned changes/enhancements.

# Installation & Set-Up

## Synced Preferences Plug-In

**Important note: for this plug-in bundle to work correctly, my [Synced Preferences for OmniFocus plug-in](https://github.com/ksalzke/synced-preferences-for-omnifocus) is also required and needs to be added to the plug-in folder separately.**

## Installation

1. Download the [latest release](https://github.com/ksalzke/scheduling-omnifocus-plugin/releases/latest).
2. Unzip the downloaded file.
3. Move the `.omnifocusjs` file to your OmniFocus plug-in library folder (or open it to install).
4. If desired, configure your preferences using the `Preferences` action.

## Set-Up

This plug-in utilises a series of tags which are nested under a user-specified 'Scheduling' tag, which may be placed anywhere in the tag hierarchy and can have any name. This tag should be created manually, and then set in the preferences.

Optionally, a 'Today' tag can also be used.

# Actions

This plug-in contains the following actions:

## (Re)schedule Task(s)

This action can be run when one or more tasks are selected.

It prompts the user to enter a date (which may use Omni's [shorthand date terminology](https://omni-automation.com/shared/formatter-date.html)) and 'reschedules' the task to that date by assigning a tag.

TODO: add screenshot

## Update Schedule

This action can be run at any time. You may wish to run this in the background on a daily basis using the included Keyboard Maestro macro.

It runs the `updateTags()` function from the library (described in detail below), which moves any tasks scheduled for today (or the past) to today, by applying a flag and/or assigning a tag (as determined by the user's preferences.) It also updates the tag order and removes any tags that are more than a week in the future and do not have any remaining tasks assigned to them.

TODO: Add screenshot

## Preferences: Scheduling

This action allows the user to set the preferences for the plug-in. These sync between devices using the Synced Preferences plug-in linked above.

The following preferences are available:

* **Scheduling tag:** This is the root tag under which all 'Scheduling' tags are created by the plug-in. It can be named anything and located anywhere in the tag hierarchy.
* **'Today' tag:** A tag that denotes tasks that have been scheduled for Today. This is optional. If 'None' is selected, no today tag is used.
* **Flag denotes 'Today' tasks.** If selected, flags are used to represent 'Today' tasks. Note that if a task is rescheduled from today and this checkbox is selected, the flag will be _removed_ from the task. 
* **Use recurring weekday-based scheduling.** If selected, tags for each day of the week (e.g. 'Wednesdays', 'Thursdays' and 'Fridays') will also be created, which can contain repeating tasks. These will be marked as 'Today' each week on that day, provided the defer date of the task is not _after_ the specified day. (e.g. if a task is tagged with 'Wednesdays' but is deferred until Thursday, it will be assumed the task has been completed early and won't be marked 'Today')

# Functions

This plug-in contains the following functions within the `schedulingLib` library.

## `loadSyncedPrefs () : SyncedPref`

Returns the [SyncedPref](https://github.com/ksalzke/synced-preferences-for-omnifocus) object for this plug-in.

If the user does not have the plug-in installed correctly, they are alerted.

## `todayTag () : Tag | null`

Returns the 'Today' tag set in preferences. If no tag has been set, or the tag no longer exists, returns null.

## `getDateFormatter () : Formatter.Date`

Returns the Omni Automation date formatter that is used to format the date strings. This uses the user’s “medium” format as selected in system settings. 

## `getDateString (date: Date) : String`

Returns a string for the given date, based on the user's "medium" format selected in system settings.

## `daysFromToday (date: Date) : Number`

Returns the number of days between today and the given date.

## `getDayOfWeek (date: Date) : String`

Returns the day of the week for the given date.

## `getString (date: Date) : String | null`

Returns a string that is used as the tag name for the given date. This uses the user's "medium" format as selected in system settings, and depends on how far in the future the date is.

If the date is today, returns null.
If the date is tomorrow returns 'Tomorrow' and the date e.g. 'Tomorrow (24 Feb 2022)'
If the date is after tomorrow but in the next seven days, returns the weekday followed by the date e.g. 'Sunday (27 Feb 2022)'.
If the date is not in the next seven days, returns the date e.g. '4 Mar 2022'.

## `isAfterToday (date: Date) : Boolean`

Returns true if the given date is after today; otherwise returns false.

## `schedulingTag () : Tag | null`

Returns the 'Scheduling' tag set in preferences. If no tag has been set, or the tag no longer exists, returns null.

## `getSchedulingTag () : Tag`

**Asynchronous.** Returns the 'Scheduling' tag set in preferences. If no tag has been set, or the tag no longer exists, displays the preferences pane.

## `createTag (date: Date) : Tag`

**Asynchronous.** Creates a tag for the provided date and re-orders the scheduling tags as needed.

## `getTag (date: Date) : Tag`

**Asynchronous.** Returns the tag for the provided date, if it exists. If no tag exists for the given date, uses `createTag` to create one.

## `getDate (tag: Tag) : Date | null`

Returns the date for a given tag. If no date can be parsed, returns null.

## `isToday (date: Date) : Boolean`

Returns true if the given date is today; otherwise, returns false.

## `rescheduleTask (task: Task, date: Date)`
 
**Asynchronous.** 'Reschedules' the given task to the specified date by removing any existing 'scheduling' tags, and adding the tag for the given day.

## `addToToday (task: Task)`

Moves a task to today by flagging and/or tagging with the 'Today' tag as specified in preferences.

## `makeToday (tag: Tag)`

Moves all of the tasks from a tag to today by running `addToToday` on each of its tasks, and deleting the tag.

## `recreateTagOrder ()`

**Asynchronous.** Re-orders the scheduling tags (and renames them if necessary), in an order similar to the below:

TODO: insert screenshot

## `updateTags ()`

**Asynchronous.** This function:
1. moves any past tags to 'Today' (using `makeToday`),

2. removes any future date tags (more than a week in the future) that have no remaining tasks,
   
3. if the option is selected in preferences, schedules any relevant 'weekdays' tasks for today, and
   
4. re-orders the scheduling tags using `recreateTagOrder`.