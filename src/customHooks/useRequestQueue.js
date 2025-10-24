
import { useRef, useCallback } from 'react';
const useRequestQueue = () => {
  const queue = useRef(new Map()); 
  const pending = useRef(new Set()); 

  const addToQueue = useCallback(async (key, requestFn) => {
    if (queue.current.has(key)) {

      return queue.current.get(key);
    }
    if (pending.current.has(key)) {
      return queue.current.get(key);
    }

    const promise = (async () => {
      try {
        
        pending.current.add(key);
        const result = await requestFn();
        return result;
      } finally {
        queue.current.delete(key);
        pending.current.delete(key);
      }
    })();

    queue.current.set(key, promise);
    return promise;
  }, []);

  return { addToQueue };
};

export default useRequestQueue;