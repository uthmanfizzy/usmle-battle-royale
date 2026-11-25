import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './theme';
import { GameSettingsProvider } from './contexts/GameSettingsContext';
import ScreenComfortOverlay from './screenComfort';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import DevModeBanner from './components/DevModeBanner';
import { startPresenceHeartbeat } from './studyPresence';
import './styles/designTokens.css';
import './App.css';
import './themes.css';
import './study.css';
import './styles/celestialTheme.css';
import './styles/moonlitTheme.css';

const AdminApp          = lazy(() => import('./components/AdminApp'));
const AuthCallback      = lazy(() => import('./components/AuthCallback'));
const DashboardPage     = lazy(() => import('./components/DashboardPage'));
const StatsPage         = lazy(() => import('./components/StatsPage'));
const ProgressPage      = lazy(() => import('./components/ProgressPage'));
const ActivityPage      = lazy(() => import('./components/ActivityPage'));
const GuidePage         = lazy(() => import('./components/GuidePage'));
const SettingsPage      = lazy(() => import('./components/SettingsPage'));
const QuestsPage        = lazy(() => import('./components/QuestsPage'));
const ShopPage          = lazy(() => import('./components/ShopPage'));
const UWorldAdventure   = lazy(() => import('./components/UWorldAdventure'));
// Not lazy: a tiny config object, and the /saudi-mle route needs it at render.
import { questionBankMode } from './questionBankModes';
const HYFlashcards      = lazy(() => import('./components/HYFlashcards'));
const AmbossQuest       = lazy(() => import('./components/AmbossQuest'));
const Amboss200         = lazy(() => import('./components/Amboss200'));
const AmbossEthics      = lazy(() => import('./components/AmbossEthics'));
const AmbossQbank       = lazy(() => import('./components/AmbossQbank'));
import StudyTracked from './StudyTracked';
const KaplanHub         = lazy(() => import('./components/KaplanHub'));
const KaplanEthics      = lazy(() => import('./components/KaplanEthics'));
const ReelsPage         = lazy(() => import('./components/ReelsPage'));
const PathwayNavigator  = lazy(() => import('./components/PathwayNavigator'));
const ECGReader         = lazy(() => import('./components/ECGReader'));
const ABGReader         = lazy(() => import('./components/ABGReader'));
const MuscleMapper      = lazy(() => import('./components/MuscleMapper'));
const BiostatsLab       = lazy(() => import('./components/BiostatsLab'));
const SpotTheDiagnosis  = lazy(() => import('./components/SpotTheDiagnosis'));
const GeneticsRoulette  = lazy(() => import('./components/GeneticsRoulette'));
const DrugMatch         = lazy(() => import('./components/DrugMatch'));
const Murmurs           = lazy(() => import('./components/Murmurs'));
const PVLoops           = lazy(() => import('./components/PVLoops'));
const ClotCascade       = lazy(() => import('./components/ClotCascade'));
const VitaminVault      = lazy(() => import('./components/VitaminVault'));
const OncoAtlas         = lazy(() => import('./components/OncoAtlas'));
const LabRange          = lazy(() => import('./components/LabRange'));
const MinigamesPage     = lazy(() => import('./components/MinigamesPage'));
const FAImages          = lazy(() => import('./components/FAImages'));
const FAHYQs            = lazy(() => import('./components/FAHYQs'));
const FATrivia          = lazy(() => import('./components/FATrivia'));
const MehlmanHub        = lazy(() => import('./components/MehlmanHub'));
const HYArrows          = lazy(() => import('./components/HYArrows'));
const UsernameSetupPage = lazy(() => import('./components/UsernameSetupPage'));

function PageSpinner() {
  return (
    <div className="screen entry-screen">
      <div className="spinner" style={{ width: 52, height: 52 }} />
    </div>
  );
}

// Global Error Boundary
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('🔴 GLOBAL ERROR BOUNDARY:', {
      error: error,
      errorInfo: info,
      stack: error?.stack,
      componentStack: info?.componentStack
    });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0f08',
          color: 'white',
          padding: '20px'
        }}>
          <h1 style={{color:'#dcbe50', marginBottom: '20px'}}>App Error</h1>
          <pre style={{
            color: '#dc6464',
            fontSize: '14px',
            maxWidth: '800px',
            whiteSpace: 'pre-wrap',
            background: 'rgba(0,0,0,0.3)',
            padding: '20px',
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '400px'
          }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#dcbe50',
              border: 'none',
              borderRadius: '8px',
              color: '#0a0f08',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Online presence for friends: runs while any page of the app is open. The
// heartbeat itself skips when nobody is signed in.
function PresenceHeartbeat() {
  React.useEffect(() => startPresenceHeartbeat(), []);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <GameSettingsProvider>
        <ThemeProvider>
          <BrowserRouter>
            <DevModeBanner />
            <PresenceHeartbeat />
            {/* The night-time dimmer and blue-light filter. One layer over
                everything, so it covers modals and the exam skin's own fixed
                bars too; renders nothing at all while both are off. */}
            <ScreenComfortOverlay />
            <Suspense fallback={<PageSpinner />}>
              <Routes>
                <Route path="/admin/*"        element={<AdminApp />} />
                <Route path="/auth/callback"  element={<AuthCallback />} />
                <Route path="/dashboard"      element={<DashboardPage />} />
                <Route path="/stats"          element={<RouteErrorBoundary name="StatsPage"><StatsPage /></RouteErrorBoundary>} />
                <Route path="/progress/:userId?" element={<RouteErrorBoundary name="ProgressPage"><ProgressPage /></RouteErrorBoundary>} />
                <Route path="/activity/:userId?" element={<RouteErrorBoundary name="ActivityPage"><ActivityPage /></RouteErrorBoundary>} />
                <Route path="/guide"          element={<RouteErrorBoundary name="GuidePage"><GuidePage /></RouteErrorBoundary>} />
                <Route path="/settings"       element={<RouteErrorBoundary name="SettingsPage"><SettingsPage /></RouteErrorBoundary>} />
                <Route path="/quests"         element={<RouteErrorBoundary name="QuestsPage"><QuestsPage /></RouteErrorBoundary>} />
                <Route path="/shop"           element={<RouteErrorBoundary name="ShopPage"><ShopPage /></RouteErrorBoundary>} />
                <Route path="/uworld-adventure" element={<RouteErrorBoundary name="UWorldAdventure"><UWorldAdventure /></RouteErrorBoundary>} />
                {/* Same component, different bank: the mode carries the tag it
                    filters on, the pace it plans and the colours it wears. */}
                <Route path="/saudi-mle" element={<RouteErrorBoundary name="SaudiMLE"><UWorldAdventure mode={questionBankMode('saudi_mle')} /></RouteErrorBoundary>} />
                <Route path="/ore-lds" element={<RouteErrorBoundary name="OreLds"><UWorldAdventure mode={questionBankMode('ore_lds')} /></RouteErrorBoundary>} />
                {/* Mehlman: a hub of two drills — the Rapid Fire bank and HY Arrows. */}
                <Route path="/mehlman" element={<RouteErrorBoundary name="MehlmanHub"><MehlmanHub /></RouteErrorBoundary>} />
                <Route path="/hy-arrows" element={<RouteErrorBoundary name="HYArrows"><HYArrows /></RouteErrorBoundary>} />
                <Route path="/mehlman-rapid-fire" element={<RouteErrorBoundary name="MehlmanRapidFire"><UWorldAdventure mode={questionBankMode('mehlman_rapid_fire')} /></RouteErrorBoundary>} />
                <Route path="/clinical" element={<RouteErrorBoundary name="Clinical"><UWorldAdventure mode={questionBankMode('clinical')} /></RouteErrorBoundary>} />
                <Route path="/oet" element={<RouteErrorBoundary name="OET"><UWorldAdventure mode={questionBankMode('oet')} /></RouteErrorBoundary>} />
                {/* Amboss Quest: a hub of sub-modes. 200 Concepts is a normal bank. */}
                <Route path="/amboss-quest" element={<RouteErrorBoundary name="AmbossQuest"><AmbossQuest /></RouteErrorBoundary>} />
                <Route path="/amboss-200-concepts" element={<RouteErrorBoundary name="Amboss200Concepts"><Amboss200 /></RouteErrorBoundary>} />
                <Route path="/amboss-ethics" element={<RouteErrorBoundary name="AmbossEthics"><AmbossEthics /></RouteErrorBoundary>} />
                <Route path="/amboss-qbank" element={<RouteErrorBoundary name="AmbossQbank"><AmbossQbank /></RouteErrorBoundary>} />
                <Route path="/kaplan" element={<RouteErrorBoundary name="KaplanHub"><KaplanHub /></RouteErrorBoundary>} />
                <Route path="/kaplan-ethics" element={<RouteErrorBoundary name="KaplanEthics"><KaplanEthics /></RouteErrorBoundary>} />
                <Route path="/hy-flashcards" element={<RouteErrorBoundary name="HYFlashcards"><HYFlashcards /></RouteErrorBoundary>} />
                <Route path="/reels"          element={<RouteErrorBoundary name="ReelsPage"><ReelsPage /></RouteErrorBoundary>} />
                <Route path="/fa-hy-qs" element={<RouteErrorBoundary name="FAHYQs"><FAHYQs /></RouteErrorBoundary>} />
                <Route path="/fa-trivia" element={<RouteErrorBoundary name="FATrivia"><FATrivia /></RouteErrorBoundary>} />
                <Route path="/fa-images" element={<RouteErrorBoundary name="FAImages"><FAImages /></RouteErrorBoundary>} />
                <Route path="/minigames" element={<RouteErrorBoundary name="MinigamesPage"><MinigamesPage /></RouteErrorBoundary>} />
                {/* Leaving the navigator now goes back to the shelf it was
                    launched from, not to the Journey it used to live in. */}
                <Route path="/pathway-navigator" element={<RouteErrorBoundary name="PathwayNavigator"><StudyTracked mode="pathway_navigator"><PathwayNavigator onExit={() => { window.location.href = '/minigames'; }} /></StudyTracked></RouteErrorBoundary>} />
                <Route path="/ecg-reader" element={<RouteErrorBoundary name="ECGReader"><StudyTracked mode="ecg_reader"><ECGReader onExit={() => { window.location.href = '/minigames'; }} /></StudyTracked></RouteErrorBoundary>} />
                <Route path="/abg-reader" element={<RouteErrorBoundary name="ABGReader"><StudyTracked mode="abg_reader"><ABGReader onExit={() => { window.location.href = '/minigames'; }} /></StudyTracked></RouteErrorBoundary>} />
                <Route path="/muscle-mapper" element={<RouteErrorBoundary name="MuscleMapper"><StudyTracked mode="muscle_mapper"><MuscleMapper onExit={() => { window.location.href = '/minigames'; }} /></StudyTracked></RouteErrorBoundary>} />
                <Route path="/biostats-lab" element={<RouteErrorBoundary name="BiostatsLab"><StudyTracked mode="biostats_lab"><BiostatsLab onExit={() => { window.location.href = '/minigames'; }} /></StudyTracked></RouteErrorBoundary>} />
                <Route path="/spot-the-diagnosis" element={<RouteErrorBoundary name="SpotTheDiagnosis"><StudyTracked mode="spot_the_diagnosis"><SpotTheDiagnosis onExit={() => { window.location.href = '/minigames'; }} /></StudyTracked></RouteErrorBoundary>} />
                <Route path="/genetics-roulette" element={<RouteErrorBoundary name="GeneticsRoulette"><StudyTracked mode="genetics_roulette"><GeneticsRoulette onExit={() => { window.location.href = '/minigames'; }} /></StudyTracked></RouteErrorBoundary>} />
                <Route path="/drug-match" element={<RouteErrorBoundary name="DrugMatch"><StudyTracked mode="drug_match"><DrugMatch onExit={() => { window.location.href = '/minigames'; }} /></StudyTracked></RouteErrorBoundary>} />
                <Route path="/lab-values" element={<RouteErrorBoundary name="LabRange"><StudyTracked mode="lab_range"><LabRange onExit={() => { window.location.href = '/minigames'; }} /></StudyTracked></RouteErrorBoundary>} />
                <Route path="/murmurs"element={<RouteErrorBoundary name="Murmurs"><StudyTracked mode="murmurs"><Murmurs onExit={() => { window.location.href = '/minigames'; }} /></StudyTracked></RouteErrorBoundary>} />
                <Route path="/pv-loops" element={<RouteErrorBoundary name="PVLoops"><StudyTracked mode="pv_loops"><PVLoops onExit={() => { window.location.href = '/minigames'; }} /></StudyTracked></RouteErrorBoundary>} />
                <Route path="/clot-cascade" element={<RouteErrorBoundary name="ClotCascade"><StudyTracked mode="clot_cascade"><ClotCascade onExit={() => { window.location.href = '/minigames'; }} /></StudyTracked></RouteErrorBoundary>} />
                <Route path="/vitamin-vault" element={<RouteErrorBoundary name="VitaminVault"><StudyTracked mode="vitamin_vault"><VitaminVault onExit={() => { window.location.href = '/minigames'; }} /></StudyTracked></RouteErrorBoundary>} />
                <Route path="/onco-atlas" element={<RouteErrorBoundary name="OncoAtlas"><StudyTracked mode="onco_atlas"><OncoAtlas onExit={() => { window.location.href = '/minigames'; }} /></StudyTracked></RouteErrorBoundary>} />
                <Route path="/username-setup" element={<UsernameSetupPage />} />
                <Route path="/*"              element={<App />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ThemeProvider>
      </GameSettingsProvider>
    </GlobalErrorBoundary>
  </React.StrictMode>
);
