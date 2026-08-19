export function Background() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20 [mask-image:radial-gradient(ellipse_90%_65%_at_50%_0%,black_30%,transparent_75%)]" />
      <div className="orb-a absolute -top-36 -start-36 size-[36rem] rounded-full bg-primary/20 blur-3xl" />
      <div className="orb-b absolute top-1/4 -end-44 size-[32rem] rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="orb-a absolute bottom-[-8rem] left-1/3 size-[30rem] rounded-full bg-fuchsia-500/12 blur-3xl" />
      <div className="orb-b absolute bottom-1/4 -start-40 size-[24rem] rounded-full bg-sky-500/10 blur-3xl" />
    </div>
  );
}
