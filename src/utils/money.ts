export type MoneyValue = string | number | null | undefined;

const moneyParts = (value: MoneyValue) => {
  const raw = String(value ?? "0").trim();
  const match = raw.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!match) {
    return { sign: "", integer: "0", fraction: "00" };
  }

  const [, sign, integer, fraction = ""] = match;
  return {
    sign,
    integer: integer.replace(/^0+(?=\d)/, "") || "0",
    fraction: `${fraction}00`.slice(0, 2)
  };
};

export const formatMoney = (value: MoneyValue) => {
  const { sign, integer, fraction } = moneyParts(value);
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}¥${grouped}.${fraction}`;
};

export const moneyToCents = (value: MoneyValue) => {
  const { sign, integer, fraction } = moneyParts(value);
  const cents = BigInt(integer) * 100n + BigInt(fraction);
  return sign === "-" ? -cents : cents;
};

export const roundedYuanFromCents = (cents: bigint) => {
  const sign = cents < 0n ? "-" : "";
  const abs = cents < 0n ? -cents : cents;
  return `${sign}${(abs + 50n) / 100n}`;
};
