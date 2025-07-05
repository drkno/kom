export const feelsLike = (tC?: number, rh?: number) => {
  if (tC == null || rh == null) return '-';
  const tF = tC * 1.8 + 32;
  const hiF =
    -42.379 +
    2.04901523 * tF +
    10.14333127 * rh -
    0.22475541 * tF * rh -
    0.00683783 * tF * tF -
    0.05481717 * rh * rh +
    0.00122874 * tF * tF * rh +
    0.00085282 * tF * rh * rh -
    0.00000199 * tF * tF * rh * rh;
  return ((hiF - 32) * (5 / 9)).toFixed(0);
};

export const dewPoint = (tC?: number, rh?: number) => {
  if (tC == null || rh == null) return '-';
  const a = 17.27,
    b = 237.7;
  const alpha = (a * tC) / (b + tC) + Math.log(rh / 100);
  return ((b * alpha) / (a - alpha)).toFixed(0);
};
