import appCss from "../app.css?inline";
import siteCss from "./site.css?inline";
import premiumShellCss from "./premium-shell.css?inline";
import visualOverhaulCss from "./visual-overhaul.css?inline";
import experienceLayerCss from "./experience-layer.css?inline";
import stabilityFixesCss from "./stability-fixes.css?inline";
import matrixRebirthCss from "./matrix-rebirth.css?inline";
import customerStabilityCss from "./customer-stability.css?inline";
import brandNexusCss from "./brand-nexus.css?inline";
import mobileArtPassCss from "./v3-mobile-art-pass.css?inline";
import dockCss from "./dock-v2.css?inline";
import homeCss from "./home-v3.css?inline";
import glassCss from "./glass-system.css?inline";
import reactorCss from "./reactor-fx.css?inline";
import worldStageCss from "./world-stage-v2.css?inline";
import worldVisualCss from "./v3-4-world-visual.css?inline";
import storeCss from "./store-v3.css?inline";
import liveFeedCss from "./live-feed-v3.css?inline";
import servicesCss from "./services-v3.css?inline";
import homeServicesCss from "./home-v3-services.css?inline";
import servicesVisualCss from "./v3-4-services-visual.css?inline";
import transitionCss from "./cinematic-world-transition.css?inline";
import motionRevealCss from "./motion-reveal-v3.css?inline";
import premiumParallaxCss from "./premium-parallax.css?inline";
import siteMusicCss from "./site-music.css?inline";
import mobileStabilityCss from "./mobile-scroll-stability.css?inline";
import criticalShellCss from "./critical-mobile-shell.css?inline";
import heroPremiumCss from "./hero-premium-v1.css?inline";

/**
 * Atomic mobile presentation bundle.
 *
 * Vite embeds all of these CSS strings into the JS chunk. Compact/coarse
 * pointer devices install the result before React mounts, so JSX and its
 * presentation can no longer come from different deployments.
 */
export const atomicMobileStyles = [
  appCss,
  siteCss,
  premiumShellCss,
  visualOverhaulCss,
  experienceLayerCss,
  stabilityFixesCss,
  matrixRebirthCss,
  customerStabilityCss,
  brandNexusCss,
  mobileArtPassCss,
  dockCss,
  homeCss,
  glassCss,
  reactorCss,
  worldStageCss,
  worldVisualCss,
  storeCss,
  liveFeedCss,
  servicesCss,
  homeServicesCss,
  servicesVisualCss,
  transitionCss,
  motionRevealCss,
  premiumParallaxCss,
  siteMusicCss,
  mobileStabilityCss,
  criticalShellCss,
  heroPremiumCss,
].join("\n");
