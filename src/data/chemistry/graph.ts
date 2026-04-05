import { chemistryTopics } from "./topics";
import type { LearningGraph } from "../../types";

export const chemistryGraph: LearningGraph = {
  topics: chemistryTopics,
  edges: [
    // Class 6 internal
    { from: "chem_c6_01_sorting_materials_into_groups", to: "chem_c6_02_separation_of_substances", type: "hard", minMastery: 0.64 },
    { from: "chem_c6_02_separation_of_substances", to: "chem_c6_03_changes_around_us", type: "soft", minMastery: 0.56 },
    { from: "chem_c6_04_water", to: "chem_c6_05_air_around_us", type: "soft", minMastery: 0.5 },

    // Class 7 internal
    { from: "chem_c7_01_acids_bases_and_salts", to: "chem_c7_02_physical_and_chemical_changes", type: "hard", minMastery: 0.66 },
    { from: "chem_c7_03_soil", to: "chem_c7_04_wastewater_story", type: "soft", minMastery: 0.54 },

    // Cross-grade 6 -> 7
    { from: "chem_c6_03_changes_around_us", to: "chem_c7_02_physical_and_chemical_changes", type: "hard", minMastery: 0.66 },
    { from: "chem_c6_02_separation_of_substances", to: "chem_c7_01_acids_bases_and_salts", type: "soft", minMastery: 0.55 },
    { from: "chem_c6_04_water", to: "chem_c7_04_wastewater_story", type: "hard", minMastery: 0.62 },
    { from: "chem_c6_05_air_around_us", to: "chem_c7_03_soil", type: "soft", minMastery: 0.52 },
  ],
};
