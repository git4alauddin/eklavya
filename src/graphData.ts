import { class4MathTopics } from "./data/ncert/class4Math";
import { class5MathTopics } from "./data/ncert/class5Math";
import { class6MathTopics } from "./data/ncert/class6Math";
import { class7MathTopics } from "./data/ncert/class7Math";
import { validateGraph } from "./graphEngine";
import type { LearningGraph } from "./types";

const topics = [
  ...class4MathTopics,
  ...class5MathTopics,
  ...class6MathTopics,
  ...class7MathTopics,
];

export const graphData: LearningGraph = {
  topics,
  edges: [
    // Class 4 internal
    { from: "c4_02_long_and_short", to: "c4_04_tick_tick_tick", type: "hard", minMastery: 0.66 },
    { from: "c4_06_junk_seller", to: "c4_07_jugs_and_mugs", type: "hard", minMastery: 0.66 },
    { from: "c4_08_carts_and_wheels", to: "c4_11_tables_and_shares", type: "hard", minMastery: 0.7 },
    { from: "c4_09_halves_and_quarters", to: "c4_11_tables_and_shares", type: "soft", minMastery: 0.62 },
    { from: "c4_10_play_with_patterns", to: "c4_14_smart_charts", type: "soft", minMastery: 0.6 },
    { from: "c4_13_fields_and_fences", to: "c4_14_smart_charts", type: "soft", minMastery: 0.58 },

    // Class 5 internal
    { from: "c5_02_shapes_and_angles", to: "c5_03_how_many_squares", type: "hard", minMastery: 0.68 },
    { from: "c5_03_how_many_squares", to: "c5_11_area_and_boundary", type: "hard", minMastery: 0.7 },
    { from: "c5_04_parts_and_wholes", to: "c5_10_tenths_hundredths", type: "hard", minMastery: 0.7 },
    { from: "c5_06_factors_multiples", to: "c5_13_multiply_divide", type: "soft", minMastery: 0.62 },
    { from: "c5_07_see_the_pattern", to: "c5_13_multiply_divide", type: "soft", minMastery: 0.6 },
    { from: "c5_11_area_and_boundary", to: "c5_14_how_big_how_heavy", type: "soft", minMastery: 0.62 },
    { from: "c5_10_tenths_hundredths", to: "c5_12_smart_charts", type: "soft", minMastery: 0.58 },

    // Class 6 internal
    { from: "c6_01_knowing_our_numbers", to: "c6_02_whole_numbers", type: "hard", minMastery: 0.68 },
    { from: "c6_02_whole_numbers", to: "c6_03_playing_with_numbers", type: "hard", minMastery: 0.7 },
    { from: "c6_03_playing_with_numbers", to: "c6_07_fractions", type: "hard", minMastery: 0.7 },
    { from: "c6_07_fractions", to: "c6_08_decimals", type: "hard", minMastery: 0.72 },
    { from: "c6_04_basic_geometrical_ideas", to: "c6_05_understanding_elementary_shapes", type: "hard", minMastery: 0.66 },
    { from: "c6_05_understanding_elementary_shapes", to: "c6_14_practical_geometry", type: "hard", minMastery: 0.68 },
    { from: "c6_08_decimals", to: "c6_09_data_handling", type: "soft", minMastery: 0.6 },
    { from: "c6_05_understanding_elementary_shapes", to: "c6_10_mensuration", type: "hard", minMastery: 0.68 },
    { from: "c6_08_decimals", to: "c6_10_mensuration", type: "soft", minMastery: 0.6 },
    { from: "c6_02_whole_numbers", to: "c6_11_algebra", type: "hard", minMastery: 0.68 },
    { from: "c6_07_fractions", to: "c6_12_ratio_and_proportion", type: "hard", minMastery: 0.7 },
    { from: "c6_08_decimals", to: "c6_12_ratio_and_proportion", type: "soft", minMastery: 0.62 },
    { from: "c6_05_understanding_elementary_shapes", to: "c6_13_symmetry", type: "hard", minMastery: 0.65 },

    // Class 7 internal
    { from: "c7_01_integers", to: "c7_09_rational_numbers", type: "hard", minMastery: 0.72 },
    { from: "c7_02_fractions_decimals", to: "c7_09_rational_numbers", type: "hard", minMastery: 0.72 },
    { from: "c7_12_algebraic_expressions", to: "c7_04_simple_equations", type: "hard", minMastery: 0.7 },
    { from: "c7_05_lines_and_angles", to: "c7_06_triangle_properties", type: "hard", minMastery: 0.68 },
    { from: "c7_06_triangle_properties", to: "c7_07_congruence_of_triangles", type: "hard", minMastery: 0.7 },
    { from: "c7_05_lines_and_angles", to: "c7_10_practical_geometry", type: "hard", minMastery: 0.66 },
    { from: "c7_06_triangle_properties", to: "c7_10_practical_geometry", type: "soft", minMastery: 0.62 },
    { from: "c7_06_triangle_properties", to: "c7_11_perimeter_area", type: "hard", minMastery: 0.68 },
    { from: "c7_02_fractions_decimals", to: "c7_08_comparing_quantities", type: "hard", minMastery: 0.68 },
    { from: "c7_09_rational_numbers", to: "c7_08_comparing_quantities", type: "soft", minMastery: 0.6 },
    { from: "c7_12_algebraic_expressions", to: "c7_13_exponents_powers", type: "soft", minMastery: 0.62 },
    { from: "c7_05_lines_and_angles", to: "c7_14_symmetry", type: "hard", minMastery: 0.65 },
    { from: "c7_10_practical_geometry", to: "c7_15_visualising_solid_shapes", type: "soft", minMastery: 0.6 },
    { from: "c7_06_triangle_properties", to: "c7_15_visualising_solid_shapes", type: "soft", minMastery: 0.6 },

    // Cross-grade: Class 4 -> 5
    { from: "c4_11_tables_and_shares", to: "c5_06_factors_multiples", type: "hard", minMastery: 0.7 },
    { from: "c4_09_halves_and_quarters", to: "c5_04_parts_and_wholes", type: "hard", minMastery: 0.7 },
    { from: "c4_14_smart_charts", to: "c5_12_smart_charts", type: "hard", minMastery: 0.66 },
    { from: "c4_13_fields_and_fences", to: "c5_11_area_and_boundary", type: "hard", minMastery: 0.68 },
    { from: "c4_05_way_world_looks", to: "c5_08_mapping_your_way", type: "soft", minMastery: 0.58 },

    // Cross-grade: Class 5 -> 6
    { from: "c5_13_multiply_divide", to: "c6_03_playing_with_numbers", type: "hard", minMastery: 0.7 },
    { from: "c5_04_parts_and_wholes", to: "c6_07_fractions", type: "hard", minMastery: 0.7 },
    { from: "c5_10_tenths_hundredths", to: "c6_08_decimals", type: "hard", minMastery: 0.7 },
    { from: "c5_11_area_and_boundary", to: "c6_10_mensuration", type: "hard", minMastery: 0.68 },
    { from: "c5_02_shapes_and_angles", to: "c6_05_understanding_elementary_shapes", type: "hard", minMastery: 0.66 },
    { from: "c5_12_smart_charts", to: "c6_09_data_handling", type: "hard", minMastery: 0.66 },

    // Cross-grade: Class 6 -> 7
    { from: "c6_06_integers", to: "c7_01_integers", type: "hard", minMastery: 0.7 },
    { from: "c6_07_fractions", to: "c7_02_fractions_decimals", type: "hard", minMastery: 0.72 },
    { from: "c6_08_decimals", to: "c7_02_fractions_decimals", type: "hard", minMastery: 0.72 },
    { from: "c6_09_data_handling", to: "c7_03_data_handling", type: "hard", minMastery: 0.68 },
    { from: "c6_11_algebra", to: "c7_12_algebraic_expressions", type: "hard", minMastery: 0.7 },
    { from: "c6_11_algebra", to: "c7_04_simple_equations", type: "hard", minMastery: 0.7 },
    { from: "c6_10_mensuration", to: "c7_11_perimeter_area", type: "hard", minMastery: 0.68 },
    { from: "c6_05_understanding_elementary_shapes", to: "c7_05_lines_and_angles", type: "hard", minMastery: 0.66 },
    { from: "c6_14_practical_geometry", to: "c7_10_practical_geometry", type: "hard", minMastery: 0.68 },
    { from: "c6_13_symmetry", to: "c7_14_symmetry", type: "hard", minMastery: 0.66 },
  ],
};

// Fail fast during development if dataset shape or dependencies are invalid.
validateGraph(graphData);

const defaultMasteryByGrade = (gradeBand: string): number => {
  if (gradeBand === "G4") return 0.8;
  if (gradeBand === "G5") return 0.62;
  if (gradeBand === "G6") return 0.34;
  if (gradeBand === "G7") return 0.14;
  return 0.3;
};

export const starterMastery = Object.fromEntries(
  topics.map((topic) => [topic.id, defaultMasteryByGrade(topic.gradeBand)]),
);
