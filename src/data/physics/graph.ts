import { physicsTopics } from "./topics";
import type { LearningGraph } from "../../types";

export const physicsGraph: LearningGraph = {
  topics: physicsTopics,
  edges: [
    // Class 6 internal
    { from: "phy_c6_01_motion_and_measurement_of_distances", to: "phy_c6_02_light_shadows_and_reflections", type: "soft", minMastery: 0.55 },
    { from: "phy_c6_03_electricity_and_circuits", to: "phy_c6_04_fun_with_magnets", type: "soft", minMastery: 0.52 },
    { from: "phy_c6_05_water", to: "phy_c6_06_air_around_us", type: "soft", minMastery: 0.5 },

    // Class 7 internal
    { from: "phy_c7_01_heat", to: "phy_c7_02_weather_climate_and_adaptations", type: "soft", minMastery: 0.56 },
    { from: "phy_c7_02_weather_climate_and_adaptations", to: "phy_c7_03_wind_storm_and_cyclone", type: "hard", minMastery: 0.62 },

    // Class 8 internal
    { from: "phy_c8_01_force_and_pressure", to: "phy_c8_02_friction", type: "hard", minMastery: 0.66 },
    { from: "phy_c8_01_force_and_pressure", to: "phy_c8_05_some_natural_phenomena", type: "soft", minMastery: 0.56 },
    { from: "phy_c8_06_light", to: "phy_c8_07_stars_and_the_solar_system", type: "soft", minMastery: 0.58 },

    // Cross-grade 6 -> 7
    { from: "phy_c6_01_motion_and_measurement_of_distances", to: "phy_c7_04_motion_and_time", type: "hard", minMastery: 0.66 },
    { from: "phy_c6_02_light_shadows_and_reflections", to: "phy_c7_06_light", type: "hard", minMastery: 0.64 },
    { from: "phy_c6_03_electricity_and_circuits", to: "phy_c7_05_electric_current_and_its_effects", type: "hard", minMastery: 0.66 },
    { from: "phy_c6_06_air_around_us", to: "phy_c7_03_wind_storm_and_cyclone", type: "soft", minMastery: 0.55 },

    // Cross-grade 7 -> 8
    { from: "phy_c7_04_motion_and_time", to: "phy_c8_01_force_and_pressure", type: "hard", minMastery: 0.68 },
    { from: "phy_c7_05_electric_current_and_its_effects", to: "phy_c8_04_chemical_effects_of_electric_current", type: "hard", minMastery: 0.66 },
    { from: "phy_c7_06_light", to: "phy_c8_06_light", type: "hard", minMastery: 0.68 },
    { from: "phy_c7_04_motion_and_time", to: "phy_c8_03_sound", type: "soft", minMastery: 0.56 },
  ],
};
