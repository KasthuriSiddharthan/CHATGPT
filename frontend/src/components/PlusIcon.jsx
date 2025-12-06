export default function PlusIcon({ size = 16 }) {
  return (
    <div
  style={{
    width: size + 8,
    height: size + 8,
    borderRadius: "50%",
    background: "#e0edff",  // light blue behind the plus
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        stroke="#2563eb"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <line x1="12" y1="6" x2="12" y2="18" />
        <line x1="6" y1="12" x2="18" y2="12" />
      </svg>
    </div>
  );
}
