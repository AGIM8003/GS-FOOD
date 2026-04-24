/**
 * SOTA DESIGN HEURISTICS MODULE FOR 13.NWP
 * Injects Belgian/NWP-specific design guidance automatically into the context envelope
 */

export function loadHeuristicsByProjectFamily(project_type, room_type) {
  const heuristics = [];
  const pt = (project_type || '').toLowerCase();
  const rt = (room_type || '').toLowerCase();

  heuristics.push("NWP Policy: Always confirm the property is in Belgium or bordering EU zones for installation.");

  if (rt.includes('kitchen') || pt.includes('kitchen')) {
    heuristics.push("Kitchen Heuristic: Suggest FSC-certified wood cores. Ask about the work triangle (sink/stove/fridge) layout.");
    heuristics.push("Kitchen Heuristic: If space is tight, suggest integrating appliances or using a peninsula instead of an island.");
  }
  
  if (rt.includes('bathroom') || pt.includes('bathroom')) {
    heuristics.push("Bathroom Heuristic: Moisture risk is high. Recommend MR (Moisture Resistant) MDF or solid surface materials.");
    heuristics.push("Bathroom Heuristic: Confirm if plumbing needs to be moved, as this increases budget and timeline significantly.");
  }
  
  if (rt.includes('dressing') || rt.includes('wardrobe')) {
    heuristics.push("Wardrobe Heuristic: Ask about hinged vs sliding doors. Sliding doors save floor space but have higher hardware costs.");
    heuristics.push("Wardrobe Heuristic: Ceiling height is crucial. Suggest floor-to-ceiling for maximum storage and a built-in look.");
  }

  if (rt.includes('commercial') || pt.includes('commercial')) {
    heuristics.push("Commercial Heuristic: Focus heavily on durability. Suggest HPL (High Pressure Laminate) over lacquer for high-traffic zones.");
    heuristics.push("Commercial Heuristic: Ask about brand colors to match the corporate identity with the finish.");
  }

  if (heuristics.length === 1) {
    heuristics.push("General Guidance: Determine if the priority is speed, low cost, or premium custom finishing.");
  }

  return heuristics;
}

export function appendHeuristicsToPromptContext(brief, promptContext) {
  const h = loadHeuristicsByProjectFamily(brief.project_type, brief.room_type);
  promptContext.applied_heuristics = h;
  promptContext.directive += ` Keep these domain heuristics in mind: ${h.join(' ')}`;
}
