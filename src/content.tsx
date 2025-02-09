import React from 'react';
import ReactDOM from 'react-dom/client';
import './content.css';

interface TreeNode {
  element: Element;
  tagName: string;
  children: TreeNode[];
  ownText: string;
  multiChildren: boolean;
}

function isElementVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         element.getBoundingClientRect().height > 0;
}

function meetsRequirements(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Size requirements
  const meetsSize = rect.width >= 100 && rect.height >= 100;
  
  // X-center position requirement (within middle 80% of viewport)
  const leftBound = viewportWidth * 0.1;
  const rightBound = viewportWidth * 0.9;
  const meetsXCenter = rect.left >= leftBound && rect.right <= rightBound;
  
  // Y position requirement (within viewport)
  const meetsYPosition = rect.top >= 0 && rect.bottom <= viewportHeight;
  
  return meetsSize && meetsXCenter && meetsYPosition && isElementVisible(element);
}

function buildTree(element: Element = document.body): TreeNode | null {
  if (!element) return null;
  
  const tagName = element.tagName.toLowerCase();
  const isTargetElement = ['article', 'section', 'div'].includes(tagName);
  
  // Helper function to get text content excluding TreeNode elements
  const getOwnText = (el: Element): string => {
    let text = '';
    el.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const trimmed = node.textContent?.trim() || '';
        if (trimmed) text += ' ' + trimmed;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const childEl = node as Element;
        // Only include text from non-target elements
        if (!['article', 'section', 'div'].includes(childEl.tagName.toLowerCase())) {
          text += ' ' + getOwnText(childEl);
        }
      }
    });
    return text.trim();
  };

  if (isTargetElement && meetsRequirements(element)) {
    const node: TreeNode = {
      element,
      tagName,
      children: [],
      ownText: getOwnText(element),
      multiChildren: false
    };
    
    // Process children
    Array.from(element.children).forEach(child => {
      const childTree = buildTree(child);
      if (childTree) {
        node.children.push(childTree);
      }
    });
    
    // Set multiChildren after processing all children
    node.multiChildren = node.children.length > 1;
    
    return node;
  }
  
  // If not a target element, continue searching children
  let children: TreeNode[] = [];
  Array.from(element.children).forEach(child => {
    const childTree = buildTree(child);
    if (childTree) {
      children.push(childTree);
    }
  });
  
  if (children.length > 0) {
    return {
      element,
      tagName,
      children,
      ownText: getOwnText(element),
      multiChildren: children.length > 1
    };
  }
  
  return null;
}

function TreeView({ node, level = 0 }: { node: TreeNode; level?: number }) {
  const [expanded, setExpanded] = React.useState(true);
  const [isClicked, setIsClicked] = React.useState(false);
  const [isSelected, setIsSelected] = React.useState(false);
  
  const handleClick = () => {
    // Remove previous highlights and underlines
    document.querySelectorAll('.page-extract-highlight').forEach(el => {
      el.classList.remove('page-extract-highlight');
    });
    document.querySelectorAll('.tree-item-clicked').forEach(el => {
      el.classList.remove('tree-item-clicked');
    });
    
    // Add highlight to current element
    node.element.classList.add('page-extract-highlight');
    setIsClicked(true);
  };
  
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    node.element.classList.toggle('page-extract-selected');
    setIsSelected(!isSelected);
  };
  
  return (
    <div className="tree-node">
      <div className="node-content" onClick={handleClick}>
        <span 
          className="expand-icon"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {node.children.length > 0 ? (expanded ? '▼' : '▶') : '•'}
        </span>
        <span className={isClicked ? 'tree-item-clicked' : ''} style={{
          fontWeight: node.ownText ? 'bold' : 'normal',
          color: node.multiChildren ? 'red' : 'inherit'
        }}>
          {node.tagName}
        </span>
        <button 
          className={`select-button ${isSelected ? 'select-button-selected' : ''}`} 
          onClick={handleSelect}
        >
          {isSelected ? '★' : '☆'}
        </button>
      </div>
      {expanded && node.children.map((child, index) => (
        <TreeView key={index} node={child} level={level + 1} />
      ))}
    </div>
  );
}

function App() {
  const [tree, setTree] = React.useState<TreeNode | null>(null);
  
  React.useEffect(() => {
    const tree = buildTree();
    setTree(tree);
  }, []);
  
  if (!tree) return null;
  
  return (
    <div className="page-extract-app">
      <TreeView node={tree} />
    </div>
  );
}

// Only create and render when receiving message from background script
chrome.runtime.onMessage.addListener((message: { type: string }, _sender, sendResponse) => {
  console.log('Received message:', message.type); // Debug log

  if (message.type === 'CHECK_MOUNT') {
    sendResponse(true);
    return true;
  }
  
  if (message.type === 'MOUNT_APP') {
    console.log('Mounting app...'); // Debug log
    // Check if app is already mounted
    if (!document.querySelector('.page-extract-app')) {
      // Create a floating container
      const floatContainer = document.createElement('div');
      floatContainer.className = 'page-extract-float-container';
      document.body.appendChild(floatContainer);

      const root = ReactDOM.createRoot(floatContainer);
      root.render(<App />);
      console.log('App mounted'); // Debug log
    } else {
      console.log('App already mounted'); // Debug log
    }
  }
  return true;
});
