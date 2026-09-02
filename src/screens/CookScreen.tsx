import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import * as Speech from 'expo-speech';
import { PrimaryButton } from '../components/PrimaryButton';
import { BrandMark } from '../components/BrandMark';
import { CookGuideVisual } from '../components/CookGuideVisual';
import { cancelCookingNotifications, scheduleCookingNotifications } from '../notifications';
import { colors } from '../theme';
import { ActiveCookSession, CookingPlan, CookingStep } from '../types';

interface Props {
  plan: CookingPlan;
  onDone: () => void;
  onSessionChange: (session: ActiveCookSession | null) => void;
  resumeSession?: ActiveCookSession | null;
}

function clock(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60)
    .toString()
    .padStart(2, '0')}`;
}

function cueAnnouncement(step: CookingStep) {
  if (step.temperatureCue === 'baste') return 'Temperature checkpoint this round. Check during the final 15 seconds.';
  if (step.temperatureCue === 'preSear') return 'Final-sear checkpoint this round. Check during the final 30 seconds.';
  if (step.temperatureCue === 'pull') return 'Pull checkpoint when this timer ends.';
  return '';
}

function cueLabel(step: CookingStep) {
  if (step.temperatureCue === 'baste') return `START BASTING AT ${step.temperatureReference}`;
  if (step.temperatureCue === 'preSear') return `START FINAL SEAR AT ${step.temperatureReference}`;
  if (step.temperatureCue === 'pull') return `TARGET REACHED AT ${step.temperatureReference}`;
  return '';
}

function extraRoundInstruction(step: CookingStep) {
  if (step.skipTarget === 'baste') {
    return `Flip now and continue cooking for 45 seconds. Keep checking the center; start basting as soon as it reaches ${step.temperatureReference}.`;
  }
  if (step.skipTarget === 'rest') {
    return `Flip now and continue ${step.phase === 'baste' ? 'basting' : 'cooking'} for 45 seconds. Check the center and rest as soon as it reaches ${step.temperatureReference}.`;
  }
  if (step.temperatureReference) {
    return `Flip now and continue for 45 seconds toward ${step.temperatureReference}. Check the center near the end.`;
  }
  if (step.phase === 'baste') return 'Flip now and baste this side continuously over medium-low heat for 45 seconds.';
  if (step.phase === 'indirect') return 'Turn the steak now and continue gentle indirect cooking for 45 seconds.';
  return 'Flip the steak now and continue the current cooking stage for 45 seconds.';
}

interface UndoSnapshot {
  actionLabel: string;
  groupKey?: string;
  groupCount: number;
  index: number;
  remaining: number;
  paused: boolean;
  awaitingDecision: boolean;
  extraRounds: number;
  manualRound: boolean;
  queuedFlipRounds: number;
}

export function CookScreen({ plan, onDone, onSessionChange, resumeSession }: Props) {
  useKeepAwake('steakpilot-cook');

  const restoredIndex = resumeSession && resumeSession.index >= 0 && resumeSession.index < plan.steps.length
    ? resumeSession.index
    : 0;
  const restoredRemaining = resumeSession
    ? resumeSession.paused || resumeSession.awaitingDecision
      ? resumeSession.remaining
      : Math.max(0, Math.ceil((resumeSession.endTime - Date.now()) / 1000))
    : plan.steps[0]?.durationSeconds ?? 0;
  const [index, setIndex] = useState(restoredIndex);
  const [remaining, setRemaining] = useState(restoredRemaining);
  const [paused, setPaused] = useState(resumeSession?.paused ?? false);
  const [finished, setFinished] = useState(false);
  const [muted, setMuted] = useState(resumeSession?.muted ?? false);
  const [awaitingDecision, setAwaitingDecision] = useState(resumeSession?.awaitingDecision ?? false);
  const [extraRounds, setExtraRounds] = useState(resumeSession?.extraRounds ?? 0);
  const [manualRound, setManualRound] = useState(resumeSession?.manualRound ?? false);
  const [queuedFlipRounds, setQueuedFlipRounds] = useState(resumeSession?.queuedFlipRounds ?? 0);
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);
  const indexRef = useRef(restoredIndex);
  const endTimeRef = useRef(
    resumeSession?.endTime ?? Date.now() + (plan.steps[0]?.durationSeconds ?? 0) * 1000,
  );
  const remainingRef = useRef(remaining);
  const pausedRef = useRef(resumeSession?.paused ?? false);
  const finishedRef = useRef(false);
  const mutedRef = useRef(resumeSession?.muted ?? false);
  const awaitingDecisionRef = useRef(resumeSession?.awaitingDecision ?? false);
  const extraRoundsRef = useRef(resumeSession?.extraRounds ?? 0);
  const manualRoundRef = useRef(resumeSession?.manualRound ?? false);
  const queuedFlipRoundsRef = useRef(resumeSession?.queuedFlipRounds ?? 0);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoSnapshotRef = useRef<UndoSnapshot | null>(null);
  const checkpointReminderKeyRef = useRef('');

  const speak = (message: string) => {
    if (mutedRef.current) return;
    Speech.stop();
    Speech.speak(message, { language: 'en-US', rate: 0.88, pitch: 1 });
  };

  const speakStep = (step: CookingStep, prefix: string) => {
    const cue = cueAnnouncement(step);
    const reference = step.temperatureReference ? ` Temperature reference: ${step.temperatureReference}.` : '';
    speak(`${prefix} ${cue} ${step.title}. ${step.instruction}${reference}`);
  };

  const clearUndo = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    undoSnapshotRef.current = null;
    setUndoSnapshot(null);
  };

  const persistSession = () => {
    if (finishedRef.current) {
      onSessionChange(null);
      return;
    }
    onSessionChange({
      plan,
      index: indexRef.current,
      endTime: endTimeRef.current,
      remaining: remainingRef.current,
      paused: pausedRef.current,
      awaitingDecision: awaitingDecisionRef.current,
      extraRounds: extraRoundsRef.current,
      manualRound: manualRoundRef.current,
      queuedFlipRounds: queuedFlipRoundsRef.current,
      muted: mutedRef.current,
      savedAt: Date.now(),
    });
  };

  const rememberUndo = (actionLabel = 'Last action', groupKey?: string) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    const existing = undoSnapshotRef.current;
    const snapshot: UndoSnapshot = groupKey && existing?.groupKey === groupKey
      ? { ...existing, actionLabel, groupCount: existing.groupCount + 1 }
      : {
      actionLabel,
      groupKey,
      groupCount: 1,
      index: indexRef.current,
      remaining: remainingRef.current,
      paused: pausedRef.current,
      awaitingDecision: awaitingDecisionRef.current,
      extraRounds: extraRoundsRef.current,
      manualRound: manualRoundRef.current,
      queuedFlipRounds: queuedFlipRoundsRef.current,
    };
    undoSnapshotRef.current = snapshot;
    setUndoSnapshot(snapshot);
    undoTimerRef.current = setTimeout(() => {
      undoSnapshotRef.current = null;
      setUndoSnapshot(null);
      undoTimerRef.current = null;
    }, 15_000);
  };

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(true);
    queuedFlipRoundsRef.current = 0;
    setQueuedFlipRounds(0);
    setRemaining(0);
    remainingRef.current = 0;
    cancelCookingNotifications();
    onSessionChange(null);
    Speech.stop();
    speak('Rest complete. Your steak is ready to slice and serve.');
  };

  const enterDecisionGate = () => {
    if (awaitingDecisionRef.current) return;
    awaitingDecisionRef.current = true;
    setAwaitingDecision(true);
    setManualRound(false);
    manualRoundRef.current = false;
    queuedFlipRoundsRef.current = 0;
    setQueuedFlipRounds(0);
    setRemaining(0);
    remainingRef.current = 0;
    cancelCookingNotifications();
    persistSession();
    speak(
      'Cooking checkpoint. Lift the steak from the heat. Insert the thermometer from the side just beyond the center, then withdraw it slowly to find the lowest stable reading. Check more than one muscle. Choose rest steak now, or flip and add another 45 seconds.',
    );
  };

  const updateFromClock = () => {
    if (pausedRef.current || finishedRef.current || awaitingDecisionRef.current) return;
    const now = Date.now();
    let currentIndex = indexRef.current;
    let stageEnd = endTimeRef.current;

    while (now >= stageEnd) {
      const currentStep = plan.steps[currentIndex];
      const nextStep = plan.steps[currentIndex + 1];

      if (queuedFlipRoundsRef.current > 0) {
        clearUndo();
        const queuedAfterStart = queuedFlipRoundsRef.current - 1;
        const completedAfterStart = extraRoundsRef.current + 1;
        queuedFlipRoundsRef.current = queuedAfterStart;
        extraRoundsRef.current = completedAfterStart;
        manualRoundRef.current = true;
        setQueuedFlipRounds(queuedAfterStart);
        setExtraRounds(completedAfterStart);
        setManualRound(true);
        stageEnd += 45_000;
        speak(
          `Timer complete. Extra round ${completedAfterStart}. ${extraRoundInstruction(currentStep)}`,
        );
        continue;
      }

      if (manualRoundRef.current) {
        manualRoundRef.current = false;
        setManualRound(false);
      }
      if (currentStep?.requiresDecisionBeforeNext && nextStep?.phase === 'rest') {
        enterDecisionGate();
        return;
      }
      if (currentIndex >= plan.steps.length - 1) {
        finish();
        return;
      }
      currentIndex += 1;
      stageEnd += plan.steps[currentIndex].durationSeconds * 1000;
    }

    if (currentIndex !== indexRef.current) {
      clearUndo();
      setManualRound(false);
      manualRoundRef.current = false;
      indexRef.current = currentIndex;
      setIndex(currentIndex);
      speakStep(plan.steps[currentIndex], 'Timer complete.');
    }

    endTimeRef.current = stageEnd;
    const nextRemaining = Math.max(0, Math.ceil((stageEnd - now) / 1000));
    remainingRef.current = nextRemaining;
    setRemaining(nextRemaining);

    const activeStep = plan.steps[currentIndex];
    const reminderLead = activeStep.temperatureCue === 'preSear' ? 30 : 15;
    const reminderKey = `${currentIndex}:${extraRoundsRef.current}`;
    if (
      activeStep.temperatureCue
      && nextRemaining > 0
      && nextRemaining <= reminderLead
      && checkpointReminderKeyRef.current !== reminderKey
    ) {
      checkpointReminderKeyRef.current = reminderKey;
      speak(
        activeStep.temperatureCue === 'preSear'
          ? 'Temperature check now. Lift or open the steak area safely and check the center for the final sear target.'
          : 'Temperature check now. Lift the steak from the heat, insert from the side just beyond center, and withdraw slowly for the lowest stable reading.',
      );
    }
  };

  useEffect(() => {
    if (!plan.steps.length) {
      finish();
      return;
    }
    if (resumeSession) {
      updateFromClock();
      if (!finishedRef.current && awaitingDecisionRef.current) {
        cancelCookingNotifications();
        speak('Cooking session restored. Check your steak and choose whether to rest or continue.');
      } else if (!finishedRef.current && pausedRef.current) {
        cancelCookingNotifications();
        speak(`Paused cooking session restored with ${remainingRef.current} seconds remaining.`);
      } else if (!finishedRef.current) {
        scheduleCookingNotifications(
          plan,
          indexRef.current,
          Math.max(1, remainingRef.current),
          queuedFlipRoundsRef.current,
        );
        speakStep(plan.steps[indexRef.current], 'Cooking session restored.');
      }
    } else {
      speakStep(plan.steps[0], 'Cooking started.');
      scheduleCookingNotifications(plan, 0, plan.steps[0].durationSeconds);
      persistSession();
    }
    const timer = setInterval(updateFromClock, 250);
    const appState = AppState.addEventListener('change', (state) => {
      updateFromClock();
      if (state !== 'active') persistSession();
    });
    return () => {
      clearInterval(timer);
      appState.remove();
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      Speech.stop();
    };
    // The cooking plan is locked for the lifetime of this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!finishedRef.current) persistSession();
    // Persist meaningful timer-state transitions without writing storage every 250 ms.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, awaitingDecision, extraRounds, manualRound, queuedFlipRounds, muted]);

  const moveToStep = (targetIndex: number, prefix: string, undoLabel?: string) => {
    if (targetIndex < 0 || targetIndex >= plan.steps.length) return;
    if (undoLabel) rememberUndo(undoLabel);
    awaitingDecisionRef.current = false;
    setAwaitingDecision(false);
    setManualRound(false);
    manualRoundRef.current = false;
    queuedFlipRoundsRef.current = 0;
    setQueuedFlipRounds(0);
    pausedRef.current = false;
    setPaused(false);
    indexRef.current = targetIndex;
    checkpointReminderKeyRef.current = '';
    setIndex(targetIndex);
    const seconds = plan.steps[targetIndex].durationSeconds;
    remainingRef.current = seconds;
    setRemaining(seconds);
    endTimeRef.current = Date.now() + seconds * 1000;
    scheduleCookingNotifications(plan, targetIndex, seconds);
    speakStep(plan.steps[targetIndex], prefix);
  };

  const startRest = () => {
    const restIndex = plan.steps.findIndex((step, stepIndex) => stepIndex > indexRef.current && step.phase === 'rest');
    if (restIndex === -1) {
      finish();
      return;
    }
    moveToStep(restIndex, 'Target reached. Remove the steak from the heat now.', 'Started resting the steak');
  };

  const togglePause = () => {
    if (finishedRef.current || awaitingDecisionRef.current) return;
    if (pausedRef.current) {
      pausedRef.current = false;
      setPaused(false);
      endTimeRef.current = Date.now() + remainingRef.current * 1000;
      speak(`Timer resumed. ${plan.steps[indexRef.current].instruction}`);
      scheduleCookingNotifications(plan, indexRef.current, remainingRef.current, queuedFlipRoundsRef.current);
    } else {
      updateFromClock();
      if (finishedRef.current || awaitingDecisionRef.current) return;
      pausedRef.current = true;
      setPaused(true);
      cancelCookingNotifications();
      Speech.stop();
      speak(`Timer paused with ${remainingRef.current} seconds remaining.`);
    }
  };

  const addFortyFive = () => {
    if (finishedRef.current) return;
    if (awaitingDecisionRef.current) {
      rememberUndo('Started an extra 45-second round');
      const nextRound = extraRoundsRef.current + 1;
      extraRoundsRef.current = nextRound;
      setExtraRounds(nextRound);
      awaitingDecisionRef.current = false;
      setAwaitingDecision(false);
      setManualRound(true);
      manualRoundRef.current = true;
      pausedRef.current = false;
      setPaused(false);
      remainingRef.current = 45;
      setRemaining(45);
      endTimeRef.current = Date.now() + 45_000;
      scheduleCookingNotifications(plan, indexRef.current, 45);
      const action = plan.steps[indexRef.current].phase === 'baste' ? 'Keep basting over medium-low heat.' : 'Continue cooking and turn the steak.';
      speak(
        nextRound === 1
          ? `Extra 45 seconds started. ${action} Warning: avoid overcooking and verify the center in more than one spot.`
          : `Warning. This is extra round ${nextRound}. Carryover cooking will continue during rest. If readings conflict, remove the steak from the heat and recheck before adding more time.`,
      );
      return;
    }

    const current = plan.steps[indexRef.current];
    const flipRound = current.phase === 'sear' || current.phase === 'flip' || current.phase === 'baste' || current.phase === 'indirect';
    if (flipRound) {
      if (queuedFlipRoundsRef.current >= 10) {
        speak('Maximum of 10 queued extra rounds reached. Remove a queued round before adding another.');
        return;
      }
      rememberUndo('Queued extra 45-second flip rounds', `queue-flip-${indexRef.current}`);
      const nextQueued = queuedFlipRoundsRef.current + 1;
      queuedFlipRoundsRef.current = nextQueued;
      setQueuedFlipRounds(nextQueued);
      if (!pausedRef.current) {
        scheduleCookingNotifications(plan, indexRef.current, remainingRef.current, nextQueued);
      }
      speak(
        current.phase === 'baste'
          ? `Extra basting flip queued. Finish the current timer, then flip. ${nextQueued} extra round${nextQueued === 1 ? '' : 's'} queued.`
          : `Extra cooking flip queued. Finish the current timer, then flip. ${nextQueued} extra round${nextQueued === 1 ? '' : 's'} queued.`,
      );
      return;
    }

    rememberUndo(
      current.phase === 'rest' ? 'Added time to the rest timer' : 'Added time to this timer',
      `timer-extension-${indexRef.current}`,
    );
    remainingRef.current += 45;
    setRemaining(remainingRef.current);
    if (!pausedRef.current) {
      endTimeRef.current += 45_000;
      scheduleCookingNotifications(plan, indexRef.current, remainingRef.current);
    }
    persistSession();
    speak(current.phase === 'rest' ? 'Added 45 seconds to the rest.' : 'Added 45 seconds to this step.');
  };

  const skip = () => {
    if (finishedRef.current) return;
    const current = plan.steps[indexRef.current];
    if (current.phase === 'rest') {
      finish();
      return;
    }
    if (current.phase === 'baste' || current.skipTarget === 'rest') {
      startRest();
      return;
    }
    if (current.skipTarget === 'baste') {
      const bastingStartIndex = plan.steps.findIndex(
        (step, stepIndex) => stepIndex > indexRef.current && (step.id === 'lower-heat' || step.id === 'add-butter'),
      );
      if (bastingStartIndex >= 0) {
        moveToStep(bastingStartIndex, 'Basting temperature reached.', 'Skipped ahead to basting');
        return;
      }
    }
    if (current.skipTarget === 'sear') {
      const searIndex = plan.steps.findIndex((step, stepIndex) => stepIndex > indexRef.current && step.id === 'prepare-final-sear');
      if (searIndex >= 0) {
        moveToStep(searIndex, 'Final-sear temperature reached.', 'Skipped ahead to the final sear');
        return;
      }
    }
    if (indexRef.current >= plan.steps.length - 1) finish();
    else moveToStep(indexRef.current + 1, 'Step skipped.', 'Skipped the previous step');
  };

  const removeQueuedFlip = () => {
    if (queuedFlipRoundsRef.current <= 0) return;
    rememberUndo('Removed one queued 45-second round');
    const nextQueued = queuedFlipRoundsRef.current - 1;
    queuedFlipRoundsRef.current = nextQueued;
    setQueuedFlipRounds(nextQueued);
    if (!pausedRef.current) {
      scheduleCookingNotifications(plan, indexRef.current, remainingRef.current, nextQueued);
    }
    speak(
      nextQueued > 0
        ? `Removed one queued extra flip. ${nextQueued} extra round${nextQueued === 1 ? '' : 's'} remain queued.`
        : 'Removed the queued extra flip. The original cooking plan is next again.',
    );
  };

  const endExtraRound = () => {
    if (!manualRoundRef.current) return;
    const currentStep = plan.steps[indexRef.current];
    const nextStep = plan.steps[indexRef.current + 1];
    if (currentStep.requiresDecisionBeforeNext && nextStep?.phase === 'rest') {
      rememberUndo('Ended the extra round');
      enterDecisionGate();
      return;
    }
    if (!nextStep) {
      finish();
      return;
    }
    moveToStep(indexRef.current + 1, 'Extra round ended. Returning to your original plan.', 'Ended the extra round');
  };

  const undoLastAction = () => {
    const snapshot = undoSnapshotRef.current ?? undoSnapshot;
    if (!snapshot) return;
    const undoAnnouncement = snapshot.groupCount > 1
      ? `${snapshot.groupCount} additions undone.`
      : 'Last action undone.';
    clearUndo();
    indexRef.current = snapshot.index;
    checkpointReminderKeyRef.current = '';
    setIndex(snapshot.index);
    remainingRef.current = snapshot.remaining;
    setRemaining(snapshot.remaining);
    pausedRef.current = snapshot.paused;
    setPaused(snapshot.paused);
    awaitingDecisionRef.current = snapshot.awaitingDecision;
    setAwaitingDecision(snapshot.awaitingDecision);
    setExtraRounds(snapshot.extraRounds);
    extraRoundsRef.current = snapshot.extraRounds;
    setManualRound(snapshot.manualRound);
    manualRoundRef.current = snapshot.manualRound;
    setQueuedFlipRounds(snapshot.queuedFlipRounds);
    queuedFlipRoundsRef.current = snapshot.queuedFlipRounds;
    if (snapshot.awaitingDecision) {
      cancelCookingNotifications();
      speak(`${undoAnnouncement} Return to the cooking checkpoint.`);
      return;
    }
    endTimeRef.current = Date.now() + Math.max(1, snapshot.remaining) * 1000;
    if (!snapshot.paused) {
      scheduleCookingNotifications(
        plan,
        snapshot.index,
        Math.max(1, snapshot.remaining),
        snapshot.queuedFlipRounds,
      );
    }
    speakStep(plan.steps[snapshot.index], undoAnnouncement);
  };

  const toggleMute = () => {
    const nextMuted = !mutedRef.current;
    mutedRef.current = nextMuted;
    setMuted(nextMuted);
    Speech.stop();
    if (!nextMuted) {
      Speech.speak(`Voice guidance on. Current step: ${plan.steps[indexRef.current].title}.`, {
        language: 'en-US',
        rate: 0.88,
      });
    }
  };

  const confirmEnd = () =>
    Alert.alert('End cooking session?', 'The active cooking program will stop.', [
      { text: 'Keep Cooking', style: 'cancel' },
      {
        text: 'End Session',
        style: 'destructive',
        onPress: () => {
          cancelCookingNotifications();
          Speech.stop();
          onDone();
        },
      },
    ]);

  if (finished) {
    return (
      <View style={styles.finishedScreen}>
        <View style={styles.finishedMark}><BrandMark size={94} /></View>
        <Text style={styles.finishedTitle}>Steak Ready</Text>
        <Text style={styles.finishedText}>The rest is complete. Slice against the grain and serve.</Text>
        <View style={styles.doneButton}>
          <PrimaryButton label="Done" onPress={onDone} />
        </View>
      </View>
    );
  }

  const current = plan.steps[index];
  const next = plan.steps[index + 1];
  const insertedRoundIsNext = queuedFlipRounds > 0;
  const nextTitle = insertedRoundIsNext ? 'Extra Flip Round' : next?.title ?? 'Slice and serve';
  const nextInstruction = insertedRoundIsNext
    ? `${extraRoundInstruction(current)} The original ${next?.title ?? 'finish'} step follows afterward.`
    : next?.instruction ?? 'The resting stage will be complete.';
  const progress = plan.steps.length ? (index + 1) / plan.steps.length : 0;
  const skipLabel = current.phase === 'rest'
    ? 'Finish Rest'
    : current.phase === 'baste' || current.skipTarget === 'rest'
      ? '✓ Target Reached → Rest'
      : current.skipTarget === 'baste'
        ? 'Skip → Start Basting'
        : current.skipTarget === 'sear'
          ? 'Skip → Start Final Sear'
          : 'Skip Step →';

  if (awaitingDecision) {
    const basting = current.phase === 'baste';
    return (
      <ScrollView contentContainerStyle={styles.decisionContent} style={styles.screen}>
        <View style={styles.headerRow}>
          <BrandMark size={27} />
          <Text numberOfLines={1} style={styles.planName}>{plan.name}</Text>
          <Pressable accessibilityRole="button" onPress={toggleMute} style={styles.muteButton}>
            <Text style={styles.muteText}>{muted ? '🔇 Muted' : '🔊 Voice'}</Text>
          </Pressable>
        </View>
        <View style={styles.decisionVisual}>
          <CookGuideVisual kind="thermometer" height={118} />
        </View>
        <Text style={styles.decisionTitle}>Check Your Steak</Text>
        <Text style={styles.decisionText}>
          Lift it from the heat. Insert from the side just beyond center, then withdraw slowly to find the lowest stable reading. Check separate muscles on a ribeye.
        </Text>
        {current.temperatureReference ? (
          <Text style={styles.decisionTemperature}>Pull reference: {current.temperatureReference}</Text>
        ) : null}
        {extraRounds > 0 ? <Text style={styles.extraRounds}>Extra rounds completed: {extraRounds}</Text> : null}
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Do not blindly chase one low reading</Text>
          <Text style={styles.warningBody}>
            Carryover cooking continues during rest. Avoid fat, bone, and gristle. If the crust is turning black, the butter is dark or smoking, or readings conflict, remove the steak from heat and recheck before adding time.
          </Text>
        </View>
        {undoSnapshot ? (
          <Pressable accessibilityRole="button" onPress={undoLastAction} style={styles.recoveryButton}>
            <Text style={styles.recoveryIcon}>↶</Text>
            <View style={styles.recoveryTextBlock}>
              <Text style={styles.recoveryTitle}>UNDO LAST ACTION</Text>
              <Text style={styles.recoveryBody}>{undoSnapshot.actionLabel}</Text>
            </View>
            <Text style={styles.recoveryAction}>UNDO</Text>
          </Pressable>
        ) : null}
        <View style={styles.decisionButtons}>
          <PrimaryButton label="✓ Rest Steak Now" onPress={startRest} />
          <PrimaryButton label={basting ? 'Flip & Baste +45 sec' : 'Turn & Cook +45 sec'} onPress={addFortyFive} secondary />
        </View>
        <Pressable onPress={confirmEnd} style={styles.endButton}>
          <Text style={styles.endText}>End cooking session</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.headerRow}>
        <BrandMark size={27} />
        <Text numberOfLines={1} style={styles.planName}>{plan.name}</Text>
        <Pressable accessibilityRole="button" onPress={toggleMute} style={styles.muteButton}>
          <Text style={styles.muteText}>{muted ? '🔇 Muted' : '🔊 Voice'}</Text>
        </Pressable>
      </View>
      <View style={styles.stageRow}>
        <Text style={styles.stageCount}>Stage {index + 1} of {plan.steps.length}</Text>
        {extraRounds > 0 ? <Text style={styles.extraSmall}>+{extraRounds} extra</Text> : null}
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {queuedFlipRounds > 0 ? (
        <View style={styles.queueSignal}>
          <View>
            <Text style={styles.queueSignalTitle}>EXTRA FLIP QUEUED</Text>
            <Text style={styles.queueSignalBody}>Current timer finishes first · then flip for 45 sec</Text>
          </View>
          <Text style={styles.queueCount}>×{queuedFlipRounds}</Text>
        </View>
      ) : null}

      {current.temperatureCue ? (
        <View style={styles.checkSignal}>
          <View style={styles.checkDiagram}>
            <CookGuideVisual kind="thermometer" height={74} />
          </View>
          <Text style={styles.checkSignalTitle}>🌡 TEMPERATURE CHECKPOINT THIS ROUND</Text>
          <Text style={styles.checkSignalValue}>{cueLabel(current)}</Text>
          <Text style={styles.checkSignalHelp}>Lift from heat · insert from the side · pass center · withdraw slowly</Text>
        </View>
      ) : null}

      <Text style={styles.eyebrow}>{manualRound ? 'EXTRA FLIP ROUND' : current.title.toUpperCase()}</Text>
      <Text style={styles.instruction}>
        {manualRound ? extraRoundInstruction(current) : current.instruction}
      </Text>

      {current.phase === 'baste' || current.id.includes('butter') ? (
        <View style={styles.heatWarning}>
          <Text style={styles.heatWarningTitle}>BUTTER & CRUST OVERRIDE</Text>
          <Text style={styles.heatWarningBody}>Foaming golden butter is right. If it turns dark, smokes, or the crust is blackening, lower the heat or rest the steak now—do not wait for the timer.</Text>
        </View>
      ) : null}

      <View style={styles.panels}>
        <View style={styles.timerPanel}>
          <Text style={styles.panelLabel}>⏱ TIME LEFT</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.timer}>{clock(remaining)}</Text>
          {paused ? <Text style={styles.paused}>PAUSED</Text> : null}
        </View>

        <View style={styles.nextPanel}>
          <Text style={styles.nextLabel}>WHEN TIMER ENDS →</Text>
          <Text style={styles.nextTitle}>{nextTitle}</Text>
          <Text numberOfLines={5} style={styles.nextInstruction}>
            {nextInstruction}
          </Text>
        </View>
      </View>

      {current.temperatureReference && !current.temperatureCue ? (
        <View style={styles.temperaturePill}>
          <Text style={styles.temperature}>🌡 Temperature reference: {current.temperatureReference}</Text>
        </View>
      ) : null}

      {undoSnapshot ? (
        <Pressable accessibilityRole="button" onPress={undoLastAction} style={styles.recoveryButton}>
          <Text style={styles.recoveryIcon}>↶</Text>
          <View style={styles.recoveryTextBlock}>
            <Text style={styles.recoveryTitle}>
              {undoSnapshot.groupCount > 1 ? `UNDO ${undoSnapshot.groupCount} ADDITIONS` : 'UNDO LAST ACTION'}
            </Text>
            <Text style={styles.recoveryBody}>
              {undoSnapshot.groupCount > 1
                ? `Restore the timer and queue to before these ${undoSnapshot.groupCount} × 45-second additions`
                : undoSnapshot.actionLabel}
            </Text>
          </View>
          <Text style={styles.recoveryAction}>{undoSnapshot.groupCount > 1 ? 'UNDO ALL' : 'UNDO'}</Text>
        </Pressable>
      ) : null}

      {queuedFlipRounds > 0 ? (
        <Pressable accessibilityRole="button" onPress={removeQueuedFlip} style={styles.removeQueueButton}>
          <Text style={styles.recoveryIcon}>−</Text>
          <View style={styles.recoveryTextBlock}>
            <Text style={styles.removeQueueTitle}>REMOVE QUEUED +45</Text>
            <Text style={styles.recoveryBody}>
              Remove the most recently added round · {queuedFlipRounds} queued
            </Text>
          </View>
          <Text style={styles.removeQueueAction}>REMOVE</Text>
        </Pressable>
      ) : manualRound ? (
        <Pressable accessibilityRole="button" onPress={endExtraRound} style={styles.recoveryButton}>
          <Text style={styles.recoveryIcon}>→</Text>
          <View style={styles.recoveryTextBlock}>
            <Text style={styles.recoveryTitle}>END EXTRA ROUND</Text>
            <Text style={styles.recoveryBody}>Continue with the original scheduled step</Text>
          </View>
          <Text style={styles.recoveryAction}>CONTINUE</Text>
        </Pressable>
      ) : null}

      <View style={styles.controls}>
        <View style={styles.controlHalf}>
          <PrimaryButton label={paused ? '▶ Resume' : 'Ⅱ Pause'} onPress={togglePause} />
        </View>
        <View style={styles.controlHalf}>
          <PrimaryButton
            label={
              current.phase === 'sear' || current.phase === 'flip' || current.phase === 'baste' || current.phase === 'indirect'
                ? `Queue Flip +45${queuedFlipRounds > 0 ? ` (×${queuedFlipRounds})` : ''}`
                : current.phase === 'rest'
                  ? '+45 sec Rest'
                  : '+45 sec'
            }
            onPress={addFortyFive}
            secondary
          />
        </View>
      </View>
      <View style={styles.skipButton}>
        <PrimaryButton label={skipLabel} onPress={skip} secondary={current.phase !== 'baste' && current.skipTarget !== 'rest'} />
      </View>
      <Pressable onPress={confirmEnd} style={styles.endButton}>
        <Text style={styles.endText}>End cooking session</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 18, paddingBottom: 38 },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  planName: { color: colors.text, flex: 1, fontSize: 14, fontWeight: '800', marginHorizontal: 9 },
  muteButton: { backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  muteText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  recoveryButton: { alignItems: 'center', backgroundColor: colors.orangeSoft, borderColor: colors.orange, borderRadius: 17, borderWidth: 1, flexDirection: 'row', marginTop: 18, minHeight: 62, paddingHorizontal: 14, paddingVertical: 10 },
  removeQueueButton: { alignItems: 'center', backgroundColor: '#30270D', borderColor: colors.yellow, borderRadius: 17, borderWidth: 1, flexDirection: 'row', marginTop: 18, minHeight: 62, paddingHorizontal: 14, paddingVertical: 10 },
  recoveryIcon: { color: colors.text, fontSize: 25, fontWeight: '900', marginRight: 12 },
  recoveryTextBlock: { flex: 1 },
  recoveryTitle: { color: colors.orange, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  removeQueueTitle: { color: colors.yellow, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  recoveryBody: { color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 3 },
  recoveryAction: { color: colors.orange, fontSize: 11, fontWeight: '900', marginLeft: 10 },
  removeQueueAction: { color: colors.yellow, fontSize: 11, fontWeight: '900', marginLeft: 10 },
  stageRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  stageCount: { color: colors.muted, fontSize: 12, fontVariant: ['tabular-nums'] },
  extraSmall: { color: colors.yellow, fontSize: 12, fontWeight: '800' },
  progressTrack: { backgroundColor: colors.surfaceRaised, borderRadius: 999, height: 5, marginTop: 8, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.orange, borderRadius: 999, height: 5 },
  queueSignal: { alignItems: 'center', backgroundColor: '#261B12', borderColor: colors.orange, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 15, paddingVertical: 12 },
  queueSignalTitle: { color: colors.orange, fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  queueSignalBody: { color: colors.text, fontSize: 12, marginTop: 3 },
  queueCount: { color: colors.yellow, fontSize: 20, fontWeight: '900', marginLeft: 12 },
  checkSignal: { alignItems: 'center', backgroundColor: '#30270D', borderColor: colors.yellow, borderRadius: 16, borderWidth: 1, marginTop: 20, padding: 13 },
  checkDiagram: { backgroundColor: colors.surfaceRaised, borderRadius: 12, marginBottom: 10, overflow: 'hidden', width: '100%' },
  checkSignalTitle: { color: colors.yellow, fontSize: 13, fontWeight: '900', letterSpacing: 0.7 },
  checkSignalValue: { color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 4 },
  checkSignalHelp: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5, textAlign: 'center' },
  eyebrow: { color: colors.orange, fontSize: 13, fontWeight: '900', letterSpacing: 1.3, marginTop: 26, textAlign: 'center' },
  instruction: { color: colors.text, fontSize: 20, fontWeight: '700', lineHeight: 28, marginHorizontal: 8, marginTop: 10, textAlign: 'center' },
  heatWarning: { backgroundColor: '#2B1710', borderColor: colors.orange, borderRadius: 14, borderWidth: 1, marginTop: 16, padding: 12 },
  heatWarningTitle: { color: colors.orange, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heatWarningBody: { color: colors.text, fontSize: 12, lineHeight: 17, marginTop: 4 },
  panels: { flexDirection: 'row', gap: 10, marginTop: 24, minHeight: 210 },
  timerPanel: { backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderRadius: 22, borderWidth: 1, flex: 1, justifyContent: 'space-between', padding: 15 },
  nextPanel: { backgroundColor: colors.orangeSoft, borderColor: '#693415', borderRadius: 22, borderWidth: 1, flex: 1, padding: 15 },
  panelLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  timer: { color: colors.text, fontSize: 46, fontWeight: '900', letterSpacing: -2, textAlign: 'center', fontVariant: ['tabular-nums'] },
  paused: { color: colors.yellow, fontSize: 11, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  nextLabel: { color: colors.orange, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  nextTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 24 },
  nextInstruction: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 8 },
  temperaturePill: { alignSelf: 'center', backgroundColor: '#30270D', borderRadius: 999, marginTop: 20, paddingHorizontal: 14, paddingVertical: 10 },
  temperature: { color: colors.yellow, fontSize: 13, fontWeight: '800' },
  controls: { flexDirection: 'row', gap: 10, marginTop: 'auto', paddingTop: 14 },
  controlHalf: { flex: 1 },
  skipButton: { marginTop: 10 },
  endButton: { alignItems: 'center', padding: 16 },
  endText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  decisionContent: { flexGrow: 1, padding: 20, paddingBottom: 38 },
  decisionVisual: { alignSelf: 'center', backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderRadius: 20, borderWidth: 1, marginTop: 34, overflow: 'hidden', width: '92%' },
  decisionTitle: { color: colors.text, fontSize: 34, fontWeight: '900', marginTop: 10, textAlign: 'center' },
  decisionText: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 10, textAlign: 'center' },
  decisionTemperature: { color: colors.yellow, fontSize: 20, fontWeight: '900', marginTop: 18, textAlign: 'center' },
  extraRounds: { color: colors.orange, fontSize: 13, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  warningCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, marginTop: 24, padding: 15 },
  warningTitle: { color: colors.yellow, fontSize: 14, fontWeight: '900' },
  warningBody: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: 5 },
  decisionButtons: { gap: 10, marginTop: 'auto', paddingTop: 28 },
  finishedScreen: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center', padding: 30 },
  finishedMark: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.orange, borderRadius: 58, borderWidth: 1, height: 116, justifyContent: 'center', width: 116 },
  finishedTitle: { color: colors.text, fontSize: 36, fontWeight: '900', marginTop: 8 },
  finishedText: { color: colors.muted, fontSize: 17, lineHeight: 24, marginTop: 10, textAlign: 'center' },
  doneButton: { marginTop: 28, minWidth: 180 },
});
