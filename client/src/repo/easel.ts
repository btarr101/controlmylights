export type SavedEasel = {
	activeSplotchIndex?: number;
  colors: string[];
};

export function loadEasel(): SavedEasel | null {
  const value = localStorage.getItem("easel");

  if (value === null) {
    return null;
  }

  try {
    const savedEasel = JSON.parse(value);
    
    return savedEasel as SavedEasel;
  } catch (error) {
    console.error(`Failed to load easel: ${error}`);

    return null;
  }
}

export function saveEasel(easel: SavedEasel) {
  localStorage.setItem("easel", JSON.stringify(easel))
}
