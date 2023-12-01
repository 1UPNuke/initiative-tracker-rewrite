export type DamageTypeString = "acid"|"bludgeoning"|"cold"|"fire"|"force"|"lightning"|"necrotic"|"piercing"|"poison"|"psychic"|"radiant"|"slashing"|"thunder"|"other";

export type DamageTypeModifier = {
  type : DamageTypeString;
  magical : "nonmagical" | "magical" | "both-magical";
  silvered : "silvered" | "nonsilvered" | "both-silver";
  adamantine: "adamantine" | "nonadamantine" | "both-adamantine";
  modifier : "resistance" | "vulnerability" | "immunity";
  desc: string;
};
