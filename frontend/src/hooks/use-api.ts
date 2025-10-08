import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export function useApiQuery<TQueryFnData = unknown, TError = Error>(
  key: readonly unknown[],
  path: string,
  options?: Omit<UseQueryOptions<TQueryFnData, TError, TQueryFnData, typeof key>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<TQueryFnData, TError, TQueryFnData, typeof key>({
    queryKey: key,
    queryFn: () => apiFetch<TQueryFnData>(path),
    retry: 1,
    staleTime: 30_000,
    ...options,
  });
}

export function useApiMutation<TData = unknown, TVariables = unknown, TError = Error>(
  path: string,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, unknown>, 'mutationFn'>,
) {
  return useMutation<TData, TError, TVariables, unknown>({
    mutationFn: (variables) =>
      apiFetch<TData>(path, {
        method: 'POST',
        body: variables as unknown as BodyInit,
      }),
    ...options,
  });
}
