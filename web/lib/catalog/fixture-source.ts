/**
 * The TypeScript catalog, still importable as data.
 *
 * `lib/catalog/index.ts` stopped importing these files when the database
 * became the source of truth — its accessors read the API now. The files did
 * not go away, and they still have two jobs:
 *
 *   1. Input to `api/scripts/migrate-catalog.js`, which loads them into
 *      `catalog_products`. `web/scripts/export-catalog.js` reads them through
 *      here rather than through index.ts, whose accessors are async and no
 *      longer hold the data.
 *   2. Fixture for the test suite. 84 real products with real copy catch
 *      shape regressions that a handful of invented fixtures would not.
 *
 * This module is the one place that assembles them, so neither consumer keeps
 * its own hand-maintained list.
 */
import type { Bundle, Product } from './types';
import { glowUpOs } from './products/glow-up-os';
import { auraOs } from './products/aura-os';
import { moneyOs } from './products/money-os';
import { socialOs } from './products/social-os';
import { studyOs } from './products/study-os';
import { careerOs } from './products/career-os';
// The pipeline products: built and packaged (PRODUCT-PIPELINE/BUILD-STATUS.txt)
// but not previously listed. The first four unblock the four bundles that were
// stuck on "coming soon" because these were their missing components.
import { skinOs } from './products/skin-os';
import { sleepOs } from './products/sleep-os';
import { moneyHabitsOs } from './products/money-habits-os';
import { englishConfidenceOs } from './products/english-confidence-os';
import { thirtyDaysOfFocus } from './products/thirty-days-of-focus';
import { homeWorkoutOs } from './products/home-workout-os';
import { gymBeginnerOs } from './products/gym-beginner-os';
import { weddingGlowUpOs } from './products/wedding-glow-up-os';
import { examSprintOs } from './products/exam-sprint-os';
import { creatorOs } from './products/creator-os';
import { presenceOs } from './products/presence-os';
import { allTripwireProducts } from './products/tripwires';
import { allCharacterGuideProducts } from './products/character-guides';
import { allTalkingToYourParentsProducts } from './products/talking-to-your-parents';
import { allTheTenSeriesProducts } from './products/the-ten-series';
import { allScamFilesProducts } from './products/the-scam-files';
import { bundles as bundleList } from './bundles';

/**
 * The six launch products in README catalog order, followed by the three
 * imported guide families (40 character guides + the Codex, 12 parents guides
 * + the full set, 23 Ten Series guides + the full set — 84 total). This order
 * is the order index.ts used to declare, and the storefront's listings depend
 * on it, so it must not be re-sorted here.
 */
export function fixtureCatalog(): { products: Product[]; bundles: Bundle[] } {
  return {
    products: [
      glowUpOs,
      auraOs,
      moneyOs,
      socialOs,
      studyOs,
      careerOs,
      skinOs,
      sleepOs,
      moneyHabitsOs,
      englishConfidenceOs,
      thirtyDaysOfFocus,
      homeWorkoutOs,
      gymBeginnerOs,
      weddingGlowUpOs,
      examSprintOs,
      creatorOs,
      presenceOs,
      ...allTripwireProducts,
      ...allCharacterGuideProducts,
      ...allTalkingToYourParentsProducts,
      ...allTheTenSeriesProducts,
      ...allScamFilesProducts,
    ],
    bundles: bundleList,
  };
}
