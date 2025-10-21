# Learning: Implemented Slash Commands for Variable Insertion

## The Problem
User wanted a better UX for inserting variables into the system prompt. Initial implementation only had "click to append to bottom" which was confusing and led to duplicates.

## The Solution Journey

### 1. First Attempt: Click-to-Insert
- Added cursor tracking
- Click inserted at cursor position
- Still felt clunky

### 2. Second Attempt: Drag & Drop
- Added `draggable` attribute to variable chips
- Implemented `onDrop`, `onDragOver`, `onDragLeave` handlers
- Visual feedback with blue ring
- Better, but still not ideal

### 3. Final Solution: Slash Commands ⚡
Like Notion, Slack, and modern editors!

**How it works:**
1. Type `/` in the system prompt
2. Autocomplete menu appears with variable suggestions
3. Type to filter (e.g., `/prop` shows property_address)
4. Click or press Enter to insert
5. Variable is inserted with full formatted text

## Implementation Details

### State Management
```typescript
const [showSlashMenu, setShowSlashMenu] = useState(false)
const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 })
const [slashSearch, setSlashSearch] = useState('')
```

### Slash Detection Logic
```typescript
onChange={(e) => {
    const newValue = e.target.value;
    const cursorPos = e.currentTarget.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
    
    if (lastSlashIndex !== -1 && lastSlashIndex === cursorPos - 1) {
        // Just typed a slash - show menu
        setShowSlashMenu(true);
        setSlashSearch('');
    } else if (lastSlashIndex !== -1 && cursorPos > lastSlashIndex) {
        // Typing after slash - filter results
        const searchText = textBeforeCursor.substring(lastSlashIndex + 1);
        if (searchText.includes(' ') || searchText.includes('\n')) {
            setShowSlashMenu(false); // Space or newline closes menu
        } else {
            setSlashSearch(searchText.toLowerCase());
        }
    }
}}
```

### Menu Rendering
```typescript
{showSlashMenu && (
    <div className="absolute z-50 mt-1 bg-white border-2 border-blue-400 rounded-lg shadow-xl">
        {config.variables
            .filter(v => v.name.toLowerCase().includes(slashSearch))
            .map((variable) => (
                <button onClick={() => {
                    // Insert variable at slash position
                    const textBeforeCursor = config.systemPrompt.substring(0, lastSlashIndex);
                    const textAfterCursor = config.systemPrompt.substring(lastSlashIndex + searchLength + 1);
                    handleUpdateConfig({ 
                        systemPrompt: textBeforeCursor + insertText + textAfterCursor 
                    });
                    setShowSlashMenu(false);
                }}>
                    /{variable.name} - {variable.displayName}
                </button>
            ))}
    </div>
)}
```

## UX Features

### Visual Indicators
- **Variable chips show slash command**: `Property Address /property_address`
- **Autocomplete menu**: Appears immediately below cursor
- **Filtered results**: Type to narrow down options
- **Required badge**: Shows which variables are required
- **Hover states**: Clear visual feedback

### Keyboard Shortcuts
- `/` - Opens slash menu
- `Escape` - Closes menu
- `Backspace` on empty search - Closes menu
- Type to filter
- Click to insert

### Fallback Options
Still support drag & drop for users who prefer it!

## The Lesson Learned

**So now we know:**
1. **Slash commands are the gold standard** for modern text editors
2. **Progressive disclosure**: Menu only shows when needed
3. **Fuzzy search**: Filter by variable name or display name
4. **Multiple input methods**: Slash commands + drag & drop = best of both worlds
5. **Visual feedback is crucial**: Show what's draggable, what's searchable

## Before/After UX

### Before (Bad):
- Click variable chip → adds to bottom
- No way to insert in middle
- Duplicates if you click multiple times
- Confusing UX

### After (Good):
- Type `/` → autocomplete menu
- Type `/prop` → filters to property_address
- Click to insert at cursor
- Clean, discoverable, intuitive

## Files Changed
- `src/app/agent-builder/[id]/page.tsx` - Added slash command system

## Status: ✅ SHIPPED
Slash commands are now live in Agent Builder!

