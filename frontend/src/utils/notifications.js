import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();

  return status === 'granted';
}

export async function scheduleStudyReminder(session) {
  const startDate = new Date(session.start_time);

  const reminderDate = new Date(
    startDate.getTime() - 10 * 60 * 1000
  );

  if (reminderDate <= new Date()) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Study Session Reminder',
      body: `${session.class_name} start in 10 minutes`,
      sound: true,
    },
    trigger: {
      date: reminderDate,
      type: Notifications.SchedulableTriggerInputTypes.DATE,
    },
  });

  console.log(`Scheduled reminder for session ${session.id} at ${reminderDate}`);
}
