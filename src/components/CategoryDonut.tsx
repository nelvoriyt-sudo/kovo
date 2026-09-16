type Slice = { id: string; name: string; amount: number; color: string }

export function CategoryDonut({ slices, total }: { slices: Slice[]; total: number }) {
  const size = 200
  const stroke = 28
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  let offset = 0
  const arcs = slices.map((slice) => {
    const fraction = total > 0 ? slice.amount / total : 0
    const dash = fraction * circumference
    const arc = (
      <circle
        key={slice.id}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={slice.color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    )
    offset += dash
    return arc
  })

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[220px]" role="img" aria-label="Spending by category">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f2ede6" strokeWidth={stroke} />
      {arcs}
    </svg>
  )
}
