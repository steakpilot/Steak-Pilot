import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { BrandMark } from './src/components/BrandMark';
import { makeCookingPlan } from './src/engine';
import { makeManualCookingPlan } from './src/manualPlan';
import { cancelCookingNotifications } from './src/notifications';
import { CookScreen } from './src/screens/CookScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ManualTimerScreen } from './src/screens/ManualTimerScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import { colors } from './src/theme';
import {
  AROMATICS,
  ActiveCookSession,
  COOKING_METHODS,
  COOKTOPS,
  CUTS,
  CookingPlan,
  DEFAULT_MANUAL_TIMER,
  DEFAULT_SETTINGS,
  DONENESS,
  ManualTimerSettings,
  PANS,
  SteakSettings,
  UNIT_SYSTEMS,
} from './src/types';

type Screen = 'home' | 'setup' | 'plan' | 'manual' | 'cook';
const SETTINGS_KEY = 'steakpilot.settings.v2';
const MANUAL_TIMER_KEY = 'steakpilot.manual-timer.v1';
const ACTIVE_COOK_KEY = 'steakpilot.active-cook.v1';
const LAUNCH_STARTED_AT = Date.now();
const MINIMUM_BRAND_SCREEN_MS = 550;

SplashScreen.setOptions({ duration: 500, fade: true });

function savedChoice<T extends string>(value: unknown, choices: { id: T }[], fallback: T) {
  return choices.some((choice) => choice.id === value) ? (value as T) : fallback;
}

function sanitizeSteakSettings(value: unknown): SteakSettings {
  const saved = value && typeof value === 'object' ? (value as Partial<SteakSettings>) : {};
  return {
    cut: savedChoice(saved.cut, CUTS, DEFAULT_SETTINGS.cut),
    thickness: Number.isFinite(saved.thickness)
      ? Math.max(0.5, Math.min(3, saved.thickness!))
      : DEFAULT_SETTINGS.thickness,
    weightOunces: Number.isFinite(saved.weightOunces)
      ? Math.max(3, Math.min(64, saved.weightOunces!))
      : DEFAULT_SETTINGS.weightOunces,
    doneness: savedChoice(saved.doneness, DONENESS, DEFAULT_SETTINGS.doneness),
    aromatic: savedChoice(saved.aromatic, AROMATICS, DEFAULT_SETTINGS.aromatic),
    cookingMethod: savedChoice(saved.cookingMethod, COOKING_METHODS, DEFAULT_SETTINGS.cookingMethod),
    pan: savedChoice(saved.pan, PANS, DEFAULT_SETTINGS.pan),
    cooktop: savedChoice(saved.cooktop, COOKTOPS, DEFAULT_SETTINGS.cooktop),
    unitSystem: savedChoice(saved.unitSystem, UNIT_SYSTEMS, DEFAULT_SETTINGS.unitSystem),
  };
}

function validActiveCook(value: unknown): value is ActiveCookSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<ActiveCookSession>;
  const steps = session.plan?.steps;
  return Boolean(
    session.plan &&
      Array.isArray(steps) &&
      steps.length > 0 &&
      steps.length <= 100 &&
      Number.isInteger(session.index) &&
      session.index! >= 0 &&
      session.index! < steps.length &&
      Number.isFinite(session.endTime) &&
      Number.isFinite(session.remaining) &&
      typeof session.paused === 'boolean' &&
      typeof session.awaitingDecision === 'boolean' &&
      Number.isFinite(session.extraRounds) &&
      session.extraRounds! >= 0 &&
      typeof session.manualRound === 'boolean' &&
      Number.isFinite(session.queuedFlipRounds) &&
      session.queuedFlipRounds! >= 0 &&
      session.queuedFlipRounds! <= 10 &&
      typeof session.muted === 'boolean' &&
      Number.isFinite(session.savedAt) &&
      steps.every(
        (step) =>
          step &&
          typeof step.id === 'string' &&
          typeof step.title === 'string' &&
          Number.isFinite(step.durationSeconds) &&
          step.durationSeconds > 0 &&
          step.durationSeconds <= 7_200,
      ),
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<SteakSettings>(DEFAULT_SETTINGS);
  const [manualSettings, setManualSettings] = useState<ManualTimerSettings>(DEFAULT_MANUAL_TIMER);
  const [plan, setPlan] = useState<CookingPlan>(() => makeCookingPlan(DEFAULT_SETTINGS));
  const [resumeSession, setResumeSession] = useState<ActiveCookSession | null>(null);
  const sessionWriteRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      try {
        const [savedSteak, savedManual, savedActiveCook] = await Promise.all([
          AsyncStorage.getItem(SETTINGS_KEY),
          AsyncStorage.getItem(MANUAL_TIMER_KEY),
          AsyncStorage.getItem(ACTIVE_COOK_KEY),
        ]);
        if (!active) return;
        if (savedSteak) setSettings(sanitizeSteakSettings(JSON.parse(savedSteak)));
        if (savedManual) {
          const parsed = JSON.parse(savedManual) as Partial<ManualTimerSettings>;
          const roundSeconds = Array.isArray(parsed.roundSeconds)
            ? parsed.roundSeconds
                .filter((seconds) => Number.isFinite(seconds))
                .slice(0, 20)
                .map((seconds) => Math.max(5, Math.min(900, Math.round(seconds))))
            : DEFAULT_MANUAL_TIMER.roundSeconds;
          setManualSettings({
            roundSeconds: roundSeconds.length ? roundSeconds : DEFAULT_MANUAL_TIMER.roundSeconds,
            restSeconds: Number.isFinite(parsed.restSeconds)
              ? Math.max(30, Math.min(1_800, Math.round(parsed.restSeconds!)))
              : DEFAULT_MANUAL_TIMER.restSeconds,
          });
        }
        const activeCook = savedActiveCook ? JSON.parse(savedActiveCook) : null;
        const tooOld = validActiveCook(activeCook) && !activeCook.paused && Date.now() - activeCook.savedAt > 12 * 60 * 60 * 1000;
        if (validActiveCook(activeCook) && !tooOld) {
          setPlan(activeCook.plan);
          setResumeSession(activeCook);
          setScreen('cook');
        } else {
          await Promise.all([AsyncStorage.removeItem(ACTIVE_COOK_KEY), cancelCookingNotifications()]);
        }
      } catch {
        await Promise.all([AsyncStorage.removeItem(ACTIVE_COOK_KEY), cancelCookingNotifications()]);
      } finally {
        const brandTimeRemaining = Math.max(0, MINIMUM_BRAND_SCREEN_MS - (Date.now() - LAUNCH_STARTED_AT));
        if (brandTimeRemaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, brandTimeRemaining));
        }
        if (active) setHydrated(true);
      }
    };
    hydrate();
    return () => {
      active = false;
    };
  }, []);

  const updateSettings = (next: SteakSettings) => {
    setSettings(next);
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => undefined);
  };

  const generate = (nextSettings: SteakSettings) => {
    setSettings(nextSettings);
    setPlan(makeCookingPlan(nextSettings));
    setScreen('plan');
  };

  const updateManualSettings = (next: ManualTimerSettings) => {
    setManualSettings(next);
    AsyncStorage.setItem(MANUAL_TIMER_KEY, JSON.stringify(next)).catch(() => undefined);
  };

  const startManual = () => {
    setResumeSession(null);
    setPlan(makeManualCookingPlan(manualSettings));
    setScreen('cook');
  };

  const startGuided = () => {
    setResumeSession(null);
    setScreen('cook');
  };

  const saveActiveCook = (session: ActiveCookSession | null) => {
    sessionWriteRef.current = sessionWriteRef.current
      .then(() =>
        session
          ? AsyncStorage.setItem(ACTIVE_COOK_KEY, JSON.stringify(session))
          : AsyncStorage.removeItem(ACTIVE_COOK_KEY),
      )
      .catch(() => undefined);
  };

  const finishCook = () => {
    setResumeSession(null);
    saveActiveCook(null);
    setScreen('home');
  };

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <View pointerEvents="none" style={styles.loadingGlowTop} />
        <View pointerEvents="none" style={styles.loadingGlowBottom} />
        <View style={styles.loadingContent}>
          <Text style={styles.loadingKicker}>PRECISION STEAK ASSISTANT</Text>
          <View style={styles.loadingMark}>
            <View style={styles.loadingMarkGlow} />
            <BrandMark size={104} />
          </View>
          <View style={styles.loadingWordmark}>
            <Text style={styles.loadingName}>Steak</Text>
            <Text style={styles.loadingNameAccent}>Pilot</Text>
          </View>
          <Text style={styles.loadingTagline}>From first sear to final rest.</Text>
          <View style={styles.loadingRule} />
          <View style={styles.loadingStatus}>
            <ActivityIndicator color={colors.orange} size="small" />
            <Text style={styles.loadingStatusText}>PREPARING YOUR COOK</Text>
          </View>
        </View>
        <Text style={styles.loadingFooter}>HANDS-FREE  •  ADAPTIVE  •  BUILT FOR THE PAN</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {screen === 'home' ? (
        <HomeScreen onGuided={() => setScreen('setup')} onManual={() => setScreen('manual')} />
      ) : null}
      {screen === 'setup' ? (
        <SetupScreen settings={settings} onChange={updateSettings} onGenerate={generate} onBack={() => setScreen('home')} />
      ) : null}
      {screen === 'plan' ? (
        <PlanScreen
          plan={plan}
          onChange={setPlan}
          onBack={() => setScreen('setup')}
          onStart={startGuided}
        />
      ) : null}
      {screen === 'manual' ? (
        <ManualTimerScreen
          settings={manualSettings}
          onChange={updateManualSettings}
          onBack={() => setScreen('home')}
          onStart={startManual}
        />
      ) : null}
      {screen === 'cook' ? (
        <CookScreen
          plan={plan}
          resumeSession={resumeSession}
          onSessionChange={saveActiveCook}
          onDone={finishCook}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  loading: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center', overflow: 'hidden', paddingHorizontal: 24 },
  loadingGlowTop: { backgroundColor: colors.orange, borderRadius: 180, height: 330, opacity: 0.12, position: 'absolute', right: -160, top: -130, width: 330 },
  loadingGlowBottom: { backgroundColor: '#6E2D12', borderRadius: 150, bottom: -150, height: 300, left: -170, opacity: 0.16, position: 'absolute', width: 300 },
  loadingContent: { alignItems: 'center', width: '100%' },
  loadingKicker: { color: colors.orange, fontSize: 10, fontWeight: '900', letterSpacing: 2.2, marginBottom: 22 },
  loadingMark: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#6A351D', borderRadius: 70, borderWidth: 1, height: 140, justifyContent: 'center', marginBottom: 20, overflow: 'hidden', shadowColor: colors.orange, shadowOffset: { height: 10, width: 0 }, shadowOpacity: 0.24, shadowRadius: 24, width: 140 },
  loadingMarkGlow: { backgroundColor: colors.orange, borderRadius: 60, height: 115, opacity: 0.1, position: 'absolute', width: 115 },
  loadingWordmark: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'center' },
  loadingName: { color: colors.text, fontSize: 42, fontWeight: '900', letterSpacing: -1.8 },
  loadingNameAccent: { color: colors.orange, fontSize: 42, fontWeight: '900', letterSpacing: -1.8 },
  loadingTagline: { color: colors.muted, fontSize: 14, marginTop: 7 },
  loadingRule: { backgroundColor: colors.border, height: 1, marginVertical: 25, width: 112 },
  loadingStatus: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  loadingStatusText: { color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 1.35 },
  loadingFooter: { bottom: 34, color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.05, position: 'absolute', textAlign: 'center' },
});
