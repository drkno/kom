import { useEffect, useState } from 'react';
import type { LoadingOrValue } from './types.tsx';

interface State<T, R> {
    params: T | null;
    value: R | null;
}

const useApi = <T, R>(params: T, defaultValue: R | null, mockValues: R, loadData: (loadParams: T) => Promise<R>): LoadingOrValue<R> => {
    const [isLoading, setIsLoading] = useState(false);
    const [state, setState] = useState<State<T, R>>({
        params: null,
        value: defaultValue
    });

    useEffect(() => {
        if (isLoading) {
            return;
        }
        setIsLoading(true);
        (async () => {
            try {
                if (JSON.stringify(params) === JSON.stringify(state.params)) {
                    return;
                }
                const data = await loadData(params);
                setState({
                    params,
                    value: data
                });
            } catch (error) {
                console.error('Error loading data:', error);
                if (import.meta.env.DEV) {
                    setState({
                        params,
                        value: mockValues
                    });
                }
            } finally {
                setIsLoading(false);
            }
        })();
    }, [params, loadData, mockValues, isLoading, state.params]);

    if (isLoading || state.value === null) {
        return { loading: true };
    }
    return { loading: false, value: state.value };
};

export default useApi;
