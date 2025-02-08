import React from 'react';
import ReactDOM from 'react-dom/client';
import './content.css';

interface TreeNode {
  element: Element;
  tagName: string;
  children: TreeNode[];
}

function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  
  return rect.width > 0 && 
         rect.height > 0 && 
         computedStyle.display !== 'none' && 
         computedStyle.visibility !== 'hidden' &&
         computedStyle.opacity !== '0';
}

function meetsRequirements(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Size requirements
  const meetsSize = rect.width >= 300 && rect.height >= 200;
  
  // X center line requirement (covers 1/2 of page width)
  const elementCenter = rect.left + rect.width / 2;
  const meetsXCenter = Math.abs(elementCenter - viewportWidth / 2) < viewportWidth / 4;
  
  // Y position requirement (top 1/3 or bottom 1/3)
  const elementMiddle = rect.top + rect.height / 2;
  const inTopThird = elementMiddle < viewportHeight / 3;
  const inBottomThird = elementMiddle > (viewportHeight * 2) / 3;
  const meetsYPosition = inTopThird || inBottomThird;
  
  return meetsSize && meetsXCenter && meetsYPosition && isElementVisible(element);
}

function buildTree(element: Element = document.body): TreeNode | null {
  if (!element) return null;
  
  const tagName = element.tagName.toLowerCase();
  const isTargetElement = ['article', 'section', 'div'].includes(tagName);
  
  if (isTargetElement && meetsRequirements(element)) {
    const node: TreeNode = {
      element,
      tagName,
      children: []
    };
    
    // Process children
    Array.from(element.children).forEach(child => {
      const childTree = buildTree(child);
      if (childTree) {
        node.children.push(childTree);
      }
    });
    
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
  
  return children.length > 0 ? {
    element,
    tagName,
    children
  } : null;
}

function TreeView({ node, level = 0 }: { node: TreeNode; level?: number }) {
  const [expanded, setExpanded] = React.useState(true);
  
  const handleClick = () => {
    // Remove previous highlights
    document.querySelectorAll('.page-extract-highlight').forEach(el => 
      el.classList.remove('page-extract-highlight')
    );
    
    // Add highlight to current element
    node.element.classList.add('page-extract-highlight');
  };
  
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    node.element.classList.toggle('page-extract-selected');
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
        <span>{node.tagName}</span>
        <button className="select-button" onClick={handleSelect}>☆</button>
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
    const newTree = buildTree();
    setTree(newTree);
  }, []);
  
  if (!tree) return null;
  
  return (
    <div className="tree-container">
      <TreeView node={tree} />
    </div>
  );
}

// Create container and render app
const container = document.createElement('div');
document.body.appendChild(container);
const root = ReactDOM.createRoot(container);
root.render(<App />);
