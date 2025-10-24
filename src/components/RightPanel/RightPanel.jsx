import React, { useState, useEffect, useCallback } from 'react';
import useRequestQueue from '../../customHooks/useRequestQueue';
import './RightPanel.scss';

const RightPanel = ({ selectedItems, setSelectedItems }) => {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const { addToQueue } = useRequestQueue();

  const loadSelectedItems = useCallback(async (pageNum, search = '', reset = false) => {
    try {
      setIsLoading(true);
      const pageNumber = parseInt(pageNum, 10);
      
      const data = await addToQueue(
        `load-selected-${pageNumber}-${search}`,
        async () => {
          const response = await fetch(
            `https://fullstackback-16a4.onrender.com/api/selected?page=${pageNumber}&search=${search}&limit=20`
          );
          return response.json();
        }
      );
      
      if (reset) {
        setSelectedItems(data.items);
      } else {
        setSelectedItems(prev => [...prev, ...data.items]);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNumber);
    } catch (error) {
      console.error('Error loading selected items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [addToQueue, setSelectedItems]);

  useEffect(() => {
    loadSelectedItems(0, filter, true);
  }, [loadSelectedItems]);

  useEffect(() => {
    loadSelectedItems(0, filter, true);
  }, [filter, loadSelectedItems]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      loadSelectedItems(page + 1, filter, false);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await addToQueue(
        `remove-item-${itemId}`,
        async () => {
          const response = await fetch(`https://fullstackback-16a4.onrender.com/api/select/${itemId}`, {
            method: 'DELETE'
          });
          return response.json();
        }
      );
      
      setSelectedItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (draggedIndex !== targetIndex) {
      const newOrder = [...selectedItems];
      const [movedItem] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, movedItem);
      
      try {
        await addToQueue(
          `reorder-${Date.now()}`,
          async () => {
            const response = await fetch('https://fullstackback-16a4.onrender.com/api/reorder', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                orderedIds: newOrder.map(item => item.id) 
              })
            });
            return response.json();
          }
        );
        
        setSelectedItems(newOrder);
      } catch (error) {
        console.error('Error reordering items:', error);
      }
    }
  };

  const filteredItems = selectedItems.filter(item =>
    item.id.toString().includes(filter)
  );

  return (
    <div className="right-panel">
      <h2>Выбранные элементы</h2>
      <input
        type="text"
        placeholder="Фильтр по ID"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="items-list">
        {filteredItems.length === 0 && !isLoading ? (
          <p>Нет выбранных элементов</p>
        ) : (
          filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="item"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              ID: {item.id}
              <button onClick={() => removeItem(item.id)}>
                Удалить
              </button>
            </div>
          ))
        )}
        
        {isLoading && <p>Загрузка...</p>}
        
        {hasMore && !isLoading && filteredItems.length > 0 && (
          <button onClick={loadMore}>Загрузить еще </button>
        )}
      </div>
    </div>
  );
};

export default RightPanel;