// Money helpers. DB bigint paisa -> TS number paisa (1 taka = 100 paisa). No
// float taka math — toPaisa parses via string math to avoid float artifacts.

const BIRR_SYMBOL = 'ETB '

export function fromPaisa(paisa: number): number {
  return paisa / 100
}

/**
 * Parses a taka amount (string or number) into integer paisa via string math
 * — avoids classic float-multiplication artifacts (e.g. 1234.5 * 100).
 * Rounds half-up on the 3rd decimal digit if more than 2 fraction digits are given.
 */
export function toPaisa(taka: string | number): number {
  const raw = String(taka).trim()
  if (raw === '' || raw === '-') return 0

  const negative = raw.startsWith('-')
  const clean = (negative ? raw.slice(1) : raw).replace(/,/g, '')
  const [wholeRaw, fracRaw = ''] = clean.split('.')
  const whole = wholeRaw === '' ? '0' : wholeRaw

  const fracExtended = (fracRaw + '000').slice(0, 3)
  const keep = fracExtended.slice(0, 2)
  const roundUp = Number(fracExtended[2] ?? '0') >= 5

  let paisa = Number(whole) * 100 + Number(keep === '' ? '0' : keep)
  if (roundUp) paisa += 1

  return negative ? -paisa : paisa
}

/** "ETB 1,234" — drops .00, shows decimals only when the paisa remainder is non-zero. */
export function formatMoney(paisa: number, opts?: { symbol?: boolean }): string {
  const showSymbol = opts?.symbol ?? true
  const negative = paisa < 0
  const abs = Math.abs(Math.round(paisa))
  const whole = Math.floor(abs / 100)
  const frac = abs % 100

  const wholeFormatted = whole.toLocaleString('en-US')
  const amount =
    frac === 0 ? wholeFormatted : `${wholeFormatted}.${frac.toString().padStart(2, '0')}`

  return `${negative ? '-' : ''}${showSymbol ? BIRR_SYMBOL : ''}${amount}`
}

const ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
]
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

function threeDigitsToWords(n: number): string {
  const parts: string[] = []
  const hundreds = Math.floor(n / 100)
  const rest = n % 100

  if (hundreds) parts.push(`${ONES[hundreds]} hundred`)

  if (rest) {
    if (rest < 20) {
      parts.push(ONES[rest])
    } else {
      const tensDigit = Math.floor(rest / 10)
      const onesDigit = rest % 10
      parts.push(onesDigit ? `${TENS[tensDigit]}-${ONES[onesDigit]}` : TENS[tensDigit])
    }
  }

  return parts.join(' ')
}

/** BD/Indian numbering: crore (1,00,00,000) / lakh (1,00,000) / thousand / hundred. */
function integerToWordsBD(n: number): string {
  if (n === 0) return 'zero'

  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor((n % 10000000) / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const rest = n % 1000

  const parts: string[] = []
  if (crore) parts.push(`${threeDigitsToWords(crore)} crore`)
  if (lakh) parts.push(`${threeDigitsToWords(lakh)} lakh`)
  if (thousand) parts.push(`${threeDigitsToWords(thousand)} thousand`)
  if (rest) parts.push(threeDigitsToWords(rest))

  return parts.join(' ')
}

/** English amount-in-words for receipts, e.g. "One thousand five hundred taka". */
export function moneyToWords(paisa: number): string {
  const negative = paisa < 0
  const abs = Math.abs(Math.round(paisa))
  const whole = Math.floor(abs / 100)
  const frac = abs % 100

  let words = `${negative ? 'negative ' : ''}${integerToWordsBD(whole)} taka`
  if (frac > 0) {
    words += ` and ${integerToWordsBD(frac)} paisa`
  }

  return words.charAt(0).toUpperCase() + words.slice(1)
}

function trimTrailingZero(s: string): string {
  return s.endsWith('.0') ? s.slice(0, -2) : s
}

/** Compact taka display: "1.2k" / "3.4L" (lakh) / "2.1Cr" (crore). No symbol by default. */
export function formatCompact(paisa: number, opts?: { symbol?: boolean }): string {
  const showSymbol = opts?.symbol ?? false
  const negative = paisa < 0
  const taka = Math.abs(paisa) / 100

  let value: string
  if (taka >= 10000000) {
    value = `${trimTrailingZero((taka / 10000000).toFixed(1))}Cr`
  } else if (taka >= 100000) {
    value = `${trimTrailingZero((taka / 100000).toFixed(1))}L`
  } else if (taka >= 1000) {
    value = `${trimTrailingZero((taka / 1000).toFixed(1))}k`
  } else {
    value = trimTrailingZero(taka.toFixed(Number.isInteger(taka) ? 0 : 1))
  }

  return `${negative ? '-' : ''}${showSymbol ? BIRR_SYMBOL : ''}${value}`
}
