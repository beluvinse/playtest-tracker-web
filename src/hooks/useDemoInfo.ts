import { useQuery } from '@tanstack/react-query'
import { getDemoInfo, demoKeys } from '../api/demo'
import type { DemoInfoDto } from '../api/types'

// The demo accounts, for the pages of people who haven't signed in (the sign-in and sign-up pages).
// undefined while it loads, and for good if there is no demo (the API answers 404) or it can't be
// reached: in both cases the pages simply show nothing about it, as if it did not exist.
export function useDemoInfo(): DemoInfoDto | undefined {
  const { data } = useQuery({
    queryKey: demoKeys.info,
    queryFn: getDemoInfo,
    retry: false, // a 404 is an answer ("there is no demo"), not a failure to try again
    staleTime: 5 * 60 * 1000, // it hardly ever changes: don't ask again on every visit to the page
  })

  return data
}
