/**
 * Converts a number to Indian Rupees in words with standard mathematical rounding:
 * - If decimal part is < 0.5 (< 5), integer stays unchanged.
 * - If decimal part is >= 0.5 (>= 5), adds 1 (+1).
 * - No decimal digits or paise are included in the result.
 */
export const inrToWords = (num) => {
  const rounded = Math.round(Number(num) || 0);
  if (isNaN(rounded) || rounded === 0) return "Zero Rupees Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  const convert = (val) => {
    val = Math.floor(val);
    if (val === 0) return "";
    if (val < 20) return a[val];
    if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? "-" + a[val % 10] : "");
    if (val < 1000) return a[Math.floor(val / 100)] + " Hundred" + (val % 100 !== 0 ? " " + convert(val % 100) : "");
    if (val < 100000) return convert(Math.floor(val / 1000)) + " Thousand" + (val % 1000 !== 0 ? " " + convert(val % 1000) : "");
    if (val < 10000000) return convert(Math.floor(val / 100000)) + " Lakh" + (val % 100000 !== 0 ? " " + convert(val % 100000) : "");
    return convert(Math.floor(val / 10000000)) + " Crore" + (val % 10000000 !== 0 ? " " + convert(val % 10000000) : "");
  };

  const absVal = Math.abs(rounded);
  const words = convert(absVal).trim();
  return (words ? words + " Rupees" : "Zero Rupees") + " Only";
};

export default inrToWords;
