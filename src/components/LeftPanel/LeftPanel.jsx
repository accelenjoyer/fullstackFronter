import React, { useState, useEffect, useCallback, useRef } from 'react';
import useRequestQueue from '../../customHooks/useRequestQueue';
import "./LeftPanel.scss"

const LeftPanel = ({ selectedItems, setSelectedItems }) => {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectingIds, setSelectingIds] = useState(new Set());
  
  const { addToQueue } = useRequestQueue();
  const observer = useRef();
  const lastItemElementRef = useRef();

  const loadItems = useCallback(async (pageNum, search = '', reset = false) => {
    try {
      setIsLoading(true);
      const pageNumber = parseInt(pageNum, 10);
      
      const data = await addToQueue(
        `load-items-${pageNumber}-${search}`,
        async () => {
          const response = await fetch(
            `https://fullstackback-16a4.onrender.com/api/items?page=${pageNumber}&search=${search}&limit=20`
          );
          return response.json();
        }
      );
      
      if (reset) {
        setDisplayedItems(data.items);
      } else {
        setDisplayedItems(prev => [...prev, ...data.items]);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNumber);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [addToQueue]);

  useEffect(() => {
    loadItems(0, filter, true);
  }, []);

  useEffect(() => {
    loadItems(0, filter, true);
  }, [filter, loadItems]);

  useEffect(() => {
    if (isLoading) return;
    
    if (observer.current) {
      observer.current.disconnect();
    }
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadItems(page + 1, filter, false);
      }
    });
    
    if (lastItemElementRef.current) {
      observer.current.observe(lastItemElementRef.current);
    }
  }, [isLoading, hasMore, page, filter, loadItems]);

  const addItem = async (newId) => {
    if (!newId) return;
    
    try {
      const idNumber = parseInt(newId, 10);
      if (isNaN(idNumber)) {
        alert('Введите число');
        return;
      }
      
      await addToQueue(
        `add-item-${idNumber}`,
        async () => {
          const response = await fetch('https://fullstackback-16a4.onrender.com/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: idNumber })
          });
          return response.json();
        }
      );
      
      loadItems(0, filter, true);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const selectItem = async (item) => {
    if (selectingIds.has(item.id) || selectedItems.some(selected => selected.id === item.id)) {
      return;
    }
    
    try {
      setSelectingIds(prev => new Set(prev).add(item.id));
      
      await addToQueue(
        `select-item-${item.id}`,
        async () => {
          const response = await fetch(`https://fullstackback-16a4.onrender.com/api/select/${item.id}`, {
            method: 'POST'
          });
          return response.json();
        }
      );
      
      setSelectedItems(prev => [...prev, item]);
      setDisplayedItems(prev => prev.filter(displayedItem => displayedItem.id !== item.id));
    } catch (error) {
      console.error('Error selecting item:', error);
    } finally {
      setSelectingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const availableItems = displayedItems.filter(item => 
    !selectedItems.some(selected => selected.id === item.id)
  );

  return (
    <div className="left-panel">
      <h2>Все элементы</h2>
      <input 
        type="text"
        placeholder="Фильтр по ID"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      
      <button onClick={() => addItem(prompt('Введите ID'))}>
        Добавить элемент
      </button>

      <div className="items-list">
        {availableItems.length === 0 && !isLoading ? (
          <p>Элементы не найдены</p>
        ) : (
          availableItems.map((item, index) => {
            if (availableItems.length === index + 1) {
              return (
                <div key={item.id} className="item" ref={lastItemElementRef}>
                  ID: {item.id}
                  <button 
                    onClick={() => selectItem(item)}
                    disabled={selectingIds.has(item.id) || selectedItems.some(selected => selected.id === item.id)}
                  >
                    {selectingIds.has(item.id) ? '...' : 'Выбрать'}
                  </button>
                </div>
              );
            } else {
              return (
                <div key={item.id} className="item">
                  ID: {item.id}
                  <button 
                    onClick={() => selectItem(item)}
                    disabled={selectingIds.has(item.id) || selectedItems.some(selected => selected.id === item.id)}
                  >
                    {selectingIds.has(item.id) ? '...' : 'Выбрать'}
                  </button>
                </div>
              );
            }
          })
        )}
        
        {isLoading && <p>Загрузка...</p>}
      </div>
    </div>
  );
};

export default LeftPanel;