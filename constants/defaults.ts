
export const DEFAULT_ABC = `X: 1
T: Cooley's (Multi-Track Demo)
M: 4/4
L: 1/8
R: reel
K: Emin
%%score (Melody Backing)
V:Melody name="Melody" snm="M" clef=treble
|:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|
EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|
|:gf|eB B2 efge|eB B2 gedB|A2 FA DAFA|A2 FA defg|
eB B2 eBgB|eB B2 defg|afe^c dBAF|DEFD E2:|
V:Backing name="Backing" snm="B" clef=bass
|:z2|E,4 E,4|E,4 E,4|D,4 D,4|D,4 D,4|
E,4 E,4|E,4 E,4|D,4 D,4|E,4 E,4:|
|:z2|E,4 E,4|E,4 E,4|D,4 D,4|D,4 D,4|
E,4 E,4|E,4 E,4|D,4 D,4|E,4 E,4:|`;

export const DEFAULT_SHORTCUTS: Record<string, string> = {
    'file.new': 'Alt+N',
    'file.import': 'Ctrl+O',
    'file.export': 'Ctrl+E',
    'edit.undo': 'Ctrl+Z',
    'edit.redo': 'Ctrl+Y',
    'view.sidebar': 'Ctrl+B',
    'view.focus': 'Alt+Z',
    'view.zoomin': 'Ctrl+=',
    'view.zoomout': 'Ctrl+-',
    'view.zoomreset': 'Ctrl+0',
    'help.shortcuts': 'Shift+?'
};

export const SHORTCUT_LABELS: Record<string, { label: string; category: 'General' | 'Edit' | 'View' | 'Help' }> = {
    'file.new': { label: 'New Project', category: 'General' },
    'file.import': { label: 'Import File', category: 'General' },
    'file.export': { label: 'Export ABC', category: 'General' },
    'edit.undo': { label: 'Undo', category: 'Edit' },
    'edit.redo': { label: 'Redo', category: 'Edit' },
    'view.sidebar': { label: 'Toggle Sidebar', category: 'View' },
    'view.focus': { label: 'Toggle Focus Mode', category: 'View' },
    'view.zoomin': { label: 'Zoom In', category: 'View' },
    'view.zoomout': { label: 'Zoom Out', category: 'View' },
    'view.zoomreset': { label: 'Reset Zoom', category: 'View' },
    'help.shortcuts': { label: 'Keyboard Shortcuts', category: 'Help' }
};
