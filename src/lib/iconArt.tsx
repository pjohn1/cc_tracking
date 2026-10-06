// Home-screen icon: a card on a green field. Rendered by next/og (inline styles required).
export function IconArt({ size }: { size: number }) {
  const u = size / 100;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d7a5f",
      }}
    >
      <div
        style={{
          width: 64 * u,
          height: 42 * u,
          borderRadius: 7 * u,
          background: "#f4f3ef",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 7 * u,
        }}
      >
        <div style={{ width: 13 * u, height: 10 * u, borderRadius: 2 * u, background: "#d4a64a" }} />
        <div style={{ display: "flex", gap: 3 * u }}>
          <div style={{ width: 20 * u, height: 4 * u, borderRadius: 2 * u, background: "#16191d" }} />
          <div style={{ width: 10 * u, height: 4 * u, borderRadius: 2 * u, background: "#5f6670" }} />
        </div>
      </div>
    </div>
  );
}
