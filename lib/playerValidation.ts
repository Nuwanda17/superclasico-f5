import { COMMUNITY_TRAITS, type PlayerProfileInput, type RatingInput } from "../types/social";

export interface ValidationResult<T> { value?: T; errors: string[] }

export function validatePlayerProfile(input: PlayerProfileInput): ValidationResult<PlayerProfileInput> {
  const name = input.name.trim();
  const nameLength = Array.from(name).length;
  const errors: string[] = [];
  if (nameLength < 2) errors.push("El nombre debe tener al menos 2 caracteres.");
  if (nameLength > 30) errors.push("El nombre puede tener como máximo 30 caracteres.");
  if (input.number !== undefined && (!Number.isInteger(input.number) || input.number < 1 || input.number > 99)) {
    errors.push("El número debe estar entre 1 y 99.");
  }
  if (!(["cerro", "olimpia", "undecided"] as string[]).includes(input.team)) errors.push("Elegí un equipo válido.");
  if (!(["GK", "DEF", "MID", "FWD", "ALL"] as string[]).includes(input.preferredPosition)) errors.push("Elegí una posición válida.");
  return errors.length ? { errors } : { value: { ...input, name }, errors };
}

export function validateRating(input: RatingInput): ValidationResult<RatingInput> {
  const errors: string[] = [];
  const fields: Array<keyof Omit<RatingInput, "trait">> = ["technique", "finishing", "passing", "defense", "stamina", "goalkeeping", "magic", "grit", "hype", "chaos"];
  fields.forEach((field) => {
    if (!Number.isInteger(input[field]) || input[field] < 1 || input[field] > 10) errors.push(`${field} debe estar entre 1 y 10.`);
  });
  if (input.trait && !(COMMUNITY_TRAITS as readonly string[]).includes(input.trait)) errors.push("Elegí un rasgo válido.");
  return errors.length ? { errors } : { value: input, errors };
}
