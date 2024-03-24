import states from "states-us";
export function getOperatingGroup(operatingGroup: string) {
  switch (operatingGroup) {
    case "Community Support Services":
      return "CSS";
    case "Adult Day Health":
      return "ADH";
    case "NeuroRestorative":
      return "Neuro";
    case "Children Family Services":
      return "CFS";
    case "Corporate":
      return "Corp";
    default:
      return undefined;
  }
}

export function getStateFullName(abbreviation: string): string | undefined {
  const state = states.find((s) => s.abbreviation === abbreviation);
  return state ? state.name : undefined;
}
