export function Background() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="orb-a absolute -top-36 -start-36 size-[36rem] rounded-full bg-primary/20 blur-3xl" />
      <div className="orb-b absolute top-1/4 -end-44 size-[32rem] rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="orb-a absolute bottom-[-8rem] left-1/3 size-[30rem] rounded-full bg-fuchsia-500/12 blur-3xl" />
      <div className="orb-b absolute bottom-1/4 -start-40 size-[24rem] rounded-full bg-sky-500/10 blur-3xl" />
    </div>
  );
}
