import LeftPanel from './components/LeftPanel/LeftPanel';
import RightPanel from './components/RightPanel/RightPanel';
import './App.scss';
import { useState } from 'react';
function App() {
  const [selectedItems, setSelectedItems] = useState([])
  return (
    <div className="App">
     <LeftPanel 
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
      />
      <RightPanel 
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
      />
    </div>
  );
}

export default App;
