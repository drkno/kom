import { useEffect, useState } from 'react';
import type { LoadingOrValue } from './types.tsx';

interface State<T, R> {
    params: T | null;
    value: R | null;
}

const useApi = <T, R>(params: T, defaultValue: R | null, mockValues: R, loadData: (loadParams: T) => Promise<R>): LoadingOrValue<R> => {
    const [state, setState] = useState<State<T, R>>({
        params: null,
        value: defaultValue
    });

    const isCurrent = JSON.stringify(params) === JSON.stringify(state.params);

    useEffect(() => {
        if (isCurrent) {
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const data = await loadData(params);
                if (!cancelled) {
                    setState({ params, value: data });
                }
            } catch (error) {
                console.error('Error loading data:', error);
                if (!cancelled && import.meta.env.DEV) {
                    setState({ params, value: mockValues });
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [params, loadData, mockValues, isCurrent]);

    if (!isCurrent || state.value === null) {
        return { loading: true };
    }
    return { loading: false, value: state.value };
};

export default useApi;
