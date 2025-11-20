import { Day4Provider } from "./context";

export default function Day4Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Day4Provider>{children}</Day4Provider>;
}
