import * as Notifications from 'expo-notifications';
import { CookingPlan, CookingStep } from './types';

function queuedRoundBody(step: CookingStep) {
  if (step.skipTarget === 'baste') {
    return `Continue cooking for 45 seconds and keep checking for ${step.temperatureReference}. Start basting as soon as it is reached.`;
  }
  if (step.skipTarget === 'rest') {
    return `Continue ${step.phase === 'baste' ? 'basting' : 'cooking'} for 45 seconds. Rest as soon as the center reaches ${step.temperatureReference}.`;
  }
  if (step.phase === 'baste') return 'Baste this side continuously over medium-low heat for 45 seconds.';
  if (step.phase === 'indirect') return 'Continue gentle indirect cooking on the other side for 45 seconds.';
  return 'Continue the current cooking stage on the other side for 45 seconds.';
}

function checkpointBody(step: CookingStep) {
  if (step.temperatureCue === 'preSear') {
    return `Check the center for the final-sear reference: ${step.temperatureReference}.`;
  }
  return `Lift the steak, insert from the side just beyond center, then withdraw slowly. Reference: ${step.temperatureReference}.`;
}

async function scheduleCheckpoint(step: CookingStep, seconds: number) {
  if (!step.temperatureCue || seconds < 1) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Temperature check now',
      body: checkpointBody(step),
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let notificationWork = Promise.resolve();
let notificationRevision = 0;

function serializeNotificationWork(operation: () => Promise<void>) {
  const result = notificationWork.then(operation, operation);
  notificationWork = result.catch(() => undefined);
  return result.catch(() => undefined);
}

export async function requestNotificationPermission() {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.status === 'granted';
  } catch {
    return false;
  }
}

export function cancelCookingNotifications() {
  const revision = ++notificationRevision;
  return serializeNotificationWork(async () => {
    if (revision !== notificationRevision) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  });
}

export function scheduleCookingNotifications(
  plan: CookingPlan,
  startingAt = 0,
  firstStepSeconds?: number,
  queuedFlipRounds = 0,
) {
  const revision = ++notificationRevision;
  return serializeNotificationWork(() =>
    revision === notificationRevision
      ? scheduleCookingNotificationsNow(plan, startingAt, firstStepSeconds, queuedFlipRounds, () => revision === notificationRevision)
      : Promise.resolve(),
  );
}

async function scheduleCookingNotificationsNow(
  plan: CookingPlan,
  startingAt: number,
  firstStepSeconds: number | undefined,
  queuedFlipRounds: number,
  isCurrent: () => boolean,
) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!isCurrent()) return;
  let elapsed = 0;

  for (let index = startingAt; index < plan.steps.length; index += 1) {
    const stepSeconds =
      index === startingAt && firstStepSeconds !== undefined
        ? firstStepSeconds
        : plan.steps[index].durationSeconds;
    const checkpointLead = plan.steps[index].temperatureCue === 'preSear' ? 30 : 15;
    if (plan.steps[index].temperatureCue && stepSeconds > checkpointLead) {
      await scheduleCheckpoint(plan.steps[index], Math.max(1, elapsed + stepSeconds - checkpointLead));
      if (!isCurrent()) return;
    }
    elapsed += stepSeconds;

    const next = plan.steps[index + 1];
    const decisionGate = plan.steps[index].requiresDecisionBeforeNext && next?.phase === 'rest';

    if (index === startingAt && queuedFlipRounds > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Flip the steak now',
          body: queuedRoundBody(plan.steps[index]),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, elapsed),
        },
      });
      if (!isCurrent()) return;

      for (let round = 1; round <= queuedFlipRounds; round += 1) {
        if (plan.steps[index].temperatureCue) {
          await scheduleCheckpoint(plan.steps[index], Math.max(1, elapsed + 30));
          if (!isCurrent()) return;
        }
        elapsed += 45;
        const anotherRound = round < queuedFlipRounds;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: anotherRound
              ? 'Flip the steak again'
              : decisionGate
                ? 'Check your steak'
                : next
                  ? `Next: ${next.title}`
                  : 'Steak Ready',
            body: anotherRound
              ? queuedRoundBody(plan.steps[index])
              : decisionGate
                ? 'Return to SteakPilot and choose Rest Steak Now or add another 45 seconds.'
                : next
                  ? next.instruction
                  : 'Rest complete. Slice and serve.',
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.max(1, elapsed),
          },
        });
        if (!isCurrent()) return;
      }

      if (decisionGate) break;
      continue;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: decisionGate ? 'Check your steak' : next ? `Next: ${next.title}` : 'Steak Ready',
        body: decisionGate
          ? 'Return to SteakPilot and choose Rest Steak Now or add another 45 seconds.'
          : next
            ? next.instruction
            : 'Rest complete. Slice and serve.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, elapsed),
      },
    });
    if (!isCurrent()) return;

    if (decisionGate) break;
  }
}
