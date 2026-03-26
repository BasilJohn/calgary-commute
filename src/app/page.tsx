import { CommuteCalculator } from "@/components/CommuteCalculator";
import { mergeInitialCommuteState } from "@/lib/commute-url";

function searchParamsToURLSearchParams(
  raw: Record<string, string | string[] | undefined>
): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value[0] !== undefined) sp.set(key, value[0]);
    } else {
      sp.set(key, value);
    }
  }
  return sp;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const initial = mergeInitialCommuteState(searchParamsToURLSearchParams(raw));
  return <CommuteCalculator initial={initial} />;
}
