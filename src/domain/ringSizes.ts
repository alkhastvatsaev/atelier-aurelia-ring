export function euSizeToInnerDiameterMm(size: number) {
  return size / Math.PI
}

export function euSizeToInnerRadiusMm(size: number) {
  return euSizeToInnerDiameterMm(size) / 2
}

export function innerDiameterMmToEuSize(diameterMm: number) {
  return diameterMm * Math.PI
}
