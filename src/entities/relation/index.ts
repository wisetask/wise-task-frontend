export type { Matrix, MultiplyKind, RelationKind } from "./model/types";
export { copyMatrix, emptyMatrix, multiply, multiplyCell, power, sameMatrix } from "./model/matrix";
export { pathsOfLength, pathWeight } from "./model/paths";
export {
  isAntisymmetric,
  isAsymmetric,
  isConnected,
  isReflexive,
  isSymmetric,
  isTransitive,
  matchesKind,
} from "./model/properties";
export { generateRelation, MAX_SIZE, maxPairs, MIN_SIZE, minPairs } from "./model/generate";
